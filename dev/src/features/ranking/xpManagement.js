import { MessageEmbed } from 'discord.js'
import db from '../../db/index.js'
import bot from '../../bot.js'
import config from './config.js'

/**
 * Calcul XP needed for a level
 * @param {Number} lvl aimed level
 * @returns XP needed
 */
const calc = lvl => Math.round(0.25 * lvl * (2.6236 * lvl * lvl + 27 * lvl + 91))

/**
 * Find level from XP
 */
const findLvl = XP => {
  let lvl = 0
  while (calc(lvl) <= XP) lvl++
  return lvl - 1
}

/**
 * Retourne les données de ranking du membre
 */
export const getMemberRankInfo = async memberID => {
  const defaultUserRankingInfo = { textLVL: 0, textXP: 0, oralLVL: 0, oralXP: 0, lvl: 0, lastXP: null }
  return { ...defaultUserRankingInfo, ...(await db.get('ranking', 'members', memberID)) }
}

/**
 * Lorsqu'un membre gagne de l'XP
 */
export const earnXP = async (msg, member, type, xpEarned) => {
  const lastXP = new Date().toISOString()
  let userRankingInfo = await getMemberRankInfo(member.user.id)

  // Vérifie si le membre peut gagner de l'XP
  if (!canEarnXP(type, userRankingInfo.textLVL, userRankingInfo.oralLVL)) return false

  // Update de l'XP et level
  const oldLevel = userRankingInfo[type === 'text' ? 'textLVL' : 'oralLVL']
  userRankingInfo[type === 'text' ? 'textXP' : 'oralXP'] += xpEarned
  userRankingInfo[type === 'text' ? 'textLVL' : 'oralLVL'] = findLvl(
    userRankingInfo[type === 'text' ? 'textXP' : 'oralXP']
  )
  userRankingInfo.lastXP = lastXP

  // Update de son level
  const oldGlobalLevel = userRankingInfo.lvl
  userRankingInfo.lvl = Math.floor((userRankingInfo.textLVL + userRankingInfo.oralLVL) / 2)

  // Vérifier si il a rank up
  const rankUp = oldLevel < userRankingInfo[type === 'text' ? 'textLVL' : 'oralLVL']
  const rankUpGlobal = oldGlobalLevel < userRankingInfo.lvl

  // Update BDD
  db.set('ranking', 'members', member.user.id, userRankingInfo).then(() => {
    if (!rankUp) return

    // Rank up
    const xpType = type === 'text' ? "l'écrit" : "l'oral"
    const lvlShow = userRankingInfo[type === 'text' ? 'textLVL' : 'oralLVL']
    const rankUpEmbed = getEmbedBase(member)
    rankUpEmbed.addFields({
      name: `Félicitation !`,
      value: `Vous avez monté d'un niveau à ${xpType}. Vous êtes maintenant level ${lvlShow}. `
    })

    // Rank up global - Atteint le pallier de blocage
    if (rankUpGlobal) {
      rankUpEmbed.addFields({
        name: `Level up !`,
        value: `Votre niveau sur le serveur est également monté à ${userRankingInfo.lvl}. `
      })

      // Set role to rank
      if (config.rankRoles[userRankingInfo.lvl]) {
        for (let lvl in config.rankRoles) {
          const role = config.rankRoles[lvl]
          member.roles.remove(role)
        }

        member.roles.add(config.rankRoles[userRankingInfo.lvl])
      }
    }

    // Rank up global
    const blocked = !canEarnXP(type, userRankingInfo.textLVL, userRankingInfo.oralLVL)
    if (blocked) {
      rankUpEmbed.addFields({
        name: `Attention toutefois...`,
        value: `votre XP à ${xpType} est suspendu tant que vous n'avez pas atteint le même level à ${xpType}. `
      })
    }

    alert(msg, { content: `<@${member.user.id}>`, embeds: [rankUpEmbed] })
  })
}

/**
 * Vérifier le ranking pour savior si la personne peut ou non gagner de l'XP
 */
const canEarnXP = (type, textLVL, oralLVL) => {
  // Text check
  if (type === 'text') {
    if (textLVL < 10) return true
    else if (textLVL === 10 && oralLVL >= 10) return true
    else if (textLVL === 20 && oralLVL >= 20) return true
    else if (textLVL === 40 && oralLVL >= 40) return true
    else if (textLVL === 50 && oralLVL >= 50) return true
    else return false
  }

  // Oral check
  else if (type === 'oral') {
    if (oralLVL < 10) return true
    else if (oralLVL === 10 && textLVL >= 10) return true
    else if (oralLVL === 20 && textLVL >= 20) return true
    else if (oralLVL === 40 && textLVL >= 40) return true
    else if (oralLVL === 50 && textLVL >= 50) return true
    return false
  }
}

/**
 * Envoyer un message suite à une action (level up, rank up, reset XP, ...)
 */
const alert = (msg, message) => {
  if (!config.rankChannel && msg) msg?.reply(message)
  else bot.channels.cache.get(config.rankChannel).send(message)
}

/**
 * Attribuer un niveau (écrit/oral) à un membre
 */
const setLvl = async (msg, member, type, lvl) => {
  const memberID = member.startsWith('<@!') ? member.slice(3, -1) : member
  const [memberData] = msg?.guild.members.cache.filter(member => member.id === memberID) || []
  const [, guildMember] = memberData
  earnXP(msg, guildMember, type, calc(lvl))
}

/**
 * Attribuer un rôle lorsque le membre atteint un certain niveau
 */
const setLvlRole = async (msg, lvl, role) => {
  // Vérifier que le level est un nombre supérieur à 0
  const level = parseInt(lvl, 10)
  if (isNaN(level) || level < 1) {
    msg?.reply('Le niveau attribué est incorrect (pas un nombre ou en dessous de 1)')
    return false
  }

  // Retirer le rôle pour un level spécifique
  if (!role) {
    delete config.rankRoles[lvl]
    config.setConfig('rankRoles', config.rankRoles)
  }

  // Ajouter le rôle pour un level spécifique
  else {
    // Vérifier que le rôle existe sur le serveur
    const roleID = role.startsWith('<@&') ? role.slice(3, -1) : role
    const selectedRole = msg?.guild.roles.cache.filter(r => r.id === roleID)
    if (selectedRole.size === 0) {
      msg?.reply("Le rôle que vous essayez d'attribué n'existe pas sur ce serveur")
      return false
    }

    // Ajouter le rôle
    config.rankRoles[lvl] = roleID
    config.setConfig('rankRoles', config.rankRoles)
    msg?.reply(`Nouveau rôle pour le level ${lvl} : <@&${roleID}>`)
  }
}

/**
 * Réinitialiser l'XP d'un membre
 */
export const resetXP = async (msg, member, withMsg = true) => {
  const memberID = member.startsWith('<@!') ? member.slice(3, -1) : member
  await db.del('ranking', 'members', memberID)
  if (withMsg) alert(msg, `L'expérience du membre ${memberID} a été réinitialisé`)
}

/**
 * Message Embed de base pour une info d'utilisateur
 */
const getEmbedBase = member => {
  const embed = new MessageEmbed().setColor('#1976D2').setTimestamp()
  if (member) {
    embed.setTitle(member?.nickname || member?.user?.username)
    embed.setThumbnail(member?.avatarURL() || member?.user?.avatarURL())
  }

  return embed
}

/**
 * Affichage des informations de ranking du membre
 */
const rank = async msg => {
  const info = await getMemberRankInfo(msg?.member.id)
  const rankEmbed = getEmbedBase(msg?.member)
  rankEmbed.addFields(
    { name: `Niveau : ${info.lvl}`, value: '\u200B' },
    { name: `Niveau écrit : ${info.textLVL}`, value: `Prochain level : ${info.textXP}/${calc(info.textLVL + 1)}` },
    { name: `Niveau oral : ${info.oralLVL}`, value: `Prochain level : ${info.oralXP}/${calc(info.oralLVL + 1)}` }
  )

  msg?.channel.send({ content: `<@${msg?.member?.id}>`, embeds: [rankEmbed] })
}

/**
 * Afficahge du top X du classement
 */
const top = async msg => {
  const topRank = await db.get('ranking', 'members', null, {
    orderBy: { field: 'lvl', order: 'desc' },
    limit: 20
  })

  const topEmbed = getEmbedBase(msg.member)
  topEmbed.setTitle('Top 20')
  let rank = 1
  topRank.forEach(doc => {
    const data = doc.data()
    const member = msg?.guild.members.cache.get(doc.id)
    if (member) {
      topEmbed.addFields({
        name: `${rank}. ${member?.nickname || member?.user?.username}`,
        value: `level : ${data.lvl}`
      })
      rank++
    }
  })

  msg?.channel.send({ embeds: [topEmbed] })
}

// Export
export default [
  {
    name: 'xp_setLvl',
    description: 'Attribuer un niveau à un membre xp_setLvl {memberID} {text|oral} {lvl_number}',
    func: (msg, params) => {
      if (params.length < 3) return false
      const [member, type, lvl] = params
      setLvl(msg, member, type, lvl)
    },
    admin: true
  },
  {
    name: 'xp_resetXP',
    description: "Reset les niveaux d'un membre xp_resetLvl {memberID}",
    func: (msg, params) => {
      if (params.length < 1) return false
      const [member] = params
      resetXP(msg, member)
    },
    admin: true
  },
  {
    name: 'xp_setLvlRole',
    description: "Attribuer un rôle lorsqu'un membre atteint un certain niveau",
    func: (msg, params) => {
      if (params.length < 1) return false
      else if (params.length === 1) setLvlRole(msg, params[0])
      else if (params.length === 2) setLvlRole(msg, params[0], params[1])
    },
    admin: true
  },
  {
    name: 'xp_rank',
    description: 'Afficher sa progression de niveau',
    func: rank,
    admin: false
  },
  {
    name: 'xp_top',
    description: `Afficher le top du classement`,
    func: top,
    admin: false
  }
]

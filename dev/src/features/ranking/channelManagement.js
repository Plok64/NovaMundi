import { MessageEmbed } from 'discord.js'
import { colors, sendEmbedMsg } from '../../helpers/index.js'
import config from './config.js'

/**
 * Add channels for XP
 */
const addChannels = (msg, channels) => {
  const guildChannels = msg?.guild.channels.cache.map(c => c.id)
  const channelAdd = channels
    .map(c => (c.startsWith('<#') ? c.slice(2, -1) : c))
    .filter(c => !config.channelAccepted.includes(c))
    .filter(c => guildChannels.includes(c))

  // No new channel to add
  if (channelAdd.length === 0) {
    sendEmbedMsg(msg, colors.warning, "Aucun nouveau salon n'a été ajouté")
    return false
  }

  // Add channels to config
  config.setConfig('channelAccepted', config.channelAccepted.concat(channelAdd))
  const embed = new MessageEmbed({ color: colors.success, title: 'Salons ajoutés avec succès' })
  embed.addField('Salons ajoutés : ', channelAdd.map(c => `<#${c}>`).join('\n'))
  msg?.channel.send({ embeds: [embed] })
}

/**
 * Remove channels for XP
 */
const removeChannels = (msg, channels) => {
  const channelRemove = channels
    .map(c => (c.startsWith('<#') ? c.slice(2, -1) : c))
    .filter(c => config.channelAccepted.includes(c))

  // No new channel to add
  if (channelRemove.length === 0) {
    sendEmbedMsg(msg, colors.warning, "Aucun salon n'a été retiré")
    return false
  }

  // Add channels to config
  config.setConfig(
    'channelAccepted',
    config.channelAccepted.filter(c => !channelRemove.includes(c))
  )
  const embed = new MessageEmbed({ color: colors.success, title: 'Salons retirés avec succès' })
  embed.addField('Salons retiré : ', channelRemove.map(c => `<#${c}>`).join('\n'))
  msg?.channel.send({ embeds: [embed] })
}

/**
 * Show list of channels for XP
 */
const showChannels = msg => {
  const sortChannels = {}
  const guildChannels = msg?.guild.channels.cache

  // Get all accepted channel in order
  guildChannels
    .filter(c => config.channelAccepted.includes(c.id))
    .sort((a, b) => {
      if (a.rawPosition < b.rawPosition) return -1
      if (a.rawPosition > b.rawPosition) return 1
      else return 0
    })
    .forEach(c => {
      if (!sortChannels[c.parentId || 'root']) {
        sortChannels[c.parentId || 'root'] = {}
        sortChannels[c.parentId || 'root'].channels = []
        if (c.parentId) sortChannels[c.parentId || 'root'].name = guildChannels.find(gc => gc.id === c.parentId).name
      }

      sortChannels[c.parentId || 'root'].channels.push(`<#${c.id}>`)
    })

  // Send message with list
  const embed = new MessageEmbed({ color: colors.infos, title: "Liste des salons acceptant l'XP écrit" })
  Object.values(sortChannels).forEach(v => embed.addField(v.name || '-', v.channels.join('\n')))
  msg?.channel.send({ embeds: [embed] })
}

// Export
export default [
  {
    name: 'xp_addChannels',
    description: "Ajoute un ou plusieurs channels acceptant l'XP écrit",
    func: addChannels,
    admin: true
  },
  {
    name: 'xp_removeChannels',
    description: "Retire un ou plusieurs channels acceptant l'XP écrit",
    func: removeChannels,
    admin: true
  },
  {
    name: 'xp_showChannels',
    description: "Montre la liste des channels acceptant l'XP écrit",
    func: showChannels,
    admin: true
  }
]

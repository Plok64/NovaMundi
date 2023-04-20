import bot from '../../bot.js'
import config from './config.js'
import { earnXP, resetXP } from './xpManagement.js'

// Users who recently post a message (and earn XP with it)
const recentUserID = []
const oralUserID = {}

// Functions for access xp
const memberIsHuman = member => !member?.user?.bot && !member?.user?.system
const memberXpPost = member => !recentUserID.includes(member?.id)
const channelIsAccepted = channelID => config.channelAccepted.includes(channelID)
const accessControl = (member, channelID) =>
  memberIsHuman(member) && memberXpPost(member) && channelIsAccepted(channelID)

// Functions for channel
const vocalChannelIsAccepted = channelId => !!channelId && config.channelAccepted.includes(channelId)
const joinningAcceptedVocal = (oldChannelId, newChannelId) =>
  !vocalChannelIsAccepted(oldChannelId) && vocalChannelIsAccepted(newChannelId)
const leavingAcceptedVocal = (oldChannelId, newChannelId) =>
  vocalChannelIsAccepted(oldChannelId) && !vocalChannelIsAccepted(newChannelId)

/**
 * On message sent
 */
bot.on('messageCreate', async msg => {
  // Control Access for Earning XP
  if (!msg && !msg?.member && msg?.channel) return false
  if (!accessControl(msg?.member, msg?.channel.id)) return false

  // Earn XP (text)
  earnXP(msg, msg?.member, 'text', 1)

  // Pause before earning XP by msg
  recentUserID.push(msg?.author.id)
  setTimeout(() => {
    recentUserID.splice(recentUserID.indexOf(msg?.author.id), 1)
  }, 1000 * config.textCooldown)
})

/**
 * On voice channel join/change/exit
 */
bot.on('voiceStateUpdate', (oldState, newState) => {
  // Control Access for Earning XP
  if (!accessControl(oldState.member, oldState.channelId) && !accessControl(newState.member, newState.channelId))
    return false

  // Get timestamp of event
  const timestamp = new Date().getTime()

  // Join vocal
  if (joinningAcceptedVocal(oldState.channelId, newState.channelId)) {
    oralUserID[newState.member.id] = { start: timestamp, deaf: 0 }
  }

  // Leave vocal
  else if (leavingAcceptedVocal(oldState.channelId, newState.channelId)) {
    const oralChannelTime = timestamp - (oralUserID[newState.member.id]?.start ?? timestamp)
    const vocalTime = oralChannelTime - (oralUserID[newState.member.id]?.deaf ?? timestamp)
    const afkTimeout = newState.channelId === newState.guild.afkChannelId ? newState.guild.afkTimeout * 1000 : 0
    const xpOral = Math.max(0, Math.floor((vocalTime - afkTimeout) / (config.oralCooldown * 1000)))
    if (xpOral > 0) earnXP(null, newState.member, 'oral', xpOral)
  }

  // ---

  // Member is now deaf
  if (!oldState.selfDeaf && newState.selfDeaf) {
    oralUserID[newState.member.id].startDeaf = timestamp
  }

  // Member is no more deaf
  else if (oldState.selfDeaf && !newState.selfDeaf) {
    oralUserID[newState.member.id].deaf += timestamp - (oralUserID[newState.member.id]?.startDeaf || 0)
  }
})

/**
 * Lorsqu'un membre a été banni
 */
bot.on('guildBanAdd', async (guild, user) => {
  resetXP(null, user.id, false) // Reset XP
})

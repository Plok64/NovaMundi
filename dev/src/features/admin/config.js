import { MessageEmbed } from 'discord.js'
import { colors, sendEmbedMsg } from '../../helpers/index.js'
import { config } from '../../bot.js'

// Other features config
import ranking from '../ranking/config.js'
const featuresConfigs = [ranking]

/**
 * Show list of BOT config
 */
const showConfig = msg => {
  const embed = new MessageEmbed({ color: colors.infos, title: `BOT - Configuration` })
  const configValues = Object.entries(config.configValue).map(([k, v]) => `${k}: \`${v}\``)
  embed.addField(`General`, `${configValues.join(`\n`)}`)
  featuresConfigs.forEach(fc => {
    const configFeatureTitle = fc.feature.charAt(0).toUpperCase() + fc.feature.slice(1)
    const configFeatureValues = Object.entries(fc.configValue).map(([k, v]) => `${k}: \`${v}\``)
    embed.addField(configFeatureTitle, `${configFeatureValues.join(`\n`)}`)
  })
  msg.reply({ embeds: [embed] })
}

/**
 * Change config param
 */
const setConfig = (msg, args) => {
  const title = 'Mise à jour de la configuration'
  const [feature, param, value] = args.length > 2 ? args : ['general', ...args]
  const featureConfig = feature === 'general' ? config : featuresConfigs.find(fc => fc.feature === feature)

  // Param does NOT exist
  if (
    (feature === 'general' && !Object.keys(config).includes(param)) ||
    !Object.keys(featureConfig?.configValue).includes(param)
  ) {
    sendEmbedMsg(msg, colors.warning, title, `Le paramètre ${param} n'existe pas`)
    return false
  }

  // Set general config
  if (feature === 'general' && config.setConfig(param, value)) {
    sendEmbedMsg(msg, colors.success, title, 'La mise à jour a été effectué avec succès')
  }
  // Set feature config
  else if (featureConfig?.setConfig(param, value)) {
    sendEmbedMsg(msg, colors.success, title, 'La mise à jour a été effectué avec succès')
  }
  // Error
  else sendEmbedMsg(msg, colors.error, title, 'La mise à jour a échoué')
}

// Export
export default [
  {
    name: 'showConfig',
    description: 'Montre la liste des configuration de BOT',
    func: showConfig,
    admin: true
  },
  {
    name: 'setConfig',
    description: 'Change un paramètre de config',
    func: setConfig,
    admin: true
  }
]

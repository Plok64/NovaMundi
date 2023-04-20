import { Permissions, MessageEmbed } from 'discord.js'
import { config } from './bot.js'
import { colors } from './helpers/index.js'
import features from './features/index.js'

// Help command
const help = (msg, args) => {
  const embed = new MessageEmbed({
    color: colors.infos,
    title: 'Liste des commandes'
  })

  const isAdmin = msg.member.permissions.has(Permissions.ALL)
  for (const name in features) {
    const feature = features[name]
    if (!isAdmin && feature.admin) continue

    const showCommand = isAdmin ? feature.commands : feature.commands.filter(command => !command.admin)
    const helpCommands = showCommand.map(cmd => `\`${config.prefix}${cmd.name}\` - ${cmd.description}`)
    embed.addField(`- ${feature.name.toUpperCase()}`, `${feature.description}\n${helpCommands.join(`\n`)}`)
  }

  msg.channel.send({ embeds: [embed] })
}

export default help

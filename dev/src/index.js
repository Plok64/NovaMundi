import bot, { config } from './bot.js'
import { Permissions } from 'discord.js'
import features from './features/index.js'
import help from './help.js'

// On Ready
bot.on('ready', () => console.log(`${bot.user.tag} is now on !`))

/**
 * Command list
 */
const commands = { help: { name: 'help', func: help } }
for (const name in features) {
  const feature = features[name]
  feature.commands.forEach(cmd => (commands[cmd.name] = cmd))
}

/**
 * On message sent
 */
bot.on('messageCreate', msg => {
  const { content } = msg

  // Do nothing if it's not a command
  if (!content.startsWith(config.prefix)) return

  // If user try to do a commands, get arguments
  const args = content.split(' ')
  const command = args.shift().substr(1)

  // If command does not exist, do nothing
  if (!commands[command]) return

  // Do nothing if user does not have admin permission for an admin command
  if (!msg.member.permissions.has(Permissions.ALL) && commands[command].admin) return

  // Execture command
  commands[command].func(msg, args)
})

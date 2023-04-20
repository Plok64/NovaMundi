import dotenv from 'dotenv'
import { Client, Intents } from 'discord.js'
import Configurator from './helpers/Configurator.js'

// Bot intents (read discordjs doc for more informations)
const intents = new Intents()
intents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILD_PRESENCES,
  Intents.FLAGS.GUILD_VOICE_STATES
)

// Create BOT
const client = new Client({ intents })

// Connect BOT
dotenv.config()
client.login(process.env.BOT_TOKEN)

// Create Bot config
export const config = new Configurator(null, { prefix: '$' })

// Export Client
export default client

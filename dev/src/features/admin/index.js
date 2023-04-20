import dotenv from 'dotenv'
import config from './config.js'
import clear from './clear.js'

dotenv.config()
export default {
  name: 'Administration',
  description: 'Fonctions pour les admin',
  commands: process.env.BOT_DEV ? [...config, ...clear] : [...config],
  admin: true
}

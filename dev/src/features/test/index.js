import ping from './ping.js'

export default {
  name: 'test',
  description: 'Fonctions pour tester le BOT',
  commands: [...ping],
  admin: true
}

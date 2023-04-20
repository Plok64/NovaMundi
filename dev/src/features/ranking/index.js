import './config.js'
import './core.js'

// Commands
import xpManagement from './xpManagement.js'
import channelManagement from './channelManagement.js'

export default {
  name: 'ranking',
  description: 'Fonctions pour le leveling du serveur',
  commands: [...xpManagement, ...channelManagement]
}

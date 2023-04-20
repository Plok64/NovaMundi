import Configurator from '../../helpers/Configurator.js'

const config = new Configurator('ranking', {
  textCooldown: 10,
  oralCooldown: 1,
  channelAccepted: [],
  rankChannel: null,
  rankRoles: {},
  topNumber: 20
})

export default config

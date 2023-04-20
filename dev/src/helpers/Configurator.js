import db from '../db/index.js'

// Configuration Creator
export default class Configurator {
  constructor(feature, defaultConfig) {
    ;(async () => {
      this.feature = feature
      this.configValue = await this.initConfig(defaultConfig)

      // All config key access
      Object.keys(this.configValue).forEach(value => {
        Object.defineProperty(this, value, {
          get: () => this.configValue[value]
        })
      })
    })()
  }

  // Initialize config
  async initConfig(defaultConfig) {
    const dbValue = this.feature ? (await db.get(this.feature))?.config : await db.get('config')
    return { ...defaultConfig, ...dbValue }
  }

  // Change config
  setConfig(param, value) {
    if (!value || !Object.keys(this.configValue).includes(param)) return false

    // Set value / Modify value if it's a channel, a role or a member
    let setValue = value
    if (typeof value === 'string' && value.startsWith('<')) {
      if (value.startsWith('<#')) setValue = value.slice(2, -1)
      else if (value.startsWith('<@')) setValue = value.slice(3, -1)
    }

    // Update local config
    this.configValue[param] = setValue

    // Update DB config
    if (!this.feature) db.set('config', null, null, this.configValue)
    else db.set(this.feature, null, null, { config: this.configValue })
    return true
  }
}

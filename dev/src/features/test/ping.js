export default [
  {
    name: 'ping',
    description: "Ping BOT pour vérifier qu'il répond bien",
    func: msg => msg.reply('Pong !'),
    admin: true
  }
]

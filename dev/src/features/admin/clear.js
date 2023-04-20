export default [
  {
    name: 'clear',
    description: 'Retire les derniers messages du channel',
    func: msg =>
      msg.channel.messages.fetch().then(results => {
        msg.channel.bulkDelete(results)
      }),
    admin: true
  }
]

import { MessageEmbed } from 'discord.js'

export const colors = {
  infos: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336'
}

/**
 * Send Embeded Message
 */
export const sendEmbedMsg = (msg, color, title, description) => {
  const embed = new MessageEmbed({ color, title, description })
  msg.reply({ embeds: [embed] })
}

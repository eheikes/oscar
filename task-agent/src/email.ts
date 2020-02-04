import { createTransport } from 'nodemailer'
import { getConfig } from './config'
import { Task } from './task'

interface EmailResult {
  messageId: string
}

export const sendEmail = async (
  urgentImportant: Task[],
  urgent: Task[],
  important: Task[],
  neither: Task[]
): Promise<EmailResult> => {
  const { email } = await getConfig()

  let plainText = `
To-Do List
==========
`
  let html = `
<h1>To-Do List</h1>
`

  plainText += `
Urgent
------
`
  html += '<h2>Urgent</h2>\n<ul>\n'
  urgentImportant.forEach(task => {
    plainText += `* !!! ${task.name} (${task.url})\n`
    html += `<li>!!! ${task.name} (${task.url})</li>\n`
  })
  urgent.forEach(task => {
    plainText += `* ${task.name} (${task.url})\n`
    html += `<li>${task.name} (${task.url})</li>\n`
  })
  html += '</ul>\n'

  plainText += `
Important
---------
`
  html += '<h2>Important</h2>\n<ul>\n'
  important.forEach(task => {
    plainText += `* ${task.name} (${task.url})\n`
    html += `<li>${task.name} (${task.url})</li>\n`
  })
  html += '</ul>\n'

  plainText += `
If Time
--------
`
  html += '<h2>If Time</h2>\n<ul>\n'
  neither.forEach(task => {
    plainText += `* ${task.name} (${task.url})\n`
    html += `<li>${task.name} (${task.url})</li>\n`
  })
  html += '</ul>\n'

  const transporter = createTransport({
    host: email.server.host,
    port: email.server.port,
    secure: email.server.secure,
    auth: {
      user: email.server.username,
      pass: email.server.password
    }
  })

  const info = await transporter.sendMail({
    from: email.message.from,
    to: email.message.to,
    subject: email.message.subject,
    text: plainText,
    html: html
  })

  return {
    messageId: info.messageId
  }
}

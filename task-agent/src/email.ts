import { readFileSync } from 'fs'
import { compile, registerHelper } from 'handlebars'
import juice = require('juice')
import { createTransport } from 'nodemailer'
import { join } from 'path'
import { getConfig } from './config'
import { Task } from './task'

const htmlTemplateFilename = join(__dirname, '..', 'templates', 'email.html')
const plainTextTemplateFilename = join(__dirname, '..', 'templates', 'email.txt')

interface EmailResult {
  messageId: string
}

const buildEmail = (templateFilename: string, data: any): string => {
  const template = readFileSync(templateFilename, 'utf8')
  const compiled = compile(template)
  return compiled(data)
}

const toDateString = (x: any): string => {
  if (x instanceof Date) {
    return x.toLocaleDateString()
  }
  return x
}

export const sendEmail = async (
  urgentImportant: Task[],
  urgent: Task[],
  important: Task[],
  neither: Task[]
): Promise<EmailResult> => {
  const { email } = await getConfig()

  registerHelper('date', toDateString)

  const data = {
    urgentImportant,
    urgent,
    important,
    neither,
    title: email.message.subject,
    app: {
      name: 'OSCAR',
      url: 'https://github.com/eheikes/oscar'
    }
  }
  const html = juice(buildEmail(htmlTemplateFilename, data))
  const plainText = buildEmail(plainTextTemplateFilename, data)

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

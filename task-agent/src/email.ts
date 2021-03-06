import { readFileSync } from 'fs'
import { compile, registerHelper } from 'handlebars'
import { createTransport } from 'nodemailer'
import { join } from 'path'
import { getConfig } from './config'
import { Task } from './task'
import juice = require('juice')

export interface EmailResult {
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
  urgent: Task[],
  important: Task[],
  overdue: Task[]
): Promise<EmailResult> => {
  const { email } = await getConfig()
  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const pkg = require(join(__dirname, '..', 'package.json'))

  registerHelper('date', toDateString)

  const htmlTemplateFilename = join(__dirname, '..', email.template.html)
  const plainTextTemplateFilename = join(__dirname, '..', email.template.plain)

  const data = {
    urgent,
    important,
    overdue,
    title: email.message.subject,
    app: {
      name: pkg.displayName,
      url: pkg.homepage
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

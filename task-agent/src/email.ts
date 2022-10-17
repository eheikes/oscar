import { readFileSync } from 'fs'
import { compile, registerHelper } from 'handlebars'
import { createTransport } from 'nodemailer'
import { join } from 'path'
import { CardCandidate } from './chooser'
import { getConfig } from './config'
import { Task } from './task'
import juice = require('juice')

export interface EmailResult {
  messageId: string
}

interface TemplateFiles {
  htmlTemplate: string
  plainTextTemplate: string
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

export const sendEmail = async (subject: string, templates: TemplateFiles, data: any): Promise<EmailResult> => {
  const { email } = await getConfig()

  /* eslint-disable-next-line @typescript-eslint/no-var-requires */
  const pkg = require(join(__dirname, '..', 'package.json'))

  registerHelper('date', toDateString)

  const htmlTemplateFilename = join(__dirname, '..', 'templates', templates.htmlTemplate)
  const plainTextTemplateFilename = join(__dirname, '..', 'templates', templates.plainTextTemplate)

  const combinedData = {
    ...data,
    app: {
      name: pkg.displayName,
      url: pkg.homepage
    }
  }
  const html = juice(buildEmail(htmlTemplateFilename, combinedData))
  const plainText = buildEmail(plainTextTemplateFilename, combinedData)

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
    subject,
    text: plainText,
    html: html
  })

  return {
    messageId: info.messageId
  }
}

export const sendOverdueEmail = async (
  overdueCards: CardCandidate[]
): Promise<EmailResult> => {
  return sendEmail(
    'Warning: Tasks Will Not Be Completed by Due Date',
    {
      htmlTemplate: 'overdue-email.html',
      plainTextTemplate: 'overdue-email.txt'
    },
    {
      overdueCards,
      title: 'Overdue Tasks'
    }
  )
}

export const sendTodoEmail = async (
  urgent: Task[],
  important: Task[],
  overdue: Task[]
): Promise<EmailResult> => {
  return sendEmail(
    'Your Daily Tasks',
    {
      htmlTemplate: 'todo-email.html',
      plainTextTemplate: 'todo-email.txt'
    },
    {
      urgent,
      important,
      overdue,
      title: 'Your Daily Tasks'
    }
  )
}

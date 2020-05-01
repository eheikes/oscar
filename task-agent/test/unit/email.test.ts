import { createTransport, messageId, sendMail, SentMessageInfo, Transporter } from 'nodemailer'
import { Config, getConfig } from '../../src/config'
import { EmailResult, sendEmail } from '../../src/email'
import { Task } from '../../src/task'

declare module 'nodemailer' {
  const messageId: string
  const sendMail: Function
}

jest.mock('../../src/config')

describe('sendEmail()', () => {
  const urgent = [
    new Task({
      id: 'ui1',
      dateLastActivity: (new Date()).toISOString(),
      desc: 'Urgent Important 1',
      due: (new Date()).toISOString(),
      idBoard: 'board1',
      idLabels: ['label1'],
      idList: 'list1',
      idMembers: ['member1'],
      idShort: 'ui1',
      labels: [{
        id: 'label1',
        idBoard: 'board1',
        name: 'Important',
        color: 'red'
      }],
      name: 'Urgent Important 1',
      pos: 1,
      shortLink: 'ui1',
      shortUrl: 'http://example.com/ui1',
      url: 'http://example.com/ui1'
    }),
    new Task({
      id: 'u1',
      dateLastActivity: (new Date()).toISOString(),
      desc: 'Urgent 1',
      due: (new Date()).toISOString(),
      idBoard: 'board1',
      idLabels: ['label1'],
      idList: 'list1',
      idMembers: ['member1'],
      idShort: 'u1',
      labels: [{
        id: 'label1',
        idBoard: 'board1',
        name: 'Important',
        color: 'red'
      }],
      name: 'Urgent 1',
      pos: 1,
      shortLink: 'u1',
      shortUrl: 'http://example.com/u1',
      url: 'http://example.com/u1'
    })
  ]
  const important = [
    new Task({
      id: 'i1',
      dateLastActivity: (new Date()).toISOString(),
      desc: 'Important 1',
      due: (new Date()).toISOString(),
      idBoard: 'board1',
      idLabels: ['label1'],
      idList: 'list1',
      idMembers: ['member1'],
      idShort: 'i1',
      labels: [{
        id: 'label1',
        idBoard: 'board1',
        name: 'Important',
        color: 'red'
      }],
      name: 'Important 1',
      pos: 1,
      shortLink: 'i1',
      shortUrl: 'http://example.com/i1',
      url: 'http://example.com/i1'
    })
  ]
  const overdue = [
    new Task({
      id: 'odi1',
      dateLastActivity: (new Date()).toISOString(),
      desc: 'Overdue Important 1',
      due: (new Date(2020, 0, 2, 12, 0, 0)).toISOString(),
      idBoard: 'board1',
      idLabels: ['label1'],
      idList: 'list1',
      idMembers: ['member1'],
      idShort: 'odi1',
      labels: [{
        id: 'label1',
        idBoard: 'board1',
        name: 'Important',
        color: 'red'
      }],
      name: 'Overdue Important 1',
      pos: 1,
      shortLink: 'odi1',
      shortUrl: 'http://example.com/odi1',
      url: 'http://example.com/odi1'
    }),
    new Task({
      id: 'od1',
      dateLastActivity: (new Date()).toISOString(),
      desc: 'Overdue 1',
      due: (new Date(2020, 0, 2, 12, 0, 0)).toISOString(),
      idBoard: 'board1',
      idLabels: ['label1'],
      idList: 'list1',
      idMembers: ['member1'],
      idShort: 'od1',
      labels: [],
      name: 'Overdue 1',
      pos: 1,
      shortLink: 'od1',
      shortUrl: 'http://example.com/od1',
      url: 'http://example.com/od1'
    })
  ]

  const createTransportSpy = createTransport as jest.Mock<Transporter>
  const sendMailSpy = sendMail as jest.Mock<SentMessageInfo>

  let config: Config
  let result: EmailResult

  beforeEach(async () => {
    config = await getConfig()
    result = await sendEmail(urgent, important, overdue)
  })

  it('should use the configured email settings', () => {
    const createTransportArg = createTransportSpy.mock.calls[0][0]
    expect(createTransportArg.host).toBe(config.email.server.host)
    expect(createTransportArg.port).toBe(config.email.server.port)
    expect(createTransportArg.secure).toBe(config.email.server.secure)
    expect(createTransportArg.auth.user).toBe(config.email.server.username)
    expect(createTransportArg.auth.pass).toBe(config.email.server.password)

    const sendMailArg = sendMailSpy.mock.calls[0][0]
    expect(sendMailArg.from).toBe(config.email.message.from)
    expect(sendMailArg.to).toBe(config.email.message.to)
    expect(sendMailArg.subject).toBe(config.email.message.subject)
  })

  it('should use the configured templates', () => {
    const sendMailArg = sendMailSpy.mock.calls[0][0]
    expect(sendMailArg.html).toContain('<!doctype html>')
    expect(sendMailArg.html).toContain('To-Do List')
    expect(sendMailArg.text).toContain('To-Do List\n==========')
  })

  it('should build the plaintext from the given task info', () => {
    const sendMailArg = sendMailSpy.mock.calls[0][0]
    urgent.forEach(task => {
      expect(sendMailArg.text).toMatch(new RegExp(`Urgent.*\\* ${task.important ? '!!! ' : ''}${task.name}`, 's'))
    })
    important.forEach(task => {
      expect(sendMailArg.text).toMatch(new RegExp(`Important.*\\* ${task.important ? '!!! ' : ''}${task.name}`, 's'))
    })
    overdue.forEach(task => {
      expect(sendMailArg.text).toMatch(new RegExp(`Overdue.*\\* ${task.important ? '!!! ' : ''}${task.name}.*\\(due 1/2/2020\\)`, 's'))
    })
  })

  it('should build the HTML from the given task info', () => {
    const sendMailArg = sendMailSpy.mock.calls[0][0]
    urgent.forEach(task => {
      expect(sendMailArg.html).toMatch(new RegExp(`Urgent.*${task.name}`, 's'))
    })
    important.forEach(task => {
      expect(sendMailArg.html).toMatch(new RegExp(`Important.*${task.name}`, 's'))
    })
    overdue.forEach(task => {
      expect(sendMailArg.html).toMatch(new RegExp(`Overdue.*${task.name}.*\\(due 1/2/2020\\)`, 's'))
    })
  })

  it('should return the email info', () => {
    expect(result.messageId).toBe(messageId)
  })
})

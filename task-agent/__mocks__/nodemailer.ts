export const messageId = 'foo ID'

export const sendMail = jest.fn(() => ({
  messageId
}))

export const createTransport = jest.fn(() => ({
  sendMail
}))

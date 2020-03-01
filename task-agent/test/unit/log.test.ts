import { log } from '../../src/log'

describe('log()', () => {
  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(console, 'log')
    spy.mockImplementation(() => { /* no-op */ })
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('should prefix with the app and namespace', () => {
    log('namespace', 'message')
    expect(spy.mock.calls[0][0]).toBe('\u001b[34moscar:task-agent:namespace\u001b[39m')
  })

  it('should stringify objects', () => {
    log('namespace', { foo: 'bar' })
    expect(spy.mock.calls[0][1]).toBe('\u001b[37m {"foo":"bar"}\u001b[39m')
  })

  it('should cast other values to strings', () => {
    log('namespace', 'message', 5)
    expect(spy.mock.calls[0][1]).toBe('\u001b[37m message 5\u001b[39m')
  })

  it('should separate values by a space', () => {
    log('namespace', 'foo', 'bar', 'baz')
    expect(spy.mock.calls[0][1]).toBe('\u001b[37m foo bar baz\u001b[39m')
  })
})

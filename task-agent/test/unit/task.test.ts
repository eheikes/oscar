import { compareTasks, Task } from '../../src/task'
import { TrelloCard } from '../../src/trello'

describe('Task', () => {
  const card: TrelloCard = {
    id: '4d5ea62fd76aa1136000000c', // Fri, 18 Feb 2011 17:02:39 GMT
    dateLastActivity: '2017-02-01T15:00:00.000Z',
    desc: 'Test Card',
    due: '2017-12-12T17:00:00.000Z',
    idBoard: '560bf4298b3dda300c18d09c',
    idLabels: ['560bf42919ad3a5dc29f33c50'],
    idList: '560bf44ea68b16bd0fc2a9a9',
    idMembers: ['556c8537a1928ba745504dd8'],
    idShort: '9',
    labels: [{
      id: '560bf42919ad3a5dc29f33c5',
      idBoard: '560bf4298b3dda300c18d09c',
      name: 'Important',
      color: 'green'
    }],
    name: 'Test Task',
    pos: 217,
    shortLink: 'nqPiDKmw',
    shortUrl: 'https://trello.com/c/nqPiDKmw',
    url: 'https://trello.com/c/nqPiDKmw/9-grand-canyon-national-park'
  }
  let task: Task

  beforeEach(() => {
    task = new Task(card)
  })

  describe('constructor', () => {
    it('should use the same ID as the card ID', () => {
      expect(task.id).toBe(card.id)
    })

    it('should calculate the creation date from the card ID', () => {
      expect(task.dateCreated.toISOString()).toBe('2011-02-18T17:02:39.000Z')
    })

    it('should use the last-activity date from the card', () => {
      expect(task.dateLastActivity.toISOString()).toBe(card.dateLastActivity)
    })

    it('should use the due date from the card', () => {
      expect(task.dateDue.toISOString()).toBe(card.due)
    })

    it('should set a due date if one is not set', () => {
      const testCard = { ...card, due: null }
      task = new Task(testCard)
      expect(task.dateDue.toISOString()).not.toBe(null)
    })

    it('should set labels as the lowercase name from the card labels', () => {
      expect(task.labels).toEqual(['important'])
    })

    it('should use the same name as the card name', () => {
      expect(task.name).toBe(card.name)
    })

    it('should use the same position as the card position', () => {
      expect(task.position).toBe(card.pos)
    })

    it('should use the short URL for the URL', () => {
      expect(task.url).toBe(card.shortUrl)
    })

    it('should be marked important if it has the important label', () => {
      expect(task.important).toBe(true)
    })

    it('should be marked urgent if its due date is soon', () => {
      const due = new Date(Date.now() + 86400)
      const testCard = { ...card, due: due.toISOString() }
      task = new Task(testCard)
      expect(task.urgent).toBe(true)
    })

    it('should be marked overdue if it is overdue', () => {
      const due = new Date(Date.now() - 86400)
      const testCard = { ...card, due: due.toISOString() }
      task = new Task(testCard)
      expect(task.overdue).toBe(true)
    })

    it('should calculate a rank', () => {
      expect(task.rank).toEqual(expect.any(Number))
    })
  })
})

describe('compareTasks()', () => {
  it('should return <0 if task A has an earlier due date', () => {
    expect(compareTasks(
      /* eslint-disable @typescript-eslint/consistent-type-assertions */
      { dateDue: new Date(2009, 1, 1) } as Task,
      { dateDue: new Date(2010, 1, 1) } as Task
      /* eslint-enable @typescript-eslint/consistent-type-assertions */
    )).toBeLessThan(0)
  })

  it('should return >0 if task A has a later due date', () => {
    expect(compareTasks(
      /* eslint-disable @typescript-eslint/consistent-type-assertions */
      { dateDue: new Date(2011, 1, 1) } as Task,
      { dateDue: new Date(2010, 1, 1) } as Task
      /* eslint-enable @typescript-eslint/consistent-type-assertions */
    )).toBeGreaterThan(0)
  })

  it('should return 0 if due dates are the same', () => {
    expect(compareTasks(
      /* eslint-disable @typescript-eslint/consistent-type-assertions */
      { dateDue: new Date(2010, 1, 1) } as Task,
      { dateDue: new Date(2010, 1, 1) } as Task
      /* eslint-enable @typescript-eslint/consistent-type-assertions */
    )).toBe(0)
  })
})

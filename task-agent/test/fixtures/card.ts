import { TrelloCard } from '../../src/trello'

export const cards: TrelloCard[] = [{
  id: 'foo',
  dateLastActivity: '2020-01-01',
  due: '2020-01-02',
  idBoard: 'board1',
  idLabels: [],
  idList: 'list1',
  idMembers: [],
  idShort: '1',
  labels: [{
    id: '1',
    idBoard: '5',
    name: 'important',
    color: 'red'
  }],
  name: 'Foobar',
  pos: 99,
  shortLink: '',
  shortUrl: '',
  url: ''
}, {
  id: 'bar',
  dateLastActivity: '2020-01-01',
  due: '2020-01-02',
  idBoard: 'board2',
  idLabels: [],
  idList: 'list2',
  idMembers: [],
  idShort: '2',
  labels: [],
  name: 'Foobar 2',
  pos: 99,
  shortLink: '',
  shortUrl: '',
  url: ''
}, {
  id: 'baz',
  dateLastActivity: '2020-01-01',
  due: '2020-01-03',
  idBoard: 'board3',
  idLabels: [],
  idList: 'list3',
  idMembers: [],
  idShort: '3',
  labels: [],
  name: 'Foobar 3',
  pos: 99,
  shortLink: '',
  shortUrl: '',
  url: ''
}, {
  id: 'assigned',
  dateLastActivity: '2020-01-01',
  due: '2020-01-03',
  idBoard: 'board3',
  idLabels: [],
  idList: 'list3',
  idMembers: ['fe90296c-3055-4b1c-8f43-45e8c377b2da'],
  idShort: '3',
  labels: [],
  name: 'Assigned To Other',
  pos: 99,
  shortLink: '',
  shortUrl: '',
  url: ''
}]
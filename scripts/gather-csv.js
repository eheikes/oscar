/**
 * Creates INSERT statements for the matching CSV file.
 * Usage: node gather-csv.js foo.csv read
 */

const fs = require('fs')
const parse = require('csv-parse/lib/sync')
const tinytime = require('tinytime')
const uuidv4 = require('uuid/v4')

const file = process.argv[2]
const type = process.argv[3]

const fixedEncodeURIComponent = (str) => {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

const encode = (str) => {
  return fixedEncodeURIComponent(str).replace(/%20/g, '+')
}

const escape = (str) => {
  return str.replace(/'/g, "''")
}

const contents = fs.readFileSync(file, 'utf8')
const records = parse(contents, {
  columns: true,
  skip_empty_lines: true
})
records.forEach(record => {
  const uri = 'https://wccls.bibliocommons.com/v2/search?searchType=smart&query=' +
    encode(`${record.Title} ${record.Author}`)
  const title = escape(`${record.Title} by ${record.Author}`)
  const dateAdded = record['Date Added'] || '7/30/2014'
  const [month, day, year] = dateAdded.split('/')
  const time = new Date(year, month - 1, day)
  const template = tinytime('{YYYY}-{Mo}-{DD} {H}:{mm}:{ss}+00', {
    padDays: true,
    padHours: true,
    padMonth: true
  })
  console.log(`
    INSERT INTO items
    (id, uri, title, length, created_at, updated_at, type_id)
    VALUES
    (
      '${uuidv4()}',
      '${uri}',
      '${title}',
      NULL,
      '${template.render(time)}',
      '${template.render(time)}',
      '${type}'
    );
  `)
})

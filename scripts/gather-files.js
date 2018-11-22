/**
 * Creates INSERT statements for the matching globs.
 * Usage: node gather-files.js *.pdf read
 */

const fs = require('fs')
const glob = require('glob')
const path = require('path')
const tinytime = require('tinytime')
const uuidv4 = require('uuid/v4')

const pattern = process.argv[2]
const type = process.argv[3]

const escape = (str) => {
  return str.replace(/'/g, "''")
}

const allowFolders = false
const allowFiles = true

glob(pattern, {
  absolute: true
}, (err, files) => {
  if (err) {
    console.log('ERROR:', err)
    process.exit(1)
  }
  files.forEach(file => {
    const stats = fs.statSync(file)
    if (
      (allowFolders && stats.isDirectory()) ||
      (allowFiles && !stats.isDirectory())
     ) {
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
          'file:///${escape(file)}',
          '${escape(path.basename(file, path.extname(file)))}',
          ${stats.isDirectory() ? 'NULL' : stats.size},
          '${template.render(stats.mtime)}',
          '${template.render(stats.mtime)}',
          '${type}'
        );
      `)
    }
  })
})

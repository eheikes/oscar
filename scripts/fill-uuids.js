const fs = require('fs')
const uuidv4 = require('uuid/v4')

const inputFile = process.argv[2]

const contents = fs.readFileSync(inputFile, 'utf8')
const updated = contents.replace(/xxUUIDxx/g, () => uuidv4())
console.log(updated)


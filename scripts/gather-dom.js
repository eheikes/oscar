var start = 'INSERT INTO items (id, uri, title, image_uri, length, created_at, updated_at, type_id) VALUES('
var end = ');'
var monthLookup = {
  January: '01',
  February: '02',
  March: '03',
  April: '04',
  May: '05',
  June: '06',
  July: '07',
  August: '08',
  September: '09',
  October: '10',
  November: '11',
  December: '12'
}
var getUuids = () => {
  return fetch('https://www.uuidgenerator.net/api/version4/500').then(res => {
    return res.text()
  }).then(text => {
    return text.split(/\s+/)
  })
}

var type = 'play'
Promise.all([
  // getUuids(),
  // getUuids(),
  // getUuids()
]).then(fetches => {
  var i = 0
  var uuids = [].concat(...fetches)
  document.querySelectorAll('.gameListRow').forEach(item => {
    var img = item.querySelector('.gameListRowLogo img').src
    var titleEl = item.querySelector('.gameListRowItemName')
    var title = titleEl.textContent.replace(/'/g, "''")
    var url = item.querySelector('.gameListRowLogo a').href
    // var time = item.querySelectorAll('td')[0].textContent
    // var mins = parseInt(time.split(':')[0], 10) + 1
    // var date = item.querySelectorAll('.dashboard-talk__info__value')[1].textContent
    // var [month, year] = date.split(' ')
    // var timestamp = `${year}-${monthLookup[month]}-15 00:00:00+00`
    var timestamp = `2008-07-01 00:00:00+00`
    console.log([
      start,
      `'xxUUIDxx',`,
      `'${url}',`,
      `'${title}',`,
      `'${img}',`,
      'NULL,',
      `'${timestamp}',`,
      `'${timestamp}',`,
      `'${type}'`,
      end
    ].join(''))
    i++
  })
})

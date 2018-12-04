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

var type = 'watch-passive'
Promise.all([
  // getUuids(),
  // getUuids(),
  getUuids()
]).then(fetches => {
  var i = 0
  var uuids = [].concat(...fetches)
  document.querySelectorAll('.item-type-video').forEach(item => {
    var img = item.querySelector('img').src
    var titleEl = item.querySelector('.browse-item-title strong')
    var title = titleEl.textContent.replace(/'/g, "''")
    var url = item.querySelector('.browse-item-title a').href
    var time = item.querySelector('.duration-container').textContent
    // var date = item.querySelectorAll('.dashboard-talk__info__value')[1].textContent
    var [hour, min, sec] = time.split(':')
    var mins = parseInt(hour, 10) * 60 + parseInt(min, 10) + 1
    // var timestamp = `${year}-${monthLookup[month]}-15 00:00:00+00`
    var timestamp = `2017-11-22 00:00:00+00`
    console.log([
      start,
      `'${uuids[i]}',`,
      `'${url}',`,
      `'${title}',`,
      `'${img}',`,
      `${mins},`,
      `'${timestamp}',`,
      `'${timestamp}',`,
      `'${type}'`,
      end
    ].join(''))
    i++
  })
})

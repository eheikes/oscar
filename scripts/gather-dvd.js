function restoreConsole() {
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  console = iframe.contentWindow.console;
  window.console = console;
}
restoreConsole();

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

var uri = location.href;
var title = document.querySelector('.moviemeta h1').textContent.replace(/'/g, "''");
var duration = document.querySelector('.moviemeta .duration').textContent;
var time;
if (duration.match(/(\d+)h (\d+)m/)) {
  var [, hour, min] = duration.match(/(\d+)h (\d+)m/);
  time = parseInt(hour, 10) * 60 + parseInt(min, 10);
} else {
  time = 'NULL'
}
var timestamp;
var nhistory = document.querySelector('#historyList') ? document.querySelector('#historyList').textContent : '';
if (nhistory.match(/to your Queue on (\d+)\/(\d+)\/(\d+)/)) {
  var [, month, day, year] = nhistory.match(/to your Queue on (\d+)\/(\d+)\/(\d+)/);
  timestamp = `20${year}-${month}-${day} 00:00:00+00`;
} else {
  var now = new Date();
  timestamp = now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '+00');
}



var getUuid = () => {
  return fetch('https://www.uuidgenerator.net/api/version4').then(res => {
    return res.text();
  }).then(text => {
    return text.trim();
  })
};

getUuid().then(uuid => {
  document.body.addEventListener('click', () => {
    copyToClipboard(`
  INSERT INTO items\n
  (id, uri, title, length, created_at, updated_at, type_id)\n
  VALUES\n
  (\n
    '${uuid}',\n
    '${uri}',\n
    '${title}',\n
    ${time},\n
    '${timestamp}',\n
    '${timestamp}',\n
    'watch'\n
  );
  `);
  });
});

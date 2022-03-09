
var login_url = 'https://192.168.1.1/cgi-bin/login.asp';
var reset_url = 'https://192.168.1.1/cgi-bin/reboot.asp';
var info_url = 'https://192.168.1.1/cgi-bin/easy_setup.asp';

fetch(login_url, {
  method: 'POST',
  referrerPolicy: "origin-when-cross-origin",
  referrer: "https://192.168.1.1",
  credentials: "same-origin",
  headers: {
    'Cookie': [
      'SESSIONID=s5sdudstt0a7i5ax3tadke7et5iv70ys ; path=/; httpOnly; secure ;'
    ],
  },
  body: 'Username=admin&Password=your_password'
})
.then(data => {
  console.log(data)
  var temp = data.headers
  // var cookie = JSON.parse(JSON.stringify(data.headers));
  var cookie = JSON.stringify(temp);
  // check string
  console.log(data.headers)
  console.log(temp['connection'])
  var obj = {
    connection: 'close',
    'content-length': '243',
    'content-type': 'text/html; charset=ISO-8859-1',
    date: 'Tue, 08 Mar 2022 23:08:08 GMT',
    'set-cookie': 'SESSIONID=i1aa1tvdc1nnada2a3hlaaataaettu2a ; path=/; httpOnly; secure ;'
  }
  console.log(obj['set-cookie'])
  // console.log(typeof cookie)
  // var Cookie = getCookieString(data.headers['set-cookie'][0])
  // console.log(Cookie.SESSIONID);
  fetch(info_url, {
    method: 'GET',
    // agent: httpsAgent,
    headers: {
      'Cookie': [
        'SESSIONID=s5sdudstt0a7i5ax3tadke7et5iv70ys ; path=/; httpOnly; secure ;'
      ],
    },
    // body: 'StatusActionFlag=-1&GUID=815aedc3-9a76-65d1-ce50-bc3218d19825&Username=admin&Password=your_password'
  })
  .then(data => {
    return data.text();
  }).then(data => {
    // console.log(data);
  })

  return data.text();
})
.then(data => {
  // var parser = new DomParser();
	// var doc = parser.parseFromString(data, 'text/html');

})
.catch(error => {
  console.log('Request failed', error);
});

function getCookieString(Cookie){
  let str;
  str = Cookie.split('; ');
  const result = {};
  for (let i in str) {
      const cur = str[i].split('=');
      result[cur[0]] = cur[1];
  }
  return result;
}
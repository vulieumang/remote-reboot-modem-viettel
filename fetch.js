import fetch from 'node-fetch';
import https from 'https';
import DomParser from 'dom-parser';
import cheerio from 'cheerio';
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

var login_url = 'https://192.168.1.1/cgi-bin/login.asp';
var reset_url = 'https://192.168.1.1/cgi-bin/reboot.asp';
var info_url = 'https://192.168.1.1/cgi-bin/easy_setup.asp';
const headers = {
  "Content-Type": "application/json"
}
fetch(login_url, {
  method: 'POST',
  agent: httpsAgent,
  credentials: "same-origin",
  headers: {
    'Cookie': [
      'SESSIONID=s5sdudstt0a7i5ax3tadke7et5iv70ys ; path=/; httpOnly; secure ;'
    ],
  },
  body: 'Username=admin&Password=yourpassword'
})
.then(data => {

  var Cookie = getCookieString([...data.headers].slice(-1)[0][1])
  // why can not get 
  //  var Cookie = getCookieString(data.headers['set-cookie'][0])
  console.log(data.headers);
  fetch(reset_url, {
    method: 'GET',
    headers: {
      'Cookie': [
        `SESSIONID=${Cookie.SESSIONID}`
      ],
    },
  })
  .then(data => {
    return data.text();
  }).then(data => {
    const $ = cheerio.load(data);
    var Token = $('[name=TokenString]')[0].attribs.value;
    // console.log('Token: '+Token);
  })

})
.catch(error => {
  console.log('Request failed', error);
});

function getCookieString(Cookie){
  // input: 'SESSIONID=xxx; path=/; httpOnly; secure ;'
  // output: 'xxx'
  let str;
  str = Cookie.split('; ');
  const result = {};
  for (let i in str) {
      const cur = str[i].split('=');
      result[cur[0]] = cur[1];
  }
  return result;
}
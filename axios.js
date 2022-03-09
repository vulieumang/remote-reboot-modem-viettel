import axios from 'axios'; //15k (gzipped: 5.1k)
import cheerio  from 'cheerio';
import fetch from 'node-fetch';
import https from 'https';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const httpsAgent = new https.Agent({ keepAlive: true,rejectUnauthorized: false, });
var login_url = 'https://192.168.1.1/cgi-bin/login.asp';
var reset_url = 'https://192.168.1.1/cgi-bin/reboot.asp';
var data = 'Username=admin&Password=your_password'
axios
.post(login_url, data, {
  headers: {
    'Cookie': 
      'SESSIONID=s5sdudstt0a7i5ax3tadke7et5iv70ys ;'
    ,
  },
})
.then((res) => {
  const Cookie = getCookieString(res.headers['set-cookie'][0]);
  axios
  .get(reset_url, {
    headers: {
      'Cookie': `SESSIONID=${Cookie.SESSIONID}`
      ,
    },
  })
  .then((res) => {
    // console.log(res.data)
    const $ = cheerio.load(res.data);
    var Token = $('[name=TokenString]')[0].attribs.value;
    console.log('Token: '+Token);
    var resetParam = `TokenString=${Token}&testFlag=3&rebootFlag=1`
    axios.post(reset_url, resetParam, {
      headers: {
        'Cookie': `SESSIONID=${Cookie.SESSIONID}`
        ,
      },
    })
    .then((res) => {
      // console.log(res.data)
      const $ = cheerio.load(res.data);
      var Token = $('[name=TokenString]')[0].attribs.value;
      console.log('Token: '+Token);
    })
  })

 
})
.catch(err => console.error(err));


function getCookieString(Cookie){
  // input: 'SESSIONID=xxx; path=/; httpOnly; secure ;'
  // output: object
  let str;
  str = Cookie.split('; ');
  const result = {};
  for (let i in str) {
      const cur = str[i].split('=');
      result[cur[0]] = cur[1];
  }
  return result;
}
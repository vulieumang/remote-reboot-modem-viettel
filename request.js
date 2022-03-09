import request from 'request';
import https from 'https';
import cheerio from 'cheerio';
// way1: bypass https insecure
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; 
// way2: bypass https insecure with agent: httpsAgent in request header
// const httpsAgent = new https.Agent({ keepAlive: true,rejectUnauthorized: false, }); 
var headers = {
    'Cookie': [
      'SESSIONID=1;'
    ],
};

var login_url = 'https://192.168.1.1/cgi-bin/login.asp';
var reboot_url = 'https://192.168.1.1/cgi-bin/reboot.asp';
var info_url = 'https://192.168.1.1/cgi-bin/easy_setup.asp';
var body = 'Username=admin&Password=your_password'


request.post({url: login_url, body: body, headers: headers}, function(err, res, body){
    // get cookie
    var Cookie = getCookieString(res.headers['set-cookie'][0])
    console.log(Cookie.SESSIONID);
    var headers = {
      'cookie': `SESSIONID=${Cookie.SESSIONID}`
    }
    request.get({url: reboot_url, headers: headers}, function(err, res, body){
      const $ = cheerio.load(res.body);
      var Token = $('[name=TokenString]')[0].attribs.value;
      console.log('Token: '+Token);
    });
});


function getCookieString(Cookie){
  // input: 'SESSIONID=xxx; path=/; httpOnly; secure ;'
  // output: {}
  let str;
  str = Cookie.split('; ');
  const result = {};
  for (let i in str) {
      const cur = str[i].split('=');
      result[cur[0]] = cur[1];
  }
  return result;
}
const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'decklog-en.bushiroad.com',
  port: 443,
  path: '/system/app/api/view/1U2W1',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => { data += d; });
  res.on('end', () => {
    fs.writeFileSync('C:\\Users\\wande\\OneDrive\\Área de Trabalho\\VG Proxy\\api_test_result.json', data);
    process.exit(0);
  });
});

req.on('error', error => {
  fs.writeFileSync('C:\\Users\\wande\\OneDrive\\Área de Trabalho\\VG Proxy\\api_test_result.json', 'ERROR: ' + error.message);
  process.exit(1);
});

req.end();

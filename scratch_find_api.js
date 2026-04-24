const https = require('https');

https.get('https://decklog-en.bushiroad.com/static/js/app.0be006d4.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    // Find strings like "api/..." or "/system/api/..."
    const matches = data.match(/['"]((?:https?:\/\/[^\/]+)?\/?(?:api|system|system\/api)\/[^'"]+)['"]/g);
    if (matches) {
      console.log(Array.from(new Set(matches)));
    } else {
        console.log("No API strings found.");
    }
  });
}).on('error', console.error);

const https = require('https');

https.get('https://decklog-en.bushiroad.com/view/1U2W1', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const scriptMatches = data.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
        scriptMatches.forEach((s, i) => {
            if (s.includes('deck') || s.includes('card')) {
                console.log(`Script ${i}:`, s.substring(0, 500));
            }
        });
    }
  });
}).on('error', console.error);

export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code, region = 'en' } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing deck code' });
  }

  const isEnglish = region === 'en';
  const baseUrl = isEnglish ? 'https://decklog-en.bushiroad.com' : 'https://decklog.bushiroad.com';
  const targetUrl = `${baseUrl}/system/app/api/view/${code}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': baseUrl,
        'Referer': `${baseUrl}/`,
        'Accept-Language': isEnglish ? 'en-US,en;q=0.9' : 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch from Bushiroad' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
}

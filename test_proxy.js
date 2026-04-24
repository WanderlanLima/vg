const code = '8AL5';
const url = `https://decklog-en.bushiroad.com/system/app/api/view/${code}`;
const proxy = 'https://corsproxy.io/?';

async function test() {
  try {
    const res = await fetch(proxy + encodeURIComponent(url), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.substring(0, 200));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();

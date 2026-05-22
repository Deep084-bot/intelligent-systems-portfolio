import 'dotenv/config';

const KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash';

if (!KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

console.log('Testing Gemini REST API directly (not SDK)...');
console.log(`Model: ${MODEL}`);
console.log(`API Key: ${KEY.slice(0, 10)}...`);

const prompt = 'Hello';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 64
      }
    })
  });

  console.log(`Status: ${response.status}`);
  const data = await response.json();
  
  if (response.status === 200) {
    console.log('✓ Success!');
    console.log('Response:', JSON.stringify(data, null, 2).slice(0, 500));
  } else {
    console.log('✗ Failed');
    console.log('Error:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.error('Network error:', err.message);
}

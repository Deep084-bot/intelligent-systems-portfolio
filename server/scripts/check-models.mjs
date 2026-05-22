import 'dotenv/config';

const KEY = process.env.GEMINI_API_KEY;

if (!KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

console.log('Checking available models...');

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}`;

try {
  const response = await fetch(url);
  console.log(`Status: ${response.status}`);
  const data = await response.json();
  
  if (response.status === 200 && data.models) {
    console.log(`\n✓ Found ${data.models.length} available models:\n`);
    data.models.forEach((m, i) => {
      console.log(`${i+1}. ${m.name}`);
    });
  } else {
    console.log('Error:', JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.error('Network error:', err.message);
}

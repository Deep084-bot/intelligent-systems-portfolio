export async function chat(question, history = []) {
  const resp = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || 'AI API error');
  }
  return resp.json();
}

import dotenv from 'dotenv';
dotenv.config();

async function testGroqModels() {
  const key = process.env.GROQ_API_KEY;
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound-mini'];

  console.log('Testing Groq models with GROQ_API_KEY...');

  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with JSON: {"status": "ok"}' }],
          max_tokens: 30
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[PASS] ${model} -> HTTP 200: ${data.choices?.[0]?.message?.content?.trim()}`);
      } else {
        console.log(`[FAIL] ${model} -> HTTP ${res.status}:`, data.error?.message || data.message || data);
      }
    } catch (e: any) {
      console.log(`[ERROR] ${model} ->`, e.message);
    }
  }
}

testGroqModels();

import dotenv from 'dotenv';
dotenv.config();

async function testGeminiRealCalls() {
  const key = process.env.GEMINI_API_KEY;
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-flash-lite-latest'
  ];

  console.log('Testing generateContent on real models with user GEMINI_API_KEY...');

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Return JSON: {"status": "ok", "model": "' + model + '"}' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      const data = await res.json();
      if (res.ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`[PASS] ${model} -> HTTP ${res.status}: ${text?.trim()}`);
      } else {
        console.log(`[FAIL] ${model} -> HTTP ${res.status}:`, data.error?.message || data);
      }
    } catch (e: any) {
      console.log(`[ERROR] ${model} ->`, e.message);
    }
  }
}

testGeminiRealCalls();

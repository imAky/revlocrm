import dotenv from 'dotenv';
dotenv.config();

async function inspectGeminiModels() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log('=== GEMINI AVAILABLE MODELS ===');
  if (data.models) {
    const names = data.models.map((m: any) => ({
      name: m.name.replace('models/', ''),
      displayName: m.displayName,
      supportedGenerationMethods: m.supportedGenerationMethods
    }));
    // Filter for generateContent
    const genModels = names.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
    console.log(`Total generateContent models: ${genModels.length}`);
    genModels.forEach((m: any) => console.log(`- ${m.name} (${m.displayName})`));
  } else {
    console.log('Gemini Error:', data);
  }
}

async function inspectGroqModels() {
  const key = process.env.GROQ_API_KEY;
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('\n=== GROQ AVAILABLE MODELS ===');
  if (data.data) {
    console.log(`Total Groq models: ${data.data.length}`);
    data.data.forEach((m: any) => console.log(`- ${m.id}`));
  } else {
    console.log('Groq Error:', data);
  }
}

async function main() {
  await inspectGeminiModels();
  await inspectGroqModels();
}

main();

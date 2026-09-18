import dotenv from 'dotenv';
dotenv.config();

async function testGeminiKey() {
  console.log('\n========================================');
  console.log('1. TESTING GEMINI_API_KEY');
  console.log('========================================');
  const key = process.env.GEMINI_API_KEY;
  console.log(`Current GEMINI_API_KEY prefix: ${key?.substring(0, 10)}... (length: ${key?.length})`);

  // Test v1beta with gemini-2.0-flash
  const modelsToTest = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  
  for (const model of modelsToTest) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello! Respond with: GEMINI_WORKING' }] }]
        })
      });
      const data = await res.json();
      console.log(`Model [${model}] -> Status: ${res.status} ${res.statusText}`);
      if (res.ok) {
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`SUCCESS! Reply: ${reply?.trim()}`);
        return { success: true, model };
      } else {
        console.log(`Error Response:`, JSON.stringify(data?.error || data, null, 2));
      }
    } catch (err: any) {
      console.log(`Network/Fetch Exception:`, err.message);
    }
  }

  // Also check if it's a bearer token or Vertex AI format
  const bearerUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  try {
    const res = await fetch(bearerUrl);
    const data = await res.json();
    console.log(`List models endpoint -> Status: ${res.status}`);
    if (res.ok) {
      console.log(`Models available: ${data.models?.length || 0}`);
    } else {
      console.log(`List models error:`, JSON.stringify(data?.error || data, null, 2));
    }
  } catch (e: any) {
    console.log('List models fetch error:', e.message);
  }

  return { success: false };
}

async function testGroqKey() {
  console.log('\n========================================');
  console.log('2. TESTING GROQ_API_KEY');
  console.log('========================================');
  const key = process.env.GROQ_API_KEY;
  console.log(`Current GROQ_API_KEY prefix: ${key?.substring(0, 10)}... (length: ${key?.length})`);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say GROQ_WORKING' }],
        max_tokens: 10
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const reply = data?.choices?.[0]?.message?.content;
      console.log(`SUCCESS! Reply: ${reply?.trim()}`);
      return { success: true };
    } else {
      console.log(`Error Response:`, JSON.stringify(data?.error || data, null, 2));
      return { success: false };
    }
  } catch (err: any) {
    console.log(`Network/Fetch Exception:`, err.message);
    return { success: false };
  }
}

async function testGooglePlacesKey() {
  console.log('\n========================================');
  console.log('3. TESTING GOOGLE_PLACES_API_KEY');
  console.log('========================================');
  const key = process.env.GOOGLE_PLACES_API_KEY;
  console.log(`Current GOOGLE_PLACES_API_KEY prefix: ${key?.substring(0, 10)}... (length: ${key?.length})`);

  // Test 1: Places API (New) Text Search
  console.log('\n--> Testing Places API (New) - places.googleapis.com/v1/places:searchText');
  try {
    const newPlacesUrl = 'https://places.googleapis.com/v1/places:searchText';
    const res = await fetch(newPlacesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key || '',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating'
      },
      body: JSON.stringify({
        textQuery: 'dentist in Austin TX',
        pageSize: 2
      })
    });
    const data = await res.json();
    console.log(`Places (New) Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log(`SUCCESS! Places found: ${data.places?.length || 0}`);
      if (data.places && data.places.length > 0) {
        console.log(`Sample: ${data.places[0].displayName?.text} - ${data.places[0].formattedAddress}`);
      }
    } else {
      console.log(`Places (New) Error:`, JSON.stringify(data?.error || data, null, 2));
    }
  } catch (err: any) {
    console.log(`Places (New) Fetch error:`, err.message);
  }

  // Test 2: Legacy Places API Text Search
  console.log('\n--> Testing Legacy Places API - maps.googleapis.com/maps/api/place/textsearch/json');
  try {
    const legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=dentist+in+Austin+TX&key=${key}`;
    const res = await fetch(legacyUrl);
    const data = await res.json();
    console.log(`Legacy Places Status: ${res.status} (API status: ${data.status})`);
    if (data.status === 'OK') {
      console.log(`SUCCESS! Results found: ${data.results?.length || 0}`);
    } else {
      console.log(`Legacy Places API Error / Status: ${data.status} - ${data.error_message || ''}`);
    }
  } catch (err: any) {
    console.log(`Legacy Places Fetch error:`, err.message);
  }
}

async function runAll() {
  await testGeminiKey();
  await testGroqKey();
  await testGooglePlacesKey();
}

runAll();

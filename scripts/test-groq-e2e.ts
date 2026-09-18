import dotenv from 'dotenv';
dotenv.config();

import { generateHighTicketKeywords } from '../lib/services/ai-keyword-generator';
import { scoutDecisionMaker } from '../lib/services/dm-scout-service';

async function testGroqEndToEnd() {
  console.log('Testing Groq Qwen 3.8 27B End-to-End...');
  try {
    const keywords = await generateHighTicketKeywords({
      country: 'GB',
      niche: 'Boutique Corporate & Estate Law',
      count: 2,
      modelId: 'qwen-3.8-27b-groq'
    });
    console.log(`[PASS] Groq Keywords Generated: ${keywords.length}`);
    keywords.forEach((k) => console.log(`- ${k.keyword} (${k.city}, ${k.country})`));
  } catch (e: any) {
    console.error('[FAIL] Groq Keywords:', e.message);
  }

  try {
    const dm = await scoutDecisionMaker({
      companyName: 'Harrogate Corporate Law',
      city: 'Harrogate',
      state: 'North Yorkshire',
      modelId: 'qwen-3.8-27b-groq'
    });
    console.log('[PASS] Groq DM Result:', dm);
  } catch (e: any) {
    console.error('[FAIL] Groq DM:', e.message);
  }
}

testGroqEndToEnd();

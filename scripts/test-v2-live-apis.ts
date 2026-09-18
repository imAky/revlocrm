import dotenv from 'dotenv';
dotenv.config();

import { generateHighTicketKeywords } from '../lib/services/ai-keyword-generator';
import { scoutDecisionMaker } from '../lib/services/dm-scout-service';
import { searchGoogleMapsProspects } from '../lib/services/discovery-service';

async function testServices() {
  console.log('--- 1. Testing AI Keyword Generator with Gemini 3.5 Flash-Lite ---');
  try {
    const keywords = await generateHighTicketKeywords({
      country: 'US',
      niche: 'Commercial Roofing & Restoration',
      count: 3,
      modelId: 'gemini-3.5-flash-lite'
    });
    console.log(`Generated ${keywords.length} keywords successfully:`);
    keywords.forEach((k) => console.log(`- ${k.keyword} (${k.city}, ${k.state})`));
  } catch (err: any) {
    console.error('Keyword generation error:', err.message);
  }

  console.log('\n--- 2. Testing Google Places Discovery with GOOGLE_PLACES_API_KEY ---');
  try {
    const discovery = await searchGoogleMapsProspects({
      keyword: 'Commercial Roofing in Katy, Texas',
      country: 'US',
      maxResults: 3
    });
    console.log(`Discovered ${discovery.prospects.length} prospects from Google Places:`);
    discovery.prospects.forEach((p) => {
      console.log(`- ${p.name} | Rating: ${p.googleRating} (${p.reviewCount} revs) | Web: ${p.website || 'NO WEBSITE (🔥 HIGH PRIORITY)'}`);
    });
  } catch (err: any) {
    console.error('Discovery error:', err.message);
  }

  console.log('\n--- 3. Testing DM Scout Service with Gemini 3.5 Flash-Lite ---');
  try {
    const dm = await scoutDecisionMaker({
      companyName: 'Apex Roofing & Restoration',
      city: 'Katy',
      state: 'TX',
      modelId: 'gemini-3.5-flash-lite'
    });
    console.log('DM Scout Result:', dm);
  } catch (err: any) {
    console.error('DM Scout error:', err.message);
  }
}

testServices();

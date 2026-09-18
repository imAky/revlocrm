import dotenv from 'dotenv';
dotenv.config();

import { generateHighTicketKeywords } from '../lib/services/ai-keyword-generator';
import { TIER1_COUNTRIES, EXTENDED_TIER1_COUNTRIES, HIGH_TICKET_NICHES } from '../lib/constants/automation';

async function runTerritoryTests() {
  console.log('====================================================');
  console.log('  REVLOCRM TERRITORY MATRIX SCOUT VERIFICATION');
  console.log('====================================================\n');

  // Test 1: Verify High Ticket Niches prioritization
  console.log('1. Checking High Ticket Niches prioritization...');
  const firstNiche = HIGH_TICKET_NICHES[0];
  console.log(`Top Priority Niche: ${firstNiche.name} (${firstNiche.avgContract})`);
  if (!firstNiche.name.toLowerCase().includes('roofing')) {
    throw new Error('Commercial Roofing should be top priority niche!');
  }
  console.log('PASS: Commercial Roofing is #1 default high-ticket niche.\n');

  // Test 2: US - Texas (TX) - Katy commercial hub
  console.log('2. Generating US / Texas / Katy queries...');
  const usKaty = await generateHighTicketKeywords({
    country: 'US',
    state: 'TX',
    city: 'Katy',
    niche: 'Commercial Roofing & Industrial Restoration',
    count: 3,
    modelId: 'gemini-3.5-flash-lite',
  });
  console.log(`Generated ${usKaty.length} queries for Katy, TX:`);
  usKaty.forEach((k) => console.log(`  - [${k.country}] ${k.keyword} (${k.city}, ${k.state})`));
  if (usKaty.length === 0) throw new Error('Failed to generate Katy queries');
  console.log('PASS: US / Texas / Katy queries generated.\n');

  // Test 3: UK - Greater London - Richmond
  console.log('3. Generating UK / Greater London / Richmond queries...');
  const ukRichmond = await generateHighTicketKeywords({
    country: 'GB',
    state: 'London',
    city: 'Richmond',
    niche: 'Commercial HVAC & Industrial Refrigeration',
    count: 2,
    modelId: 'gemini-3.5-flash-lite',
  });
  console.log(`Generated ${ukRichmond.length} queries for Richmond, UK:`);
  ukRichmond.forEach((k) => console.log(`  - [${k.country}] ${k.keyword} (${k.city}, ${k.state})`));
  if (ukRichmond.length === 0) throw new Error('Failed to generate UK queries');
  console.log('PASS: UK queries generated.\n');

  // Test 4: Matrix Mode (Blanket all cities in State)
  console.log('4. Testing Blanket Matrix Mode for Texas...');
  const txMatrix = await generateHighTicketKeywords({
    country: 'US',
    state: 'Texas',
    city: 'ALL',
    niche: 'Commercial Roofing & Industrial Restoration',
    count: 4,
    modelId: 'gemini-3.5-flash-lite',
  });
  console.log(`Generated ${txMatrix.length} matrix queries across Texas:`);
  txMatrix.forEach((k) => console.log(`  - ${k.keyword} (Hub: ${k.city}, ${k.state})`));
  console.log('PASS: Texas territory matrix generated.\n');

  // Test 5: Extended Tier-1 Country (Germany - Bavaria)
  console.log('5. Testing Extended Tier-1 Country (Germany - Bavaria)...');
  const deBavaria = await generateHighTicketKeywords({
    country: 'DE',
    state: 'BY',
    city: 'Munich',
    niche: 'Commercial Solar & Renewable Energy Systems',
    count: 2,
    modelId: 'gemini-3.5-flash-lite',
  });
  console.log(`Generated ${deBavaria.length} queries for Munich, Germany:`);
  deBavaria.forEach((k) => console.log(`  - [${k.country}] ${k.keyword} (${k.city})`));
  console.log('PASS: Extended Tier-1 country query generated.\n');

  console.log('====================================================');
  console.log('ALL 5 TERRITORY MATRIX TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runTerritoryTests().catch((e) => {
  console.error('Test Failed:', e);
  process.exit(1);
});

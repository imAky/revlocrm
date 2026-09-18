import dotenv from 'dotenv';
dotenv.config();

import { runAutonomousAgentCycleAction } from '../lib/actions/automation';

async function testAutonomousPipeline() {
  console.log('====================================================');
  console.log('  TESTING AUTONOMOUS AGENT PIPELINE END-TO-END');
  console.log('====================================================\n');

  try {
    const res = await runAutonomousAgentCycleAction({
      country: 'US',
      state: 'TX',
      city: 'Katy',
      niche: 'Commercial Roofing & Industrial Restoration',
      modelId: 'gemini-3.5-flash-lite',
    });

    console.log('Autonomous Cycle Response:', JSON.stringify(res, null, 2));

    if (!res.success) {
      throw new Error(`Pipeline execution failed: ${res.message}`);
    }

    console.log('\n[PASS] Cycle completed successfully!');
    console.log(`- Mined Keyword: ${res.keyword}`);
    console.log(`- Discovered: ${res.prospectsDiscovered}`);
    console.log(`- Ingested into CRM: ${res.prospectsIngested}`);
    console.log(`- No Website Targets: ${res.noWebsiteCount}`);
    console.log(`- Decision Makers Found: ${res.decisionMakersFound}`);
    console.log(`- Summary: ${res.summary}`);
  } catch (err: any) {
    console.error('[FAIL] Error testing autonomous pipeline:', err.message);
    process.exit(1);
  }
}

testAutonomousPipeline();

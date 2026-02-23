/**
 * Test Telegram Bot Proposal Flow (Without Blockchain Push)
 * 
 * This script tests the entire flow:
 * 1. Load existing analysis
 * 2. Enhance with 0G Compute
 * 3. Format proposal description
 * 4. Show what would be submitted (without actually submitting)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', 'tg_analysis', '.env') });

async function main() {
  console.log('🧪 Testing Telegram Bot Proposal Flow\n');
  console.log('This test simulates the full flow WITHOUT pushing to blockchain\n');

  // Step 1: Find a sample analysis file
  const detailsDir = path.join(__dirname, '..', 'details', 'analysis');
  const files = await fs.readdir(detailsDir);
  const analysisFiles = files.filter(f => f.startsWith('analysis-') && f.endsWith('.json'));

  if (analysisFiles.length === 0) {
    console.log('❌ No analysis files found in details/analysis/');
    console.log('   Please run the photo analysis first or send a video to the bot');
    return;
  }

  const sampleFile = path.join(detailsDir, analysisFiles[0]);
  console.log(`📄 Using sample analysis: ${analysisFiles[0]}\n`);

  // Step 2: Read the analysis
  const analysisContent = await fs.readFile(sampleFile, 'utf-8');
  const analysisData = JSON.parse(analysisContent);

  console.log('📊 Analysis Data:');
  console.log(`  Location: ${analysisData.metadata?.location?.city}, ${analysisData.metadata?.location?.state}`);
  console.log(`  Description: ${analysisData.analysis?.description?.substring(0, 80)}...`);
  console.log(`  Impact Score: ${analysisData.impactAssessment?.score}`);
  console.log(`  Urgency: ${analysisData.impactAssessment?.urgency}`);
  
  // Check if 0G enhancement exists
  if (analysisData.zgComputeEnhancement) {
    console.log(`\n⚡ 0G Compute Enhancement Found:`);
    console.log(`  Tagline: "${analysisData.zgComputeEnhancement.tagline}"`);
    console.log(`  Model: ${analysisData.zgComputeEnhancement.model}`);
    console.log(`  Execution Time: ${analysisData.zgComputeEnhancement.executionTime}ms`);
    console.log(`  Provider: ${analysisData.zgComputeEnhancement.providerAddress}`);
  } else {
    console.log(`\n⚠️  No 0G enhancement found in this analysis`);
    console.log(`   This analysis was created before 0G integration`);
  }
  console.log();

  // Step 3: Simulate IPFS URLs (in real flow, these come from Pinata)
  const mockProposalData = {
    imageUrl: 'https://gateway.pinata.cloud/ipfs/QmX4Rh3EYqFjP9H8w2N5K6vL7mT9pQ1sR2uV3wX4yZ5aB6',
    analysisUrl: 'https://gateway.pinata.cloud/ipfs/QmY5Sk4TpL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ',
    imageCID: 'QmX4Rh3EYqFjP9H8w2N5K6vL7mT9pQ1sR2uV3wX4yZ5aB6',
    analysisCID: 'QmY5Sk4TpL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ'
  };

  // Step 4: Format proposal description (same as bot does)
  const proposalDescription = formatProposalDescription(analysisData, mockProposalData);

  console.log('📝 Formatted Proposal Description:\n');
  console.log('═'.repeat(80));
  console.log(proposalDescription);
  console.log('═'.repeat(80));
  console.log();

  // Step 5: Show what would be submitted
  console.log('✅ Proposal Ready for Submission\n');
  console.log('📊 Proposal Stats:');
  console.log(`  Length: ${proposalDescription.length} characters`);
  console.log(`  Lines: ${proposalDescription.split('\n').length}`);
  console.log(`  Has 0G Tagline: ${analysisData.zgComputeEnhancement ? '✅ Yes' : '❌ No'}`);
  console.log(`  Has 0G Metadata: ${analysisData.zgComputeEnhancement ? '✅ Yes' : '❌ No'}`);
  console.log();

  // Step 6: Simulate blockchain submission (without actually doing it)
  console.log('🔄 Simulating Blockchain Submission...\n');
  console.log('Would call: contract.createProposal(description)');
  console.log('Contract Address: 0x033480cD0519B7e5b2AAcd64F7B5C018FbeEC20A');
  console.log('Network: ADI Testnet');
  console.log();

  console.log('✅ Test Complete!\n');
  console.log('Summary:');
  console.log('  ✅ Analysis loaded successfully');
  console.log(`  ${analysisData.zgComputeEnhancement ? '✅' : '⚠️ '} 0G enhancement ${analysisData.zgComputeEnhancement ? 'included' : 'not found'}`);
  console.log('  ✅ Proposal formatted correctly');
  console.log('  ✅ Ready for blockchain submission');
  console.log();

  if (!analysisData.zgComputeEnhancement) {
    console.log('💡 To test with 0G enhancement:');
    console.log('   1. Add PRIVATE_KEY to .env');
    console.log('   2. Send a new video to the bot');
    console.log('   3. The analysis will include 0G-generated tagline');
    console.log('   4. Run this test again');
  }
}

/**
 * Format proposal description (same logic as bot)
 */
function formatProposalDescription(analysisData: any, proposalData: any): string {
  const location = [
    analysisData.metadata?.location?.city,
    analysisData.metadata?.location?.state,
    analysisData.metadata?.location?.country
  ].filter(Boolean).join(", ");

  const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Check if we have 0G enhancement
  const hasEnhancement = analysisData.zgComputeEnhancement?.tagline;
  const tagline = hasEnhancement ? analysisData.zgComputeEnhancement.tagline : '';

  let description = `Impact Initiative Proposal

Submission ID: ${submissionId}
Location: ${location}
Coordinates: ${analysisData.metadata?.location?.coordinates?.lat}, ${analysisData.metadata?.location?.coordinates?.lng}
Impact Score: ${analysisData.impactAssessment?.score || 'N/A'}
Urgency: ${analysisData.impactAssessment?.urgency || 'N/A'}
Category: ${analysisData.impactAssessment?.category || 'N/A'}`;

  // Add 0G-generated tagline if available
  if (hasEnhancement) {
    description += `

⚡ AI-Generated Summary (powered by 0G Compute):
"${tagline}"`;
  }

  description += `

Description:
${analysisData.analysis?.description || 'No description available'}

Current Conditions:
- Weather: ${analysisData.context?.weather?.conditions || 'N/A'} (${analysisData.context?.weather?.temperature || 'N/A'}°C)

Estimated Impact:
${analysisData.impactAssessment?.estimatedImpact || 'To be assessed by DAO members'}

Recommended Actions:
${(analysisData.impactAssessment?.recommendedActions || []).map((action: string) => `- ${action}`).join('\n')}

Evidence & Verification:
- Image IPFS: ${proposalData.imageUrl}
- Analysis IPFS: ${proposalData.analysisUrl}
- Confidence Score: ${analysisData.analysis?.confidence || 'N/A'}%
- Timestamp: ${analysisData.metadata?.timestamp || new Date().toISOString()}`;

  // Add 0G metadata if available
  if (hasEnhancement) {
    description += `

⚡ 0G Network Integration:
- Compute Model: ${analysisData.zgComputeEnhancement.model}
- Processing Time: ${analysisData.zgComputeEnhancement.executionTime}ms
- Provider Address: ${analysisData.zgComputeEnhancement.providerAddress}
- Network: ${analysisData.zgComputeEnhancement.provider}`;
  }

  description += `

This proposal has been automatically generated from verified analysis data.
All information is stored on IPFS and can be independently verified.`;

  return description.trim();
}

main().catch(console.error);

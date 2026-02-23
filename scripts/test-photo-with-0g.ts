/**
 * Test Photo Analysis with 0G Enhancement
 * 
 * This script:
 * 1. Analyzes an existing photo
 * 2. Automatically enhances with 0G Compute
 * 3. Shows the enhanced analysis
 * 4. Formats a proposal (without submitting)
 */

import { PhotoAnalyzer } from '../tg_analysis/analyze-photo';
import { ImageAnalysisProvider, LocationProvider, WeatherProvider, NewsProvider } from '../tg_analysis/providers';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', 'tg_analysis', '.env') });

async function main() {
  console.log('🧪 Testing Photo Analysis with 0G Enhancement\n');

  // Check if PRIVATE_KEY is set
  const hasPrivateKey = !!(process.env.PRIVATE_KEY || process.env.ZG_COMPUTE_PRIVATE_KEY);
  console.log(`🔑 Private Key: ${hasPrivateKey ? '✅ Set' : '❌ Not set'}`);
  
  if (!hasPrivateKey) {
    console.log('\n⚠️  0G Compute will use fallback mode (rule-based taglines)');
    console.log('   To test real 0G Compute, add PRIVATE_KEY to .env\n');
  } else {
    console.log('   0G Compute will generate AI taglines using qwen-2.5-7b-instruct\n');
  }

  // Initialize providers
  const providers = {
    imageAnalysis: new ImageAnalysisProvider(process.env.ANTHROPIC_API_KEY!),
    location: new LocationProvider(),
    weather: new WeatherProvider(),
    news: new NewsProvider()
  };

  const analyzer = new PhotoAnalyzer(providers);

  // Use the existing photo
  const photoPath = path.join(__dirname, '..', 'details', 'photo', 'photo-308_singular_display_fullPicture.HEIC');
  
  console.log('📸 Analyzing photo...');
  console.log(`   Path: ${photoPath}\n`);

  try {
    console.log('⏳ This will take 30-60 seconds...\n');
    console.log('Steps:');
    console.log('  1. Extract metadata');
    console.log('  2. Analyze with Claude Vision');
    console.log('  3. Get location, weather, news');
    console.log('  4. ⚡ Generate tagline with 0G Compute');
    console.log('  5. Upload to IPFS');
    console.log();

    const result = await analyzer.analyzePhoto(photoPath);

    if (result.success) {
      console.log('✅ Analysis Complete!\n');

      const analysis = result.data.imageAnalysis;

      // Show basic info
      console.log('📊 Analysis Summary:');
      console.log(`  Location: ${analysis.metadata?.location?.city}, ${analysis.metadata?.location?.state}`);
      console.log(`  Impact Score: ${analysis.impactAssessment?.score}`);
      console.log(`  Urgency: ${analysis.impactAssessment?.urgency}`);
      console.log();

      // Show 0G enhancement
      if (analysis.zgComputeEnhancement) {
        console.log('⚡ 0G Compute Enhancement:');
        console.log(`  Tagline: "${analysis.zgComputeEnhancement.tagline}"`);
        console.log(`  Model: ${analysis.zgComputeEnhancement.model}`);
        console.log(`  Execution Time: ${analysis.zgComputeEnhancement.executionTime}ms`);
        console.log(`  Provider: ${analysis.zgComputeEnhancement.providerAddress}`);
        console.log(`  Note: ${analysis.zgComputeEnhancement.note}`);
        console.log();
      } else {
        console.log('⚠️  No 0G enhancement found\n');
      }

      // Show IPFS URLs
      console.log('☁️  IPFS Storage:');
      console.log(`  Image: ${analysis.storage.imageUrl}`);
      console.log(`  Analysis: ${analysis.storage.analysisUrl}`);
      console.log();

      // Format proposal
      console.log('📝 Proposal Preview:\n');
      console.log('═'.repeat(80));
      
      const proposalDescription = formatProposal(analysis);
      console.log(proposalDescription.substring(0, 800) + '...\n[truncated]');
      
      console.log('═'.repeat(80));
      console.log();

      console.log('✅ Test Complete!\n');
      console.log('Summary:');
      console.log(`  ✅ Photo analyzed successfully`);
      console.log(`  ${analysis.zgComputeEnhancement ? '✅' : '⚠️ '} 0G enhancement ${analysis.zgComputeEnhancement ? 'included' : 'not found'}`);
      console.log(`  ✅ Uploaded to IPFS`);
      console.log(`  ✅ Ready for DAO proposal`);
      console.log();

      if (analysis.zgComputeEnhancement) {
        console.log('🎉 0G Compute integration working!');
        console.log('   The tagline will appear in all proposals created from this analysis.');
      }

    } else {
      console.log('❌ Analysis failed');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

function formatProposal(analysis: any): string {
  const location = [
    analysis.metadata?.location?.city,
    analysis.metadata?.location?.state,
    analysis.metadata?.location?.country
  ].filter(Boolean).join(", ");

  const hasEnhancement = analysis.zgComputeEnhancement?.tagline;
  const tagline = hasEnhancement ? analysis.zgComputeEnhancement.tagline : '';

  let description = `Impact Initiative Proposal

Location: ${location}
Impact Score: ${analysis.impactAssessment?.score || 'N/A'}
Urgency: ${analysis.impactAssessment?.urgency || 'N/A'}`;

  if (hasEnhancement) {
    description += `

⚡ AI-Generated Summary (powered by 0G Compute):
"${tagline}"`;
  }

  description += `

Description:
${analysis.analysis?.description || 'No description available'}

Evidence & Verification:
- Image IPFS: ${analysis.storage.imageUrl}
- Analysis IPFS: ${analysis.storage.analysisUrl}`;

  if (hasEnhancement) {
    description += `

⚡ 0G Network Integration:
- Compute Model: ${analysis.zgComputeEnhancement.model}
- Processing Time: ${analysis.zgComputeEnhancement.executionTime}ms
- Provider Address: ${analysis.zgComputeEnhancement.providerAddress}`;
  }

  return description;
}

main().catch(console.error);

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface IPFSAnalysis {
  metadata: {
    timestamp: string;
    location: {
      coordinates: { lat: number; lng: number };
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
    hash?: string;
  };
  analysis: {
    description: string;
    confidence: number;
  };
  impactAssessment: {
    score: number;
    category: string;
    urgency: string;
    estimatedImpact: string;
    recommendedActions: string[];
  };
}

async function testClaudeEnhancement() {
  console.log("🤖 Testing Claude AI Metadata Enhancement\n");

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
    console.log("⚠️  ANTHROPIC_API_KEY not configured in .env");
    console.log("\nTo test Claude enhancement:");
    console.log("1. Get API key from https://console.anthropic.com/");
    console.log("2. Add to .env: ANTHROPIC_API_KEY=sk-ant-...");
    console.log("3. Run this script again");
    console.log("\n📝 Showing what Claude would do with mock data...\n");
    showMockEnhancement();
    return;
  }

  // Load the analysis file
  const analysisPath = path.join(process.cwd(), 'details', 'analysis', 'analysis-2026-02-20T17-38-13-802Z.json');
  const analysisData: IPFSAnalysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

  console.log("📄 Input Analysis Data:");
  console.log(JSON.stringify(analysisData, null, 2));

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are an AI assistant helping to create structured proposal metadata for a DAO governance system.

Given the following analysis data, extract and generate the required metadata fields:

ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

REQUIRED OUTPUT (JSON format):
{
  "title": "Short, descriptive title (max 100 chars)",
  "description": "Detailed description of the issue and proposed solution",
  "location": "Human-readable location string",
  "requestedAmount": "Estimated funding needed in ADI tokens (numeric string)",
  "beneficiary": "Ethereum address or use 0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
  "propertyId": "Unique identifier for this location/property (generate from coordinates)",
  "evidenceHash": "Hash of the evidence (use metadata.hash or generate from data)",
  "verificationConfidence": "Confidence score 0-100 (from analysis.confidence)",
  "issueType": "0=Environmental, 1=Infrastructure, 2=Healthcare, 3=Education, 4=Humanitarian, 5=Economic, 6=Social",
  "severity": "0=Low, 1=Medium, 2=High, 3=Critical (based on urgency and impact score)"
}

INSTRUCTIONS:
1. Create a compelling title that captures the essence of the issue
2. Write a clear description that includes the problem, proposed solution, and expected impact
3. Format location as "City, State, Country" or best available
4. Estimate funding based on the impact assessment and recommended actions (reasonable amount in ADI, typically 1000-10000)
5. Use 0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B for beneficiary
6. Generate propertyId from coordinates (format: "PROP_LAT_LNG")
7. Use existing hash or generate one from the data
8. Map the category to the most appropriate issueType enum value
9. Determine severity based on urgency field and impact score

Return ONLY valid JSON, no additional text.`;

  try {
    console.log("\n🤖 Calling Claude API...");
    
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log("\n✅ Claude Response:");
    console.log(responseText);

    // Parse and validate
    const metadata = JSON.parse(responseText);
    
    console.log("\n📊 Enhanced Metadata:");
    console.log("- Title:", metadata.title);
    console.log("- Location:", metadata.location);
    console.log("- Requested Amount:", metadata.requestedAmount, "ADI");
    console.log("- Property ID:", metadata.propertyId);
    console.log("- Evidence Hash:", metadata.evidenceHash);
    console.log("- Verification Confidence:", metadata.verificationConfidence + "%");
    console.log("- Issue Type:", metadata.issueType, getIssueTypeName(metadata.issueType));
    console.log("- Severity:", metadata.severity, getSeverityName(metadata.severity));
    console.log("- Beneficiary:", metadata.beneficiary);

    console.log("\n✅ Claude successfully enhanced the metadata!");
    console.log("🎯 This metadata is ready to be submitted to the DAO contract");

  } catch (error: any) {
    console.error("\n❌ Error calling Claude API:", error.message);
    if (error.status === 401) {
      console.log("\n⚠️  Invalid API key. Please check your ANTHROPIC_API_KEY in .env");
    }
  }
}

function showMockEnhancement() {
  console.log("📊 Mock Enhanced Metadata (what Claude would generate):");
  console.log({
    title: "Winter Landscape Documentation - Brookline Historic District",
    description: `SITUATION:
A frozen lake in Brookline, Massachusetts surrounded by historic architecture during winter conditions. The scene shows clear weather but freezing temperatures affecting the local area.

PROPOSED SOLUTION:
- Document winter conditions for historical records
- Assess infrastructure needs for historic buildings
- Monitor environmental impact on frozen water bodies
- Engage local stakeholders for winter preparedness

EXPECTED IMPACT:
- Improved understanding of winter conditions in historic areas
- Better preparation for future winter seasons
- Enhanced community awareness of environmental changes

VERIFICATION:
Evidence captured via Ray-Ban Meta Smart Glasses with 5% confidence score.`,
    location: "Brookline, Massachusetts, United States",
    requestedAmount: "2000",
    beneficiary: "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B",
    propertyId: "PROP_42.328_-71.133",
    evidenceHash: "0xd5269d12890377e512619698b5b69f358953edea383e2726e59ddc93b13c18fc",
    verificationConfidence: 5,
    issueType: 0, // Environmental
    severity: 1, // Medium
  });
  
  console.log("\n💡 To see real Claude enhancement, add your API key to .env");
}

function getIssueTypeName(type: number): string {
  const types = ["Environmental", "Infrastructure", "Healthcare", "Education", "Humanitarian", "Economic", "Social"];
  return types[type] || "Unknown";
}

function getSeverityName(severity: number): string {
  const severities = ["Low", "Medium", "High", "Critical"];
  return severities[severity] || "Unknown";
}

testClaudeEnhancement()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

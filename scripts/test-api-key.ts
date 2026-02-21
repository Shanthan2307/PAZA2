import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAPIKey() {
  console.log("🔑 Testing Anthropic API Key\n");

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
    console.log("❌ ANTHROPIC_API_KEY not configured");
    return;
  }

  console.log("✅ API Key found in .env");
  console.log(`   Key starts with: ${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...`);

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Try different models
  const modelsToTry = [
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
  ];

  for (const model of modelsToTry) {
    console.log(`\n🧪 Testing model: ${model}`);
    try {
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello" in JSON format: {"message": "Hello"}'
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      console.log(`   ✅ SUCCESS! Response: ${responseText.substring(0, 50)}...`);
      console.log(`   ✅ This model works! Use: ${model}`);
      break;
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

testAPIKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

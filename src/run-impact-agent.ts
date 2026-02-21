import { createProposalPredictionMarketAction } from './social-impact/actions/create-proposal-prediction-market.action';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Simple logger implementation
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
};

async function main() {
  logger.info('Starting Social Impact Agent...');
  logger.info('='.repeat(50));

  // Verify directories exist
  const analysisDir = path.join(process.cwd(), 'details', 'analysis');
  if (!fs.existsSync(analysisDir)) {
    logger.error(`Analysis directory not found: ${analysisDir}`);
    logger.info('Please create the directory and add analysis JSON files');
    process.exit(1);
  }

  // Check for analysis files
  const files = fs.readdirSync(analysisDir).filter(f => f.endsWith('.json'));
  logger.info(`Found ${files.length} analysis file(s) in ${analysisDir}`);
  
  if (files.length === 0) {
    logger.warn('No analysis files found. Please add JSON files to the analysis directory.');
    process.exit(0);
  }

  // Verify environment variables
  const requiredEnvVars = [
    'DAO_CHAIN_RPC_URL',
    'CREATE_PROPOSAL_PRIVATE_KEY',
    'DAO_CONTRACT_ADDRESS'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:');
    missingVars.forEach(v => logger.error(`  - ${v}`));
    process.exit(1);
  }

  logger.info('Configuration:');
  logger.info(`  RPC URL: ${process.env.DAO_CHAIN_RPC_URL}`);
  logger.info(`  Chain ID: ${process.env.DAO_CHAIN_ID || 'Not set'}`);
  logger.info(`  DAO Contract: ${process.env.DAO_CONTRACT_ADDRESS}`);
  logger.info('='.repeat(50));

  try {
    logger.info('Processing analyses and creating proposals...\n');

    // Create a minimal runtime and memory object for the action
    const mockRuntime: any = {
      // Add any required runtime properties here
    };

    const mockMessage: any = {
      content: {
        text: 'create proposal',
        type: 'text'
      }
    };

    // Execute the action
    const result = await createProposalPredictionMarketAction.handler(mockRuntime, mockMessage);

    logger.info('\n' + '='.repeat(50));
    logger.info('RESULTS:');
    logger.info('='.repeat(50));

    if (Array.isArray(result)) {
      result.forEach((r, i) => {
        logger.info(`\nProposal ${i + 1}:`);
        if (r.success) {
          logger.info(`  ✅ Success`);
          logger.info(`  Proposal ID: ${r.proposalId}`);
          logger.info(`  Transaction: ${r.txHash}`);
          logger.info(`  File: ${r.filename}`);
        } else {
          logger.error(`  ❌ Failed: ${r.error || r.message}`);
        }
      });
    } else {
      if (result.success) {
        logger.info(`✅ ${result.message}`);
      } else {
        logger.error(`❌ ${result.error || result.message}`);
      }
    }

    logger.info('\n' + '='.repeat(50));
    logger.info('Impact Agent completed successfully');
    logger.info('Check processed-files.json for tracking');
    logger.info('='.repeat(50));

  } catch (error) {
    logger.error('Error running impact agent:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

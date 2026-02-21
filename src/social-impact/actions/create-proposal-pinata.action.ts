import { Action, IAgentRuntime, Memory, elizaLogger } from '../mock-eliza';
import { ethers } from 'ethers';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import FormData from 'form-data';

export interface CreateProposalResult {
  success: boolean;
  proposalId?: string;
  message?: string;
  error?: string;
  txHash?: string;
  filename?: string;
  ipfsCID?: string;
}

interface IPFSAnalysis {
  metadata: {
    timestamp: string;
    location: {
      coordinates: {
        lat: number;
        lng: number;
      };
      address?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  };
  analysis: {
    description: string;
    categories?: string[];
    tags?: string[];
    confidence: number;
  };
  context: {
    weather?: {
      temperature?: number;
      conditions?: string;
    };
    news?: {
      relevantArticles?: Array<{
        title: string;
        url: string;
      }>;
    };
  };
  impactAssessment: {
    score: number;
    category: string;
    urgency: string;
    estimatedImpact: string;
    recommendedActions: string[];
  };
}

// Contract ABI for SimpleDAO
const CONTRACT_ABI = [
  "function createProposal(string calldata description) external returns (bytes32)",
  "event ProposalCreated(bytes32 indexed proposalId, string description, uint256 deadline)"
];

interface ProcessedFile {
  filename: string;
  proposalId: string;
  timestamp: string;
  status: 'success' | 'failed';
  txHash?: string;
  ipfsCID?: string;
}

const PROCESSED_FILES_FILE = 'processed-files.json';

async function loadProcessedFiles(): Promise<ProcessedFile[]> {
  try {
    const data = await fs.readFile(PROCESSED_FILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    await fs.writeFile(PROCESSED_FILES_FILE, '[]', 'utf8');
    return [];
  }
}

async function isAlreadyProcessed(filename: string): Promise<boolean> {
  const processed = await loadProcessedFiles();
  return processed.some(p => p.filename === filename);
}

async function saveProcessedFile(file: ProcessedFile) {
  const processed = await loadProcessedFiles();
  processed.push(file);
  await fs.writeFile(PROCESSED_FILES_FILE, JSON.stringify(processed, null, 2));
}

async function uploadToPinata(analysisData: IPFSAnalysis, filename: string): Promise<string> {
  try {
    elizaLogger.info(`Uploading ${filename} to Pinata...`);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: analysisData,
        pinataMetadata: {
          name: filename,
          keyvalues: {
            type: 'social-impact-analysis',
            timestamp: analysisData.metadata.timestamp,
            category: analysisData.impactAssessment.category,
            urgency: analysisData.impactAssessment.urgency,
            score: analysisData.impactAssessment.score.toString()
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const ipfsHash = response.data.IpfsHash;
    elizaLogger.info(`✅ Uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    elizaLogger.error('Error uploading to Pinata:', error);
    throw new Error(`Failed to upload to Pinata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listLocalAnalysisFiles(): Promise<string[]> {
  const analysisDir = path.join(process.cwd(), 'details', 'analysis');
  try {
    const files = await fs.readdir(analysisDir);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    elizaLogger.error('Error reading analysis directory:', error);
    throw new Error(`Cannot read analysis directory: ${analysisDir}`);
  }
}

async function fetchLocalAnalysis(filename: string): Promise<IPFSAnalysis> {
  const analysisPath = path.join(process.cwd(), 'details', 'analysis', filename);
  try {
    elizaLogger.info(`Reading analysis file: ${filename}`);
    const fileContent = await fs.readFile(analysisPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const validatedData = await validateAnalysisData(data);
    elizaLogger.info('Successfully validated analysis data structure');
    return validatedData;
  } catch (error) {
    if (error instanceof Error) {
      elizaLogger.error('Error reading/validating analysis file:', error.message);
      throw new Error(`Analysis file error: ${error.message}`);
    }
    throw error;
  }
}

async function processNewAnalyses(): Promise<CreateProposalResult[]> {
  try {
    const processedFiles = await loadProcessedFiles();
    const processedFilenames = new Set(processedFiles.map(p => p.filename));
    const allFiles = await listLocalAnalysisFiles();
    const newFiles = allFiles.filter(file => !processedFilenames.has(file));
    
    if (newFiles.length === 0) {
      return [{
        success: false,
        message: 'No new analyses found to process'
      }];
    }

    const results: CreateProposalResult[] = [];

    for (const filename of newFiles) {
      try {
        if (await isAlreadyProcessed(filename)) {
          results.push({
            success: false,
            message: `File ${filename} has already been processed`,
            filename
          });
          continue;
        }

        const analysisData = await fetchLocalAnalysis(filename);
        
        // Upload to Pinata first
        const ipfsCID = await uploadToPinata(analysisData, filename);
        
        // Create proposal with IPFS link
        const result = await createProposal(analysisData, filename, ipfsCID);
        
        await saveProcessedFile({
          filename,
          proposalId: result.proposalId!,
          timestamp: new Date().toISOString(),
          status: result.success ? 'success' : 'failed',
          txHash: result.txHash,
          ipfsCID
        });

        results.push(result);
      } catch (error) {
        elizaLogger.error(`Error processing file ${filename}:`, error);
        results.push({
          success: false,
          error: `Failed to process ${filename}: ${error instanceof Error ? error.message : String(error)}`,
          filename
        });
      }
    }

    return results;
  } catch (error) {
    elizaLogger.error('Error processing new analyses:', error);
    throw error;
  }
}

async function createProposal(analysisData: IPFSAnalysis, filename: string, ipfsCID: string): Promise<CreateProposalResult> {
  if (!process.env.DAO_CHAIN_RPC_URL) {
    throw new Error('DAO_CHAIN_RPC_URL not configured');
  }
  if (!process.env.CREATE_PROPOSAL_PRIVATE_KEY) {
    throw new Error('CREATE_PROPOSAL_PRIVATE_KEY not configured');
  }
  if (!process.env.DAO_CONTRACT_ADDRESS) {
    throw new Error('DAO_CONTRACT_ADDRESS not configured');
  }

  const location = [
    analysisData.metadata.location.city,
    analysisData.metadata.location.state,
    analysisData.metadata.location.country
  ].filter(Boolean).join(", ");

  const description = `
Impact Initiative Proposal

Location: ${location}
Coordinates: ${analysisData.metadata.location.coordinates.lat}, ${analysisData.metadata.location.coordinates.lng}
Impact Score: ${analysisData.impactAssessment.score}
Urgency: ${analysisData.impactAssessment.urgency}
Category: ${analysisData.impactAssessment.category}

Description:
${analysisData.analysis.description}

Current Conditions:
- Weather: ${analysisData.context.weather?.conditions || 'N/A'} (${analysisData.context.weather?.temperature || 'N/A'}°C)

Estimated Impact:
${analysisData.impactAssessment.estimatedImpact}

Recommended Actions:
${analysisData.impactAssessment.recommendedActions.map(action => `- ${action}`).join('\n')}

Evidence & Verification:
- IPFS: https://gateway.pinata.cloud/ipfs/${ipfsCID}
- Analysis File: ${filename}
- Confidence Score: ${analysisData.analysis.confidence}%
- Timestamp: ${analysisData.metadata.timestamp}

This proposal has been automatically generated from verified analysis data.
All information is stored on IPFS and can be independently verified.
  `.trim();

  const provider = new ethers.JsonRpcProvider(process.env.DAO_CHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(process.env.DAO_CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);

  elizaLogger.info(`Creating proposal on chain...`);
  
  const tx = await contract.createProposal(description);
  elizaLogger.info(`Transaction sent: ${tx.hash}`);
  
  const receipt = await tx.wait();
  elizaLogger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

  const proposalCreatedEvent = contract.interface.getEvent('ProposalCreated');
  if (!proposalCreatedEvent) {
    throw new Error('ProposalCreated event not found in contract ABI');
  }

  const event = receipt.logs.find(
    (log: any) => log.topics[0] === proposalCreatedEvent.topicHash
  );

  if (!event) {
    throw new Error('Proposal creation event not found in transaction receipt');
  }

  const parsedEvent = contract.interface.parseLog({
    topics: event.topics,
    data: event.data
  });

  const proposalId = parsedEvent?.args?.[0];

  return {
    success: true,
    proposalId,
    txHash: tx.hash,
    filename,
    ipfsCID,
    message: `Proposal created successfully\nID: ${proposalId}\nIPFS: ${ipfsCID}\nTransaction: ${tx.hash}`
  };
}

async function validateAnalysisData(data: any): Promise<IPFSAnalysis> {
  if (!data) {
    throw new Error('No data received from analysis file');
  }

  const errors: string[] = [];

  if (!data.metadata?.timestamp) {
    errors.push('Missing required field: metadata.timestamp');
  }

  if (!data.metadata?.location?.coordinates) {
    errors.push('Missing required field: metadata.location.coordinates');
  } else {
    const { lat, lng } = data.metadata.location.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      errors.push('Invalid coordinates: lat and lng must be numbers');
    }
  }

  if (!data.analysis?.description) {
    errors.push('Missing required field: analysis.description');
  }

  if (!data.impactAssessment?.score) {
    errors.push('Missing required field: impactAssessment.score');
  }

  if (errors.length > 0) {
    throw new Error(`Analysis data validation failed:\n${errors.join('\n')}`);
  }

  return data as IPFSAnalysis;
}

export const createProposalAction: Action = {
  name: 'CREATE_PROPOSAL',
  description: 'Create a new proposal in the SimpleDAO with IPFS storage',
  similes: ['CREATE_PROPOSAL', 'SUBMIT_PROPOSAL', 'PROPOSE'],
  examples: [
    [{
      user: 'user',
      content: { 
        text: 'Create proposal',
        type: 'text'
      }
    }]
  ],

  async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
    const content = message.content as any;
    const text = content?.text?.toLowerCase() || '';
    return text.includes('create proposal') || 
           text.includes('submit proposal') || 
           text.includes('propose');
  },

  async handler(runtime: IAgentRuntime, message: Memory): Promise<CreateProposalResult | CreateProposalResult[]> {
    try {
      elizaLogger.info('Starting proposal creation with Pinata upload...');
      
      const results = await processNewAnalyses();
      
      if (results.length === 0) {
        return {
          success: false,
          message: 'No new analyses found to process'
        };
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const duplicateCount = results.filter(r => r.message?.includes('already been processed')).length;
      
      const summaryMessage = `Processed ${results.length} analyses:
- ${successCount} proposals created successfully
- ${duplicateCount} were already processed
- ${failureCount - duplicateCount} failed to process

Details:
${results.map(r => {
  if (r.success) {
    return `✅ Created proposal ${r.proposalId}\n   IPFS: ${r.ipfsCID}\n   File: ${r.filename}`;
  } else if (r.message?.includes('already been processed')) {
    return `ℹ️ Skipped ${r.filename} - already processed`;
  } else {
    return `❌ Failed ${r.filename}: ${r.error}`;
  }
}).join('\n')}`;

      return {
        success: successCount > 0 || duplicateCount > 0,
        message: summaryMessage,
        error: (failureCount - duplicateCount) > 0 ? 'Some proposals failed' : undefined
      };

    } catch (error) {
      elizaLogger.error('Error in proposal creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

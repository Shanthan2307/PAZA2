import { Action, IAgentRuntime, Memory, elizaLogger } from '../mock-eliza';
import { ethers } from 'ethers';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

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
    hash?: string;
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
    stakeholders?: string[];
  };
}

interface EnhancedProposalMetadata {
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  requestedAmount: string;
  beneficiary: string;
  propertyId: string;
  evidenceHash: string;
  verificationConfidence: number;
  issueType: number; // 0-6 enum
  severity: number; // 0-3 enum
  ipfsCID: string;
}

// Contract ABI for PredictionMarketDAO
const CONTRACT_ABI = [
  `function createProposal(
    string calldata title,
    string calldata description,
    string calldata location,
    int256 latitude,
    int256 longitude,
    uint256 requestedAmount,
    address beneficiary,
    bytes32 propertyId,
    bytes32 evidenceHash,
    uint8 verificationConfidence,
    uint8 issueType,
    uint8 severity,
    string calldata ipfsCID
  ) external returns (bytes32)`,
  "event ProposalCreated(bytes32 indexed proposalId, bytes32 indexed propertyId, bytes32 evidenceHash, uint8 issueType, uint8 severity, uint256 deadline, uint256 resolutionDeadline)"
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

async function enhanceMetadataWithClaude(analysisData: IPFSAnalysis): Promise<EnhancedProposalMetadata> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

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
  "beneficiary": "Ethereum address or 0x0000000000000000000000000000000000000000 if unknown",
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
4. Estimate funding based on the impact assessment and recommended actions (reasonable amount in ADI)
5. Use 0x0000000000000000000000000000000000000000 for beneficiary if not specified
6. Generate propertyId from coordinates (format: "PROP_LAT_LNG")
7. Use existing hash or generate one from the data
8. Map the category to the most appropriate issueType enum value
9. Determine severity based on urgency field and impact score

Return ONLY valid JSON, no additional text.`;

  try {
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
    elizaLogger.info('Claude response:', responseText);

    // Parse the JSON response
    const metadata = JSON.parse(responseText);

    // Add IPFS CID placeholder (will be filled after upload)
    metadata.ipfsCID = '';
    
    // Add coordinates
    metadata.latitude = analysisData.metadata.location.coordinates.lat;
    metadata.longitude = analysisData.metadata.location.coordinates.lng;

    return metadata as EnhancedProposalMetadata;
  } catch (error) {
    elizaLogger.error('Error calling Claude API:', error);
    throw new Error(`Failed to enhance metadata with Claude: ${error instanceof Error ? error.message : String(error)}`);
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
        
        // Enhance metadata with Claude
        elizaLogger.info('Enhancing metadata with Claude AI...');
        const enhancedMetadata = await enhanceMetadataWithClaude(analysisData);
        
        // Upload to Pinata
        const ipfsCID = await uploadToPinata(analysisData, filename);
        enhancedMetadata.ipfsCID = ipfsCID;
        
        // Create proposal with enhanced metadata
        const result = await createProposal(enhancedMetadata, filename);
        
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

async function createProposal(metadata: EnhancedProposalMetadata, filename: string): Promise<CreateProposalResult> {
  if (!process.env.DAO_CHAIN_RPC_URL) {
    throw new Error('DAO_CHAIN_RPC_URL not configured');
  }
  if (!process.env.CREATE_PROPOSAL_PRIVATE_KEY) {
    throw new Error('CREATE_PROPOSAL_PRIVATE_KEY not configured');
  }
  if (!process.env.DAO_CONTRACT_ADDRESS) {
    throw new Error('DAO_CONTRACT_ADDRESS not configured');
  }

  const provider = new ethers.JsonRpcProvider(process.env.DAO_CHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(process.env.DAO_CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);

  elizaLogger.info(`Creating proposal on chain with enhanced metadata...`);
  elizaLogger.info(`Title: ${metadata.title}`);
  elizaLogger.info(`Issue Type: ${metadata.issueType}, Severity: ${metadata.severity}`);
  
  // Convert coordinates to fixed-point integers (multiply by 1e6)
  const latInt = Math.floor(metadata.latitude * 1e6);
  const lngInt = Math.floor(metadata.longitude * 1e6);
  
  // Convert propertyId and evidenceHash to bytes32
  const propertyIdBytes32 = ethers.id(metadata.propertyId);
  const evidenceHashBytes32 = metadata.evidenceHash.startsWith('0x') 
    ? metadata.evidenceHash 
    : ethers.id(metadata.evidenceHash);
  
  // Convert requestedAmount to wei (assuming ADI has 18 decimals)
  const requestedAmountWei = ethers.parseEther(metadata.requestedAmount);
  
  const tx = await contract.createProposal(
    metadata.title,
    metadata.description,
    metadata.location,
    latInt,
    lngInt,
    requestedAmountWei,
    metadata.beneficiary,
    propertyIdBytes32,
    evidenceHashBytes32,
    metadata.verificationConfidence,
    metadata.issueType,
    metadata.severity,
    metadata.ipfsCID
  );
  
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
    ipfsCID: metadata.ipfsCID,
    message: `Proposal created successfully
Title: ${metadata.title}
ID: ${proposalId}
IPFS: ${metadata.ipfsCID}
Transaction: ${tx.hash}
Issue Type: ${metadata.issueType}
Severity: ${metadata.severity}`
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

export const createProposalEnhancedAction: Action = {
  name: 'CREATE_PROPOSAL_ENHANCED',
  description: 'Create a new proposal in the PredictionMarketDAO with AI-enhanced metadata',
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
      elizaLogger.info('Starting enhanced proposal creation with Claude AI...');
      
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
      
      const summaryMessage = `Processed ${results.length} analyses with AI enhancement:
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
      elizaLogger.error('Error in enhanced proposal creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

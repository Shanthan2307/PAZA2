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
  issueType: number;
  severity: number;
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

const PROCESSED_FILES_FILE = 'processed-files-pm.json';

async function loadProcessedFiles(): Promise<any[]> {
  try {
    const data = await fs.readFile(PROCESSED_FILES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    await fs.writeFile(PROCESSED_FILES_FILE, '[]', 'utf8');
    return [];
  }
}

async function saveProcessedFile(file: any) {
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
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
    // Fallback to manual enhancement
    return {
      title: `Social Impact Initiative - ${analysisData.metadata.location.city || 'Unknown Location'}`,
      description: analysisData.analysis.description,
      location: `${analysisData.metadata.location.city}, ${analysisData.metadata.location.state}, ${analysisData.metadata.location.country}`,
      latitude: analysisData.metadata.location.coordinates.lat,
      longitude: analysisData.metadata.location.coordinates.lng,
      requestedAmount: "1000",
      beneficiary: process.env.CREATE_PROPOSAL_PRIVATE_KEY ? 
        new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY).address : 
        "0x0000000000000000000000000000000000000000",
      propertyId: `PROP_${analysisData.metadata.location.coordinates.lat}_${analysisData.metadata.location.coordinates.lng}`,
      evidenceHash: analysisData.metadata.hash || ethers.id(JSON.stringify(analysisData)),
      verificationConfidence: analysisData.analysis.confidence || 50,
      issueType: 6, // Social
      severity: analysisData.impactAssessment.urgency === 'high' ? 2 : 1,
      ipfsCID: ''
    };
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this social impact data and generate proposal metadata in JSON format:

${JSON.stringify(analysisData, null, 2)}

Return ONLY valid JSON with these fields:
{
  "title": "Short descriptive title (max 100 chars)",
  "description": "Detailed description with situation, solution, and impact",
  "requestedAmount": "Funding estimate in ADI (1000-10000)",
  "issueType": "0=Environmental, 1=Infrastructure, 2=Healthcare, 3=Education, 4=Humanitarian, 5=Economic, 6=Social",
  "severity": "0=Low, 1=Medium, 2=High, 3=Critical"
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const claudeData = JSON.parse(responseText);

    return {
      title: claudeData.title || `Impact Initiative - ${analysisData.metadata.location.city}`,
      description: claudeData.description || analysisData.analysis.description,
      location: `${analysisData.metadata.location.city}, ${analysisData.metadata.location.state}, ${analysisData.metadata.location.country}`,
      latitude: analysisData.metadata.location.coordinates.lat,
      longitude: analysisData.metadata.location.coordinates.lng,
      requestedAmount: claudeData.requestedAmount || "1000",
      beneficiary: process.env.CREATE_PROPOSAL_PRIVATE_KEY ? 
        new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY).address : 
        "0x0000000000000000000000000000000000000000",
      propertyId: `PROP_${analysisData.metadata.location.coordinates.lat}_${analysisData.metadata.location.coordinates.lng}`,
      evidenceHash: analysisData.metadata.hash || ethers.id(JSON.stringify(analysisData)),
      verificationConfidence: analysisData.analysis.confidence || 50,
      issueType: claudeData.issueType || 6,
      severity: claudeData.severity || 1,
      ipfsCID: ''
    };
  } catch (error) {
    elizaLogger.warn('Claude enhancement failed, using fallback');
    return {
      title: `Social Impact Initiative - ${analysisData.metadata.location.city || 'Unknown'}`,
      description: analysisData.analysis.description,
      location: `${analysisData.metadata.location.city}, ${analysisData.metadata.location.state}, ${analysisData.metadata.location.country}`,
      latitude: analysisData.metadata.location.coordinates.lat,
      longitude: analysisData.metadata.location.coordinates.lng,
      requestedAmount: "1000",
      beneficiary: process.env.CREATE_PROPOSAL_PRIVATE_KEY ? 
        new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY).address : 
        "0x0000000000000000000000000000000000000000",
      propertyId: `PROP_${analysisData.metadata.location.coordinates.lat}_${analysisData.metadata.location.coordinates.lng}`,
      evidenceHash: analysisData.metadata.hash || ethers.id(JSON.stringify(analysisData)),
      verificationConfidence: analysisData.analysis.confidence || 50,
      issueType: 6,
      severity: 1,
      ipfsCID: ''
    };
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

  elizaLogger.info(`Creating proposal: ${metadata.title}`);
  
  const latInt = Math.floor(metadata.latitude * 1e6);
  const lngInt = Math.floor(metadata.longitude * 1e6);
  const propertyIdBytes32 = ethers.id(metadata.propertyId);
  const evidenceHashBytes32 = metadata.evidenceHash.startsWith('0x') ? metadata.evidenceHash : ethers.id(metadata.evidenceHash);
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
  elizaLogger.info(`Confirmed in block: ${receipt.blockNumber}`);

  const proposalCreatedEvent = contract.interface.getEvent('ProposalCreated');
  const event = receipt.logs.find((log: any) => log.topics[0] === proposalCreatedEvent?.topicHash);

  if (!event) {
    throw new Error('Proposal creation event not found');
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
    message: `Proposal created: ${metadata.title}`
  };
}

async function processNewAnalyses(): Promise<CreateProposalResult[]> {
  const analysisDir = path.join(process.cwd(), 'details', 'analysis');
  const allFiles = (await fs.readdir(analysisDir)).filter(f => f.endsWith('.json'));
  const processed = await loadProcessedFiles();
  const processedFilenames = new Set(processed.map((p: any) => p.filename));
  const newFiles = allFiles.filter(file => !processedFilenames.has(file));
  
  if (newFiles.length === 0) {
    return [{ success: false, message: 'No new analyses found' }];
  }

  const results: CreateProposalResult[] = [];

  for (const filename of newFiles) {
    try {
      const analysisPath = path.join(analysisDir, filename);
      const fileContent = await fs.readFile(analysisPath, 'utf-8');
      const analysisData: IPFSAnalysis = JSON.parse(fileContent);
      
      elizaLogger.info(`Processing: ${filename}`);
      
      const enhancedMetadata = await enhanceMetadataWithClaude(analysisData);
      const ipfsCID = await uploadToPinata(analysisData, filename);
      enhancedMetadata.ipfsCID = ipfsCID;
      
      const result = await createProposal(enhancedMetadata, filename);
      
      await saveProcessedFile({
        filename,
        proposalId: result.proposalId,
        timestamp: new Date().toISOString(),
        status: 'success',
        txHash: result.txHash,
        ipfsCID
      });

      results.push(result);
    } catch (error) {
      elizaLogger.error(`Failed to process ${filename}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        filename
      });
    }
  }

  return results;
}

export const createProposalPredictionMarketAction: Action = {
  name: 'CREATE_PROPOSAL_PM',
  description: 'Create proposal in PredictionMarketDAO with enhanced metadata',
  similes: ['CREATE_PROPOSAL', 'SUBMIT_PROPOSAL'],
  examples: [],

  async validate(runtime: IAgentRuntime, message: Memory): Promise<boolean> {
    return true;
  },

  async handler(runtime: IAgentRuntime, message: Memory): Promise<CreateProposalResult | CreateProposalResult[]> {
    try {
      return await processNewAnalyses();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

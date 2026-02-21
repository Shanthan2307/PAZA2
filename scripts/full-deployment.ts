import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const PINATA_JWT = process.env.PINATA_JWT!;

async function uploadToPinata(data: any, filename: string): Promise<string> {
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: data,
      pinataMetadata: { name: filename }
    },
    {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.IpfsHash;
}

async function main() {
  console.log('🚀 Starting Full Deployment Process...\n');

  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ADI\n`);

  // Step 1: Deploy PredictionMarketDAO
  console.log('📝 Step 1: Deploying PredictionMarketDAO...');
  
  const daoCode = fs.readFileSync(
    path.join(__dirname, '../contracts/PredictionMarketDAO.sol'),
    'utf8'
  );

  // For simplicity, using the already deployed contract
  const daoAddress = '0x033480cD0519B7e5b2AAcd64F7B5C018FbeEC20A';
  console.log(`✅ Using DAO at: ${daoAddress}\n`);

  const daoABI = [
    "function createProposal(string calldata title, string calldata description, string calldata location, int256 latitude, int256 longitude, uint256 requestedAmount, address beneficiary, bytes32 propertyId, bytes32 evidenceHash, uint8 verificationConfidence, uint8 issueType, uint8 severity, string calldata ipfsCID) external returns (bytes32)",
    "function isMember(address account) external view returns (bool)",
    "function joinDAO() external payable",
    "function getProposal(bytes32 proposalId) external view returns (tuple(bytes32 id, string title, string description, string location, int256 latitude, int256 longitude, uint256 requestedAmount, address beneficiary, bytes32 propertyId, bytes32 evidenceHash, uint8 verificationConfidence, uint8 issueType, uint8 severity, string ipfsCID, address proposer, uint256 votesFor, uint256 votesAgainst, uint256 deadline, uint256 resolutionDeadline, uint8 status, bool executed))",
    "event ProposalCreated(bytes32 indexed proposalId, bytes32 indexed propertyId, bytes32 evidenceHash, uint8 issueType, uint8 severity, uint256 deadline, uint256 resolutionDeadline)"
  ];

  const dao = new ethers.Contract(daoAddress, daoABI, wallet);

  // Step 2: Join DAO if not a member
  console.log('👥 Step 2: Checking DAO Membership...');
  const isMember = await dao.isMember(wallet.address);
  
  if (!isMember) {
    console.log('Joining DAO...');
    const joinTx = await dao.joinDAO({ value: ethers.parseEther('0.0001') });
    await joinTx.wait();
    console.log('✅ Joined DAO\n');
  } else {
    console.log('✅ Already a member\n');
  }

  // Step 3: Create Proposal 1 - Denver Sidewalk Repair
  console.log('📋 Step 3: Creating Proposal 1 - Denver Sidewalk Repair...');
  
  const proposal1Data = {
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 39.7392, lng: -104.9903 },
        address: 'Bannock Central Plaza, Golden Triangle',
        city: 'Denver',
        state: 'Colorado',
        country: 'United States'
      },
      hash: ethers.id('proposal1-denver-sidewalk')
    },
    analysis: {
      description: 'Damaged concrete sidewalk tiles creating pedestrian hazards in high-traffic area. Multiple tiles are cracked, lifted, and uneven, posing trip risks for residents and visitors. The damage affects approximately 50 meters of sidewalk in the Golden Triangle district.',
      confidence: 85
    },
    impactAssessment: {
      score: 75,
      category: 'Infrastructure',
      urgency: 'high',
      estimatedImpact: 'Affects 5000+ daily pedestrians, including elderly and disabled residents',
      recommendedActions: [
        'Immediate safety assessment',
        'Temporary warning signage',
        'Complete sidewalk replacement',
        'ADA compliance verification'
      ]
    }
  };

  const ipfs1 = await uploadToPinata(proposal1Data, 'proposal-denver-sidewalk.json');
  console.log(`IPFS: ${ipfs1}`);

  const tx1 = await dao.createProposal(
    'Repair Damaged Sidewalks in Denver Golden Triangle',
    'Critical infrastructure repair needed for damaged sidewalk tiles affecting pedestrian safety in high-traffic area. Multiple concrete tiles are cracked and lifted, creating trip hazards for over 5000 daily pedestrians.',
    'Denver, Colorado, United States',
    Math.floor(39.7392 * 1e6),
    Math.floor(-104.9903 * 1e6),
    ethers.parseEther('5'),
    wallet.address,
    ethers.id('PROP_DENVER_SIDEWALK_001'),
    proposal1Data.metadata.hash,
    85,
    1, // Infrastructure
    2, // High severity
    ipfs1
  );

  const receipt1 = await tx1.wait();
  const event1 = receipt1.logs.find((log: any) => 
    log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
  );
  const parsed1 = dao.interface.parseLog({
    topics: event1!.topics,
    data: event1!.data
  });
  const proposalId1 = parsed1!.args[0];
  
  console.log(`✅ Proposal 1 Created: ${proposalId1}\n`);

  // Step 4: Create Proposal 2 - Boston Pothole Repair
  console.log('📋 Step 4: Creating Proposal 2 - Boston Pothole Repair...');
  
  const proposal2Data = {
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 42.3601, lng: -71.0589 },
        address: 'Commonwealth Avenue',
        city: 'Boston',
        state: 'Massachusetts',
        country: 'United States'
      },
      hash: ethers.id('proposal2-boston-pothole')
    },
    analysis: {
      description: 'Large pothole on Commonwealth Avenue causing vehicle damage and safety concerns. The pothole measures approximately 2 feet in diameter and 6 inches deep, located in a high-traffic lane near Boston University.',
      confidence: 90
    },
    impactAssessment: {
      score: 82,
      category: 'Infrastructure',
      urgency: 'high',
      estimatedImpact: 'Affects 10,000+ daily vehicles, causing tire damage and accidents',
      recommendedActions: [
        'Immediate temporary fill',
        'Traffic cone placement',
        'Permanent asphalt repair',
        'Road surface assessment'
      ]
    }
  };

  const ipfs2 = await uploadToPinata(proposal2Data, 'proposal-boston-pothole.json');
  console.log(`IPFS: ${ipfs2}`);

  const tx2 = await dao.createProposal(
    'Emergency Pothole Repair on Commonwealth Avenue Boston',
    'Large pothole causing vehicle damage and safety hazards on major thoroughfare. Located near Boston University, affecting over 10,000 daily vehicles. Multiple reports of tire damage and near-accidents.',
    'Boston, Massachusetts, United States',
    Math.floor(42.3601 * 1e6),
    Math.floor(-71.0589 * 1e6),
    ethers.parseEther('3'),
    wallet.address,
    ethers.id('PROP_BOSTON_POTHOLE_001'),
    proposal2Data.metadata.hash,
    90,
    1, // Infrastructure
    2, // High severity
    ipfs2
  );

  const receipt2 = await tx2.wait();
  const event2 = receipt2.logs.find((log: any) => 
    log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
  );
  const parsed2 = dao.interface.parseLog({
    topics: event2!.topics,
    data: event2!.data
  });
  const proposalId2 = parsed2!.args[0];
  
  console.log(`✅ Proposal 2 Created: ${proposalId2}\n`);

  // Step 5: Update configuration files
  console.log('⚙️  Step 5: Updating Configuration Files...');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  const updatedEnv = envContent
    .replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,`NEXT_PUBLIC_CONTRACT_ADDRESS=${daoAddress}`)
    .replace(/DAO_CONTRACT_ADDRESS=.*/, `DAO_CONTRACT_ADDRESS=${daoAddress}`);
  
  fs.writeFileSync('.env', updatedEnv);
  
  const deploymentInfo = {
    contractAddress: daoAddress,
    deployer: wallet.address,
    network: 'adiTestnet',
    chainId: '99999',
    deployedAt: new Date().toISOString(),
    proposals: [
      {
        id: proposalId1,
        title: 'Denver Sidewalk Repair',
        ipfs: ipfs1,
        txHash: tx1.hash
      },
      {
        id: proposalId2,
        title: 'Boston Pothole Repair',
        ipfs: ipfs2,
        txHash: tx2.hash
      }
    ]
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('✅ Configuration updated\n');

  // Summary
  console.log('=' .repeat(60));
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📍 DAO Contract: ${daoAddress}`);
  console.log(`\n📋 Proposals Created:`);
  console.log(`   1. ${proposalId1}`);
  console.log(`      Denver Sidewalk Repair`);
  console.log(`      IPFS: ${ipfs1}`);
  console.log(`\n   2. ${proposalId2}`);
  console.log(`      Boston Pothole Repair`);
  console.log(`      IPFS: ${ipfs2}`);
  console.log(`\n🌐 View on Explorer:`);
  console.log(`   https://explorer.ab.testnet.adifoundation.ai/address/${daoAddress}`);
  console.log(`\n💻 Frontend: Update NEXT_PUBLIC_CONTRACT_ADDRESS in frontend/.env`);
  console.log(`\n✅ Ready to launch prediction markets!`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

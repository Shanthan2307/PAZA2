import { ethers } from 'ethers';
import * as fs from 'fs';
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
  console.log('🚀 Creating Proposals on SimpleDAO...\n');

  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ADI\n`);

  // Use SimpleDAO ABI
  const daoAddress = '0x023d2018C73Fd4BE023cC998e59363A68cDF36eC';
  const daoABI = [
    "function createProposal(string calldata description) external returns (bytes32)",
    "function isMember(address account) external view returns (bool)",
    "function joinDAO() external payable",
    "function getProposal(bytes32 proposalId) external view returns (tuple(bytes32 id, string description, address proposer, uint256 forVotes, uint256 againstVotes, uint256 deadline, bool executed, uint8 status))",
    "event ProposalCreated(bytes32 indexed proposalId, string description, uint256 deadline)"
  ];

  const dao = new ethers.Contract(daoAddress, daoABI, wallet);

  // Check membership
  console.log('👥 Checking DAO Membership...');
  const isMember = await dao.isMember(wallet.address);
  
  if (!isMember) {
    console.log('Joining DAO...');
    const joinTx = await dao.joinDAO({ value: ethers.parseEther('0.0001') });
    await joinTx.wait();
    console.log('✅ Joined DAO\n');
  } else {
    console.log('✅ Already a member\n');
  }

  // Create Proposal 1
  console.log('📋 Creating Proposal 1 - Denver Sidewalk Repair...');
  
  const proposal1Data = {
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 39.7392, lng: -104.9903 },
        address: 'Bannock Central Plaza, Golden Triangle',
        city: 'Denver',
        state: 'Colorado',
        country: 'United States'
      }
    },
    analysis: {
      description: 'Damaged concrete sidewalk tiles creating pedestrian hazards in high-traffic area.',
      confidence: 85
    },
    impactAssessment: {
      score: 75,
      category: 'Infrastructure',
      urgency: 'high',
      estimatedImpact: 'Affects 5000+ daily pedestrians'
    }
  };

  const ipfs1 = await uploadToPinata(proposal1Data, 'proposal-denver-sidewalk.json');
  
  const description1 = `
Repair Damaged Sidewalks in Denver Golden Triangle

Location: Denver, Colorado, United States
Coordinates: 39.7392, -104.9903
Impact Score: 75
Urgency: High
Category: Infrastructure

Description:
Damaged concrete sidewalk tiles creating pedestrian hazards in high-traffic area. Multiple tiles are cracked, lifted, and uneven, posing trip risks for residents and visitors.

Estimated Impact:
Affects 5000+ daily pedestrians, including elderly and disabled residents

Recommended Actions:
- Immediate safety assessment
- Temporary warning signage
- Complete sidewalk replacement
- ADA compliance verification

Evidence:
IPFS: https://gateway.pinata.cloud/ipfs/${ipfs1}
Confidence: 85%

Requested Amount: 5 ADI
  `.trim();

  const tx1 = await dao.createProposal(description1);
  const receipt1 = await tx1.wait();
  
  const event1 = receipt1.logs.find((log: any) => 
    log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
  );
  const parsed1 = dao.interface.parseLog({
    topics: event1!.topics,
    data: event1!.data
  });
  const proposalId1 = parsed1!.args[0];
  
  console.log(`✅ Proposal 1 Created: ${proposalId1}`);
  console.log(`   TX: ${tx1.hash}`);
  console.log(`   IPFS: ${ipfs1}\n`);

  // Create Proposal 2
  console.log('📋 Creating Proposal 2 - Boston Pothole Repair...');
  
  const proposal2Data = {
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 42.3601, lng: -71.0589 },
        address: 'Commonwealth Avenue',
        city: 'Boston',
        state: 'Massachusetts',
        country: 'United States'
      }
    },
    analysis: {
      description: 'Large pothole on Commonwealth Avenue causing vehicle damage and safety concerns.',
      confidence: 90
    },
    impactAssessment: {
      score: 82,
      category: 'Infrastructure',
      urgency: 'high',
      estimatedImpact: 'Affects 10,000+ daily vehicles'
    }
  };

  const ipfs2 = await uploadToPinata(proposal2Data, 'proposal-boston-pothole.json');
  
  const description2 = `
Emergency Pothole Repair on Commonwealth Avenue Boston

Location: Boston, Massachusetts, United States
Coordinates: 42.3601, -71.0589
Impact Score: 82
Urgency: High
Category: Infrastructure

Description:
Large pothole on Commonwealth Avenue causing vehicle damage and safety hazards. The pothole measures approximately 2 feet in diameter and 6 inches deep, located in a high-traffic lane near Boston University.

Estimated Impact:
Affects 10,000+ daily vehicles, causing tire damage and accidents

Recommended Actions:
- Immediate temporary fill
- Traffic cone placement
- Permanent asphalt repair
- Road surface assessment

Evidence:
IPFS: https://gateway.pinata.cloud/ipfs/${ipfs2}
Confidence: 90%

Requested Amount: 3 ADI
  `.trim();

  const tx2 = await dao.createProposal(description2);
  const receipt2 = await tx2.wait();
  
  const event2 = receipt2.logs.find((log: any) => 
    log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
  );
  const parsed2 = dao.interface.parseLog({
    topics: event2!.topics,
    data: event2!.data
  });
  const proposalId2 = parsed2!.args[0];
  
  console.log(`✅ Proposal 2 Created: ${proposalId2}`);
  console.log(`   TX: ${tx2.hash}`);
  console.log(`   IPFS: ${ipfs2}\n`);

  // Update deployment info
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

  console.log('='.repeat(60));
  console.log('🎉 PROPOSALS CREATED!');
  console.log('='.repeat(60));
  console.log(`\n📍 DAO Contract: ${daoAddress}`);
  console.log(`\n📋 Proposals:`);
  console.log(`   1. ${proposalId1}`);
  console.log(`      Denver Sidewalk Repair`);
  console.log(`\n   2. ${proposalId2}`);
  console.log(`      Boston Pothole Repair`);
  console.log(`\n🌐 View on Explorer:`);
  console.log(`   https://explorer.ab.testnet.adifoundation.ai/address/${daoAddress}`);
  console.log(`\n💻 Frontend URL: http://localhost:3000`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

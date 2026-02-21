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
  console.log('🚀 Creating Unique Proposals...\n');

  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  console.log(`Deployer: ${wallet.address}`);

  const daoAddress = '0x023d2018C73Fd4BE023cC998e59363A68cDF36eC';
  const daoABI = [
    "function createProposal(string calldata description) external returns (bytes32)",
    "function isMember(address account) external view returns (bool)",
    "function joinDAO() external payable",
    "event ProposalCreated(bytes32 indexed proposalId, string description, uint256 deadline)"
  ];

  const dao = new ethers.Contract(daoAddress, daoABI, wallet);

  // Check membership
  const isMember = await dao.isMember(wallet.address);
  if (!isMember) {
    console.log('Joining DAO...');
    const joinTx = await dao.joinDAO({ value: ethers.parseEther('0.0001') });
    await joinTx.wait();
    console.log('✅ Joined DAO\n');
  }

  const timestamp = Date.now();

  // Proposal 1
  console.log('📋 Creating Proposal 1...');
  
  const proposal1Data = {
    id: `PROP_${timestamp}_001`,
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 39.7392, lng: -104.9903 },
        city: 'Denver',
        state: 'Colorado'
      }
    },
    analysis: {
      description: 'Damaged sidewalk infrastructure requiring immediate repair',
      confidence: 85
    }
  };

  const ipfs1 = await uploadToPinata(proposal1Data, `proposal-${timestamp}-001.json`);
  
  const desc1 = `Infrastructure Repair Initiative - Denver Sidewalk Damage

Submission ID: ${proposal1Data.id}
Location: Denver, Colorado
Coordinates: 39.7392, -104.9903
Urgency: High
Category: Infrastructure

Critical sidewalk damage affecting pedestrian safety in high-traffic area. Multiple concrete tiles are cracked and lifted, creating trip hazards for over 5000 daily pedestrians including elderly and disabled residents.

Requested Funding: 5 ADI
Evidence: https://gateway.pinata.cloud/ipfs/${ipfs1}
Confidence: 85%

Submitted: ${new Date().toISOString()}`;

  try {
    const tx1 = await dao.createProposal(desc1);
    const receipt1 = await tx1.wait();
    
    const event1 = receipt1.logs.find((log: any) => 
      log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
    );
    const parsed1 = dao.interface.parseLog({
      topics: event1!.topics,
      data: event1!.data
    });
    
    console.log(`✅ Proposal 1 Created: ${parsed1!.args[0]}`);
    console.log(`   TX: ${tx1.hash}\n`);
  } catch (error: any) {
    console.log(`❌ Proposal 1 failed: ${error.message}\n`);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Proposal 2
  console.log('📋 Creating Proposal 2...');
  
  const proposal2Data = {
    id: `PROP_${timestamp}_002`,
    metadata: {
      timestamp: new Date().toISOString(),
      location: {
        coordinates: { lat: 42.3601, lng: -71.0589 },
        city: 'Boston',
        state: 'Massachusetts'
      }
    },
    analysis: {
      description: 'Large pothole causing vehicle damage on major thoroughfare',
      confidence: 90
    }
  };

  const ipfs2 = await uploadToPinata(proposal2Data, `proposal-${timestamp}-002.json`);
  
  const desc2 = `Emergency Road Repair - Boston Commonwealth Avenue Pothole

Submission ID: ${proposal2Data.id}
Location: Boston, Massachusetts
Coordinates: 42.3601, -71.0589
Urgency: High
Category: Infrastructure

Large pothole (2ft diameter, 6in deep) on Commonwealth Avenue near Boston University causing vehicle damage and safety hazards. Affects 10,000+ daily vehicles with multiple reports of tire damage.

Requested Funding: 3 ADI
Evidence: https://gateway.pinata.cloud/ipfs/${ipfs2}
Confidence: 90%

Submitted: ${new Date().toISOString()}`;

  try {
    const tx2 = await dao.createProposal(desc2);
    const receipt2 = await tx2.wait();
    
    const event2 = receipt2.logs.find((log: any) => 
      log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
    );
    const parsed2 = dao.interface.parseLog({
      topics: event2!.topics,
      data: event2!.data
    });
    
    console.log(`✅ Proposal 2 Created: ${parsed2!.args[0]}`);
    console.log(`   TX: ${tx2.hash}\n`);
  } catch (error: any) {
    console.log(`❌ Proposal 2 failed: ${error.message}\n`);
  }

  console.log('='.repeat(60));
  console.log('✅ Proposals submitted!');
  console.log(`📍 DAO: ${daoAddress}`);
  console.log(`🌐 View: https://explorer.ab.testnet.adifoundation.ai/address/${daoAddress}`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

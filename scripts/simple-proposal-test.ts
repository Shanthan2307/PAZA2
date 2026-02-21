import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const daoAddress = '0x023d2018C73Fd4BE023cC998e59363A68cDF36eC';
  const daoABI = [
    "function createProposal(string calldata description) external returns (bytes32)",
    "event ProposalCreated(bytes32 indexed proposalId, string description, uint256 deadline)"
  ];

  const dao = new ethers.Contract(daoAddress, daoABI, wallet);

  const timestamp = Date.now();
  const desc = `Test Proposal ${timestamp} - Denver Sidewalk Repair Initiative`;

  console.log('Creating proposal...');
  console.log(`Description: ${desc}`);
  
  try {
    const tx = await dao.createProposal(desc, {
      gasLimit: 500000
    });
    console.log(`TX sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
    
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === dao.interface.getEvent('ProposalCreated')!.topicHash
    );
    
    if (event) {
      const parsed = dao.interface.parseLog({
        topics: event.topics,
        data: event.data
      });
      console.log(`Proposal ID: ${parsed!.args[0]}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('Data:', error.data);
    }
  }
}

main().catch(console.error);

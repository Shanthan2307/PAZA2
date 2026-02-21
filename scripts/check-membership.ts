import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const CONTRACT_ABI = [
  "function isMember(address account) external view returns (bool)",
  "function getMemberStake(address member) external view returns (uint256)",
  "function MINIMUM_STAKE() external view returns (uint256)"
];

async function checkMembership() {
  console.log('🔍 Checking DAO Membership Status...\n');

  // Get wallet address from private key
  const wallet = new ethers.Wallet(process.env.CREATE_PROPOSAL_PRIVATE_KEY!);
  const address = wallet.address;

  console.log(`Wallet Address: ${address}`);
  console.log(`Contract: ${process.env.DAO_CONTRACT_ADDRESS}\n`);

  // Connect to the network
  const provider = new ethers.JsonRpcProvider(process.env.DAO_CHAIN_RPC_URL);
  const contract = new ethers.Contract(
    process.env.DAO_CONTRACT_ADDRESS!,
    CONTRACT_ABI,
    provider
  );

  try {
    // Check if member
    const isMember = await contract.isMember(address);
    console.log(`Is Member: ${isMember ? '✅ YES' : '❌ NO'}`);

    if (isMember) {
      // Get stake amount
      const stake = await contract.getMemberStake(address);
      console.log(`Member Stake: ${ethers.formatEther(stake)} ADI`);
      
      if (stake === 0n) {
        console.log('💡 Note: You are a pre-configured member (no stake required)');
      }
    } else {
      const minStake = await contract.MINIMUM_STAKE();
      console.log(`\nTo join, you need to stake: ${ethers.formatEther(minStake)} ADI`);
    }

    console.log('\n' + '='.repeat(50));
    if (isMember) {
      console.log('✅ You can create and vote on proposals!');
    } else {
      console.log('❌ You need to join the DAO first');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error checking membership:', error);
  }
}

checkMembership();

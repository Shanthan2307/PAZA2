import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  const addresses = [
    '0x023d2018C73Fd4BE023cC998e59363A68cDF36eC',
    '0x033480cD0519B7e5b2AAcd64F7B5C018FbeEC20A'
  ];

  for (const addr of addresses) {
    console.log(`\nTesting ${addr}...`);
    
    const code = await provider.getCode(addr);
    console.log(`Has code: ${code !== '0x'}`);
    
    if (code !== '0x') {
      // Try SimpleDAO ABI
      const simpleABI = ["function isMember(address) view returns (bool)"];
      const contract = new ethers.Contract(addr, simpleABI, provider);
      
      try {
        const isMember = await contract.isMember(wallet.address);
        console.log(`Is member (SimpleDAO): ${isMember}`);
      } catch (e) {
        console.log('Not SimpleDAO');
      }
    }
  }
}

main().catch(console.error);

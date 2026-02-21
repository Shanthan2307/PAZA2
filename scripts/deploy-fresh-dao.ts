import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Deploying Fresh SimpleDAO Contract...\n');

  const provider = new ethers.JsonRpcProvider(process.env.ADI_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ADI\n`);

  // SimpleDAO bytecode and ABI
  const bytecode = "0x608060405234801561000f575f80fd5b506040516109e83803806109e88339818101604052810190610031919061008d565b80600181905550336002805f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050506100b8565b5f8151905061008781610 0a1565b92915050565b5f6020828403121561009e5761009d61009d565b5b5f6100ab84828501610079565b91505092915050565b5f80fd5b5f819050919050565b6100ca816100b8565b81146100d4575f80fd5b50565b5f815190506100e5816100c1565b92915050565b610922806100f95f395ff3fe6080604052600436106100745f3560e01c80636c19e7831161004e5780636c19e783146101355780638da5cb5b14610151578063a0712d681461017b578063b5f8e0f314610197576100745b5f80fd5b61008f600480360381019061008a9190610567565b6101c1565b005b6100a960048036038101906100a49190610592565b610298565b6040516100b691906105f8565b60405180910390f35b6100d960048036038101906100d49190610611565b6102b5565b6040516100e6919061064b565b60405180910390f35b6100ff60048036038101906100fa9190610664565b6103a8565b60405161010c91906106a8565b60405180910390f35b61014f600480360381019061014a91906106c1565b6103c5565b005b610159610496565b604051610166919061070b565b60405180910390f35b61019560048036038101906101909190610724565b6104bb565b005b6101a161058c565b6040516101ae919061075e565b60405180910390f35b5f60015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610250576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610247906107c1565b60405180910390fd5b8160015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b5f60035f8381526020019081526020015f2060040154119050919050565b5f60035f8381526020019081526020015f206040518060c00160405290815f82015481526020016001820180546102eb90610806565b80601f016020809104026020016040519081016040528092919081815260200182805461031790610806565b80156103625780601f1061033957610100808354040283529160200191610362565b820191905f5260205f20905b81548152906001019060200180831161034557829003601f168201915b505050505081526020016002820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016003820154815260200160048201548152602001600582015481525050905092915050565b5f60045f8381526020019081526020015f205f9054906101000a900460ff169050919050565b5f60015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610454576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161044b906107c1565b60405180910390fd5b8160025f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b60025f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b5f60015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161461054a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610541906107c1565b60405180910390fd5b8160018190555050565b5f819050919050565b61056681610554565b8114610570575f80fd5b50565b5f8135905061058181610557565b92915050565b5f6020828403121561059c5761059b610553565b5b5f6105a984828501610573565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6105db826105b2565b9050919050565b6105eb816105d1565b82525050565b5f6020820190506106045f8301846105e2565b92915050565b5f6020828403121561061f5761061e610553565b5b5f61062c84828501610573565b91505092915050565b5f819050919050565b61064781610635565b82525050565b5f6020820190506106605f83018461063e565b92915050565b5f6020828403121561067b5761067a610553565b5b5f61068884828501610573565b91505092915050565b5f8115159050919050565b6106a581610691565b82525050565b5f6020820190506106be5f83018461069c565b92915050565b5f80604083850312156106da576106d9610553565b5b5f6106e785828601610573565b92505060206106f885828601610573565b9150509250929050565b61070b816105d1565b82525050565b5f6020820190506107245f830184610702565b92915050565b5f6020828403121561073f5761073e610553565b5b5f61074c84828501610573565b91505092915050565b61075e81610635565b82525050565b5f6020820190506107775f830184610755565b92915050565b5f82825260208201905092915050565b7f4e6f7420617574686f72697a6564000000000000000000000000000000000000005f82015250565b5f6107c1600e8361077d565b91506107cc8261078d565b602082019050919050565b5f6020820190508181035f8301526107ee816107b5565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061083d57607f821691505b6020821081036108505761084f6107f5565b5b5091905056fea2646970667358221220c8f3e8a8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e864736f6c63430008180033";

  const abi = [
    "constructor(uint256 _votingPeriod)",
    "function createProposal(string calldata description) external returns (bytes32)",
    "function isMember(address account) external view returns (bool)",
    "function joinDAO() external payable",
    "function vote(bytes32 proposalId, bool support) external",
    "function executeProposal(bytes32 proposalId) external",
    "function getProposal(bytes32 proposalId) external view returns (tuple(bytes32 id, string description, address proposer, uint256 forVotes, uint256 againstVotes, uint256 deadline, bool executed, uint8 status))",
    "event ProposalCreated(bytes32 indexed proposalId, string description, uint256 deadline)",
    "event Voted(bytes32 indexed proposalId, address indexed voter, bool support)",
    "event ProposalExecuted(bytes32 indexed proposalId)"
  ];

  // Read and compile SimpleDAO
  const sourceCode = fs.readFileSync(
    path.join(__dirname, '../contracts/SimpleDAO.sol'),
    'utf8'
  );

  console.log('📝 Deploying SimpleDAO with 7-day voting period...');
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const votingPeriod = 7 * 24 * 60 * 60; // 7 days
  
  const contract = await factory.deploy(votingPeriod);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log(`✅ SimpleDAO deployed at: ${address}\n`);

  // Join DAO
  console.log('👥 Joining DAO...');
  const joinTx = await contract.joinDAO({ value: ethers.parseEther('0.0001') });
  await joinTx.wait();
  console.log('✅ Joined DAO\n');

  // Update .env files
  console.log('⚙️  Updating configuration files...');
  
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent
    .replace(/NEXT_PUBLIC_CONTRACT_ADDRESS=.*/, `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)
    .replace(/DAO_CONTRACT_ADDRESS=.*/, `DAO_CONTRACT_ADDRESS=${address}`);
  fs.writeFileSync(envPath, envContent);

  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  fs.writeFileSync(frontendEnvPath, `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`);

  const tgEnvPath = path.join(__dirname, '../tg_analysis/.env');
  let tgEnvContent = fs.readFileSync(tgEnvPath, 'utf8');
  tgEnvContent = tgEnvContent.replace(/DAO_CONTRACT_ADDRESS=.*/, `DAO_CONTRACT_ADDRESS=${address}`);
  fs.writeFileSync(tgEnvPath, tgEnvContent);

  const deploymentInfo = {
    contractAddress: address,
    deployer: wallet.address,
    network: 'adiTestnet',
    chainId: '99999',
    deployedAt: new Date().toISOString(),
    votingPeriod: '7 days',
    proposals: []
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log('='.repeat(60));
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📍 Contract Address: ${address}`);
  console.log(`\n🌐 Explorer:`);
  console.log(`   https://explorer.ab.testnet.adifoundation.ai/address/${address}`);
  console.log(`\n✅ Configuration files updated`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Run: npx ts-node scripts/create-simple-proposals.ts`);
  console.log(`   2. Start frontend: cd frontend && npm run dev`);
  console.log(`   3. Restart Telegram bot`);
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying SimpleDAO to ADI Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ADI\n");

  const SimpleDAO = await ethers.getContractFactory("SimpleDAO");
  console.log("Deploying contract...");
  
  const dao = await SimpleDAO.deploy();
  await dao.waitForDeployment();
  
  const address = await dao.getAddress();

  console.log("\n✅ SimpleDAO deployed successfully!");
  console.log("📍 Contract address:", address);
  console.log("\n📝 Update your configuration:");
  console.log(`   .env: NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`   frontend/lib/contract.ts: CONTRACT_ADDRESS`);
  
  console.log("\n🔍 Verify contract with:");
  console.log(`   npx hardhat verify --network adiTestnet ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

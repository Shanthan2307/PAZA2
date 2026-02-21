import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PredictionMarketDAO...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const PredictionMarketDAO = await ethers.getContractFactory("PredictionMarketDAO");
  const dao = await PredictionMarketDAO.deploy();

  await dao.waitForDeployment();

  const address = await dao.getAddress();
  console.log("PredictionMarketDAO deployed to:", address);

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("📝 Deployment info saved to deployment-info.json");
  console.log("\nNext steps:");
  console.log("1. Update frontend/lib/contract.ts with the new contract address");
  console.log("2. Update .env with NEXT_PUBLIC_CONTRACT_ADDRESS");
  console.log("3. Run: npm run compile (to generate new TypeChain types)");
  console.log("4. Update the agent configuration to use the new contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

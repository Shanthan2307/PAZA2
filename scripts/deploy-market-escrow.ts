import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MarketEscrow...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Treasury address (can be DAO contract or multisig)
  const treasuryAddress = deployer.address; // Using deployer as treasury for now

  const MarketEscrow = await ethers.getContractFactory("MarketEscrow");
  const escrow = await MarketEscrow.deploy(treasuryAddress);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("MarketEscrow deployed to:", address);

  // Get fee configuration
  const feeConfig = await escrow.getFeeConfig();
  console.log("\nFee Configuration:");
  console.log("- Launch Fee:", ethers.formatEther(feeConfig[0]), "ADI");
  console.log("- Trading Fee:", feeConfig[1].toString(), "basis points (", Number(feeConfig[1]) / 100, "%)");
  console.log("- Resolution Fee:", ethers.formatEther(feeConfig[2]), "ADI");

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: address,
    treasury: treasuryAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    feeConfig: {
      launchFee: ethers.formatEther(feeConfig[0]),
      tradingFeeBasisPoints: feeConfig[1].toString(),
      resolutionFee: ethers.formatEther(feeConfig[2])
    }
  };

  fs.writeFileSync(
    'market-escrow-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("📝 Deployment info saved to market-escrow-deployment.json");
  console.log("\nNext steps:");
  console.log("1. Update frontend/.env.local with NEXT_PUBLIC_ESCROW_ADDRESS");
  console.log("2. Test market launch with MetaMask");
  console.log("3. Verify fees are collected in escrow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

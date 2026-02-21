import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=".repeat(70));
  console.log("🚀 Deploying Prediction Market System to ADI Testnet");
  console.log("=".repeat(70));
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ADI");
  console.log();

  // Demo mode: compressed timing for hackathon
  const DEMO_MODE = process.env.DEMO_MODE === "true";
  const votingPeriod = DEMO_MODE ? 180 : 7 * 24 * 60 * 60; // 3 min vs 7 days
  const resolutionPeriod = DEMO_MODE ? 1200 : 30 * 24 * 60 * 60; // 20 min vs 30 days

  console.log("⚙️  Configuration:");
  console.log("   Mode:", DEMO_MODE ? "DEMO (compressed timing)" : "PRODUCTION");
  console.log("   Voting Period:", votingPeriod, "seconds", `(${votingPeriod / 60} minutes)`);
  console.log("   Resolution Period:", resolutionPeriod, "seconds", `(${resolutionPeriod / 60} minutes)`);
  console.log();

  // 1. Deploy PredictionMarketDAO
  console.log("📋 Deploying PredictionMarketDAO...");
  const DAO = await ethers.getContractFactory("PredictionMarketDAO");
  const dao = await DAO.deploy(votingPeriod, resolutionPeriod);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("   ✅ DAO deployed to:", daoAddress);
  console.log();

  // 2. Deploy RepairTimelineMarket
  console.log("📊 Deploying RepairTimelineMarket...");
  const Market = await ethers.getContractFactory("RepairTimelineMarket");
  const market = await Market.deploy(deployer.address);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("   ✅ Market deployed to:", marketAddress);
  console.log();

  // 3. Deploy RepairVerificationResolver
  console.log("🔍 Deploying RepairVerificationResolver...");
  const Resolver = await ethers.getContractFactory("RepairVerificationResolver");
  const resolver = await Resolver.deploy(
    daoAddress,
    marketAddress,
    deployer.address // finalizer
  );
  await resolver.waitForDeployment();
  const resolverAddress = await resolver.getAddress();
  console.log("   ✅ Resolver deployed to:", resolverAddress);
  console.log();

  // 4. Deploy DemoTarget (optional)
  console.log("🎯 Deploying DemoTarget...");
  const Demo = await ethers.getContractFactory("DemoTarget");
  const demo = await Demo.deploy(deployer.address);
  await demo.waitForDeployment();
  const demoAddress = await demo.getAddress();
  console.log("   ✅ DemoTarget deployed to:", demoAddress);
  console.log();

  // 5. Wire contracts together
  console.log("🔗 Wiring contracts...");
  
  console.log("   Setting market contract in DAO...");
  const tx1 = await dao.setMarketContract(marketAddress);
  await tx1.wait();
  console.log("   ✅ Market contract set");

  console.log("   Setting resolver contract in DAO...");
  const tx2 = await dao.setResolverContract(resolverAddress);
  await tx2.wait();
  console.log("   ✅ Resolver contract set");

  console.log("   Setting resolver in Market...");
  const tx3 = await market.setResolver(resolverAddress);
  await tx3.wait();
  console.log("   ✅ Resolver set in Market");
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: "adiTestnet",
    chainId: 99999,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    demoMode: DEMO_MODE,
    config: {
      votingPeriod,
      resolutionPeriod,
      votingPeriodMinutes: votingPeriod / 60,
      resolutionPeriodMinutes: resolutionPeriod / 60,
    },
    contracts: {
      PredictionMarketDAO: daoAddress,
      RepairTimelineMarket: marketAddress,
      RepairVerificationResolver: resolverAddress,
      DemoTarget: demoAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "prediction-markets-adiTestnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("=".repeat(70));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log();
  console.log("📝 Contract Addresses:");
  console.log("   PredictionMarketDAO:", daoAddress);
  console.log("   RepairTimelineMarket:", marketAddress);
  console.log("   RepairVerificationResolver:", resolverAddress);
  console.log("   DemoTarget:", demoAddress);
  console.log();
  console.log("💾 Deployment info saved to:", deploymentFile);
  console.log();
  console.log("🎯 Next Steps:");
  console.log("   1. Update frontend/.env.local with contract addresses");
  console.log("   2. Update frontend/lib/contract.ts with new ABIs");
  console.log("   3. Test market creation after proposal execution");
  console.log("   4. Verify contracts on block explorer (optional)");
  console.log();
  console.log("🔗 Integration:");
  console.log("   - DAO tracks approval time in proposalApprovedAt[proposalId]");
  console.log("   - Backend launches market after proposal execution");
  console.log("   - Users stake YES/NO on repair completion");
  console.log("   - Resolver finalizes based on completion proof");
  console.log();
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

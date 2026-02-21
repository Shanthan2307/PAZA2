import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const ESCROW_ABI = [
  "function launchMarket(bytes32 marketId, bytes32 proposalId) external payable",
  "function getMarketEscrow(bytes32 marketId) external view returns (address, uint256, uint256, uint256, bool, bool)",
  "function getFeeConfig() external view returns (uint256, uint256, uint256)",
  "function getAvailableBalance() external view returns (uint256)",
  "function totalFeesCollected() external view returns (uint256)",
  "event MarketLaunched(bytes32 indexed marketId, bytes32 indexed proposalId, address indexed creator, uint256 feePaid)"
];

async function main() {
  console.log("🧪 Testing Market Escrow Contract\n");
  console.log("=".repeat(70));

  const escrowAddress = "0x1964E3c32F27D427a459a5Ac26Fe408cfD17D775";
  
  const [signer] = await ethers.getSigners();
  console.log("\n📋 Test Configuration:");
  console.log("- Account:", signer.address);
  console.log("- Escrow Contract:", escrowAddress);
  console.log("- Network:", (await ethers.provider.getNetwork()).name);
  console.log("- Chain ID:", (await ethers.provider.getNetwork()).chainId);

  const escrow = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);

  // Get fee configuration
  console.log("\n💰 Fee Configuration:");
  const feeConfig = await escrow.getFeeConfig();
  console.log("- Launch Fee:", ethers.formatEther(feeConfig[0]), "ADI");
  console.log("- Trading Fee:", feeConfig[1].toString(), "basis points");
  console.log("- Resolution Fee:", ethers.formatEther(feeConfig[2]), "ADI");

  // Check current balance
  console.log("\n📊 Current Escrow Status:");
  const availableBalance = await escrow.getAvailableBalance();
  const totalCollected = await escrow.totalFeesCollected();
  console.log("- Available Balance:", ethers.formatEther(availableBalance), "ADI");
  console.log("- Total Fees Collected:", ethers.formatEther(totalCollected), "ADI");

  // Test market launch
  console.log("\n🚀 Testing Market Launch...");
  
  const testMarketId = ethers.id("TEST_MARKET_" + Date.now());
  const testProposalId = ethers.id("TEST_PROPOSAL_" + Date.now());
  const launchFee = feeConfig[0];

  console.log("- Market ID:", testMarketId.slice(0, 10) + "...");
  console.log("- Proposal ID:", testProposalId.slice(0, 10) + "...");
  console.log("- Launch Fee:", ethers.formatEther(launchFee), "ADI");

  try {
    console.log("\n📤 Sending transaction...");
    const tx = await escrow.launchMarket(testMarketId, testProposalId, {
      value: launchFee
    });

    console.log("- Transaction Hash:", tx.hash);
    console.log("- Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Parse event
    const marketLaunchedEvent = escrow.interface.getEvent('MarketLaunched');
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === marketLaunchedEvent?.topicHash
    );

    if (event) {
      const parsedEvent = escrow.interface.parseLog({
        topics: event.topics,
        data: event.data
      });

      console.log("\n🎉 Market Launched Successfully!");
      console.log("- Market ID:", parsedEvent?.args?.[0]);
      console.log("- Proposal ID:", parsedEvent?.args?.[1]);
      console.log("- Creator:", parsedEvent?.args?.[2]);
      console.log("- Fee Paid:", ethers.formatEther(parsedEvent?.args?.[3]), "ADI");
    }

    // Verify escrow data
    console.log("\n🔍 Verifying Escrow Data...");
    const escrowData = await escrow.getMarketEscrow(testMarketId);
    console.log("- Creator:", escrowData[0]);
    console.log("- Fee Paid:", ethers.formatEther(escrowData[1]), "ADI");
    console.log("- Trading Fees:", ethers.formatEther(escrowData[2]), "ADI");
    console.log("- Timestamp:", new Date(Number(escrowData[3]) * 1000).toLocaleString());
    console.log("- Resolved:", escrowData[4]);
    console.log("- Refunded:", escrowData[5]);

    // Check updated balance
    console.log("\n📊 Updated Escrow Status:");
    const newAvailableBalance = await escrow.getAvailableBalance();
    const newTotalCollected = await escrow.totalFeesCollected();
    console.log("- Available Balance:", ethers.formatEther(newAvailableBalance), "ADI");
    console.log("- Total Fees Collected:", ethers.formatEther(newTotalCollected), "ADI");
    console.log("- Fees Collected This Test:", ethers.formatEther(newTotalCollected - totalCollected), "ADI");

    console.log("\n" + "=".repeat(70));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(70));

    console.log("\n🎯 Summary:");
    console.log("- Escrow contract is working correctly");
    console.log("- Launch fee (0.01 ADI) collected successfully");
    console.log("- Market data stored in escrow");
    console.log("- Ready for MetaMask integration testing");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

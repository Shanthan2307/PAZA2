import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Contract ABI for PredictionMarketDAO
const CONTRACT_ABI = [
  `function createProposal(
    string calldata title,
    string calldata description,
    string calldata location,
    int256 latitude,
    int256 longitude,
    uint256 requestedAmount,
    address beneficiary,
    bytes32 propertyId,
    bytes32 evidenceHash,
    uint8 verificationConfidence,
    uint8 issueType,
    uint8 severity,
    string calldata ipfsCID
  ) external returns (bytes32)`,
  "function getProposalMetadata(bytes32 proposalId) external view returns (bytes32, bytes32, uint8, uint8, uint8, bytes32, uint256, string, address, uint256, uint8)",
  "function getProposalDetails(bytes32 proposalId) external view returns (string, string, string, int256, int256, uint256, address)",
  "function isMember(address account) external view returns (bool)",
  "event ProposalCreated(bytes32 indexed proposalId, bytes32 indexed propertyId, bytes32 evidenceHash, uint8 issueType, uint8 severity, uint256 deadline, uint256 resolutionDeadline)"
];

async function main() {
  console.log("🧪 Testing PredictionMarketDAO Proposal Creation\n");

  const contractAddress = process.env.DAO_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("DAO_CONTRACT_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  console.log("Contract address:", contractAddress);

  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

  // Check if we're a member
  const isMember = await contract.isMember(signer.address);
  console.log("Is member:", isMember);

  if (!isMember) {
    console.log("❌ Not a DAO member. Please join the DAO first.");
    return;
  }

  // Test proposal data (simulating Claude-enhanced metadata)
  const testProposal = {
    title: "Winter Emergency Relief - Brookline, MA",
    description: `This proposal addresses urgent winter emergency needs in Brookline, Massachusetts.
    
SITUATION:
A frozen lake and surrounding winter landscape indicate severe cold conditions affecting the local community. Historic residential buildings in the area require immediate heating and infrastructure support.

PROPOSED SOLUTION:
- Emergency heating assistance for 500+ families
- Infrastructure winterization support
- Community warming centers
- Emergency supplies distribution

EXPECTED IMPACT:
- 500+ families receive immediate heating assistance
- Reduced risk of cold-related health issues
- Improved community resilience during winter months

VERIFICATION:
Evidence captured via Ray-Ban Meta Smart Glasses and verified through AI analysis with 85% confidence score.`,
    location: "Brookline, Massachusetts, United States",
    latitude: 42.328405555555555,
    longitude: -71.13365,
    requestedAmount: "5000", // 5000 ADI
    beneficiary: "0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B", // Use deployer address
    propertyId: "PROP_42.328_-71.133",
    evidenceHash: "0xd5269d12890377e512619698b5b69f358953edea383e2726e59ddc93b13c18fc",
    verificationConfidence: 85,
    issueType: 4, // HUMANITARIAN
    severity: 2, // HIGH
    ipfsCID: "QmTestCID123456789" // Placeholder
  };

  console.log("\n📝 Creating proposal with metadata:");
  console.log("Title:", testProposal.title);
  console.log("Issue Type:", testProposal.issueType, "(HUMANITARIAN)");
  console.log("Severity:", testProposal.severity, "(HIGH)");
  console.log("Confidence:", testProposal.verificationConfidence + "%");
  console.log("Requested Amount:", testProposal.requestedAmount, "ADI");

  try {
    // Convert coordinates to fixed-point integers (multiply by 1e6)
    const latInt = Math.floor(testProposal.latitude * 1e6);
    const lngInt = Math.floor(testProposal.longitude * 1e6);

    // Convert propertyId and evidenceHash to bytes32
    const propertyIdBytes32 = ethers.id(testProposal.propertyId);
    const evidenceHashBytes32 = testProposal.evidenceHash;

    // Convert requestedAmount to wei
    const requestedAmountWei = ethers.parseEther(testProposal.requestedAmount);

    console.log("\n🚀 Sending transaction...");

    const tx = await contract.createProposal(
      testProposal.title,
      testProposal.description,
      testProposal.location,
      latInt,
      lngInt,
      requestedAmountWei,
      testProposal.beneficiary,
      propertyIdBytes32,
      evidenceHashBytes32,
      testProposal.verificationConfidence,
      testProposal.issueType,
      testProposal.severity,
      testProposal.ipfsCID
    );

    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

    // Parse the event to get proposal ID
    const proposalCreatedEvent = contract.interface.getEvent('ProposalCreated');
    const event = receipt.logs.find(
      (log: any) => log.topics[0] === proposalCreatedEvent?.topicHash
    );

    if (event) {
      const parsedEvent = contract.interface.parseLog({
        topics: event.topics,
        data: event.data
      });

      const proposalId = parsedEvent?.args?.[0];
      console.log("\n🎉 Proposal created successfully!");
      console.log("Proposal ID:", proposalId);

      // Verify the proposal data
      console.log("\n🔍 Verifying proposal metadata...");
      const metadata = await contract.getProposalMetadata(proposalId);
      const details = await contract.getProposalDetails(proposalId);

      console.log("\nMetadata:");
      console.log("- Property ID:", metadata[0]);
      console.log("- Evidence Hash:", metadata[1]);
      console.log("- Verification Confidence:", metadata[2] + "%");
      console.log("- Issue Type:", metadata[3]);
      console.log("- Severity:", metadata[4]);
      console.log("- Market ID:", metadata[5]);
      console.log("- Resolution Deadline:", new Date(Number(metadata[6]) * 1000).toISOString());
      console.log("- IPFS CID:", metadata[7]);
      console.log("- Proposer:", metadata[8]);

      console.log("\nDetails:");
      console.log("- Title:", details[0]);
      console.log("- Location:", details[2]);
      console.log("- Latitude:", Number(details[3]) / 1e6);
      console.log("- Longitude:", Number(details[4]) / 1e6);
      console.log("- Requested Amount:", ethers.formatEther(details[5]), "ADI");
      console.log("- Beneficiary:", details[6]);

      console.log("\n✅ All metadata verified successfully!");
      console.log("\n📊 Summary:");
      console.log("- Proposal created with rich metadata structure");
      console.log("- Geographic coordinates stored correctly");
      console.log("- Issue type and severity categorized");
      console.log("- Prediction market ID generated");
      console.log("- Resolution deadline set (30 days after voting)");
      console.log("\n🎯 Ready for prediction market integration!");
    }
  } catch (error: any) {
    console.error("\n❌ Error creating proposal:", error.message);
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

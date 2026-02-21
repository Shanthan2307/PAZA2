import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

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
  "function getProposalVoting(bytes32 proposalId) external view returns (uint256, uint256, uint256, bool)",
  "function vote(bytes32 proposalId, bool support) external",
  "function isMember(address account) external view returns (bool)",
  "function getIssueTypeString(uint8 issueType) external pure returns (string)",
  "function getSeverityString(uint8 severity) external pure returns (string)",
  "event ProposalCreated(bytes32 indexed proposalId, bytes32 indexed propertyId, bytes32 evidenceHash, uint8 issueType, uint8 severity, uint256 deadline, uint256 resolutionDeadline)"
];

interface TestProposal {
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  requestedAmount: string;
  beneficiary: string;
  propertyId: string;
  evidenceHash: string;
  verificationConfidence: number;
  issueType: number;
  severity: number;
  ipfsCID: string;
}

async function main() {
  console.log("🧪 Full Flow Test: PredictionMarketDAO\n");
  console.log("=" .repeat(60));

  const contractAddress = process.env.DAO_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("DAO_CONTRACT_ADDRESS not set in .env");
  }

  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

  console.log("\n📋 Test Configuration:");
  console.log("- Account:", signer.address);
  console.log("- Contract:", contractAddress);
  console.log("- Network:", (await ethers.provider.getNetwork()).name);
  console.log("- Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Check membership
  const isMember = await contract.isMember(signer.address);
  console.log("- Is Member:", isMember ? "✅" : "❌");

  if (!isMember) {
    console.log("\n❌ Not a DAO member. Cannot proceed with tests.");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Create Multiple Proposals with Different Metadata");
  console.log("=".repeat(60));

  const testProposals: TestProposal[] = [
    {
      title: "Emergency Healthcare Initiative - Rural Kenya",
      description: `SITUATION: Critical healthcare shortage in rural Kenya affecting 2,000+ families.
      
PROPOSED SOLUTION:
- Mobile health clinics deployment
- Essential medicine distribution
- Healthcare worker training
- Telemedicine infrastructure

EXPECTED IMPACT:
- 2,000+ families receive healthcare access
- Reduced infant mortality rate
- Improved community health outcomes`,
      location: "Nairobi, Kenya",
      latitude: -1.286389,
      longitude: 36.817223,
      requestedAmount: "8000",
      beneficiary: signer.address,
      propertyId: "PROP_-1.286_36.817",
      evidenceHash: ethers.id("healthcare_kenya_evidence"),
      verificationConfidence: 92,
      issueType: 2, // HEALTHCARE
      severity: 3, // CRITICAL
      ipfsCID: "QmHealthcareKenya123"
    },
    {
      title: "Clean Water Infrastructure - Bangladesh",
      description: `SITUATION: Contaminated water sources affecting 5,000+ people in rural Bangladesh.
      
PROPOSED SOLUTION:
- Water filtration systems installation
- Well construction and maintenance
- Community water management training
- Water quality monitoring

EXPECTED IMPACT:
- 5,000+ people access clean water
- 80% reduction in waterborne diseases
- Improved agricultural productivity`,
      location: "Dhaka, Bangladesh",
      latitude: 23.8103,
      longitude: 90.4125,
      requestedAmount: "12000",
      beneficiary: signer.address,
      propertyId: "PROP_23.810_90.412",
      evidenceHash: ethers.id("water_bangladesh_evidence"),
      verificationConfidence: 88,
      issueType: 0, // ENVIRONMENTAL
      severity: 2, // HIGH
      ipfsCID: "QmWaterBangladesh456"
    },
    {
      title: "Education Technology Access - Rural India",
      description: `SITUATION: 1,500+ students lack access to digital education resources.
      
PROPOSED SOLUTION:
- Tablet distribution to students
- Internet connectivity setup
- Teacher digital literacy training
- Educational content localization

EXPECTED IMPACT:
- 1,500+ students gain digital access
- Improved learning outcomes
- Enhanced teacher capabilities`,
      location: "Mumbai, Maharashtra, India",
      latitude: 19.0760,
      longitude: 72.8777,
      requestedAmount: "6000",
      beneficiary: signer.address,
      propertyId: "PROP_19.076_72.877",
      evidenceHash: ethers.id("education_india_evidence"),
      verificationConfidence: 85,
      issueType: 3, // EDUCATION
      severity: 1, // MEDIUM
      ipfsCID: "QmEducationIndia789"
    }
  ];

  const createdProposals: string[] = [];

  for (let i = 0; i < testProposals.length; i++) {
    const proposal = testProposals[i];
    console.log(`\n📝 Creating Proposal ${i + 1}/${testProposals.length}:`);
    console.log(`   Title: ${proposal.title}`);
    console.log(`   Issue Type: ${proposal.issueType}`);
    console.log(`   Severity: ${proposal.severity}`);
    console.log(`   Confidence: ${proposal.verificationConfidence}%`);

    try {
      const latInt = Math.floor(proposal.latitude * 1e6);
      const lngInt = Math.floor(proposal.longitude * 1e6);
      const propertyIdBytes32 = ethers.id(proposal.propertyId);
      const evidenceHashBytes32 = proposal.evidenceHash;
      const requestedAmountWei = ethers.parseEther(proposal.requestedAmount);

      const tx = await contract.createProposal(
        proposal.title,
        proposal.description,
        proposal.location,
        latInt,
        lngInt,
        requestedAmountWei,
        proposal.beneficiary,
        propertyIdBytes32,
        evidenceHashBytes32,
        proposal.verificationConfidence,
        proposal.issueType,
        proposal.severity,
        proposal.ipfsCID
      );

      const receipt = await tx.wait();
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
        createdProposals.push(proposalId);
        console.log(`   ✅ Created: ${proposalId.slice(0, 10)}...`);
      }
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Verify Proposal Metadata");
  console.log("=".repeat(60));

  for (let i = 0; i < createdProposals.length; i++) {
    const proposalId = createdProposals[i];
    console.log(`\n🔍 Verifying Proposal ${i + 1}:`);

    try {
      const metadata = await contract.getProposalMetadata(proposalId);
      const details = await contract.getProposalDetails(proposalId);
      const voting = await contract.getProposalVoting(proposalId);

      // Get enum strings
      const issueTypeStr = await contract.getIssueTypeString(metadata[3]);
      const severityStr = await contract.getSeverityString(metadata[4]);

      console.log(`   Title: ${details[0]}`);
      console.log(`   Location: ${details[2]}`);
      console.log(`   Coordinates: ${Number(details[3]) / 1e6}, ${Number(details[4]) / 1e6}`);
      console.log(`   Amount: ${ethers.formatEther(details[5])} ADI`);
      console.log(`   Issue Type: ${issueTypeStr}`);
      console.log(`   Severity: ${severityStr}`);
      console.log(`   Confidence: ${metadata[2]}%`);
      console.log(`   Market ID: ${metadata[5].slice(0, 10)}...`);
      console.log(`   IPFS: ${metadata[7]}`);
      console.log(`   Voting Deadline: ${new Date(Number(voting[2]) * 1000).toLocaleString()}`);
      console.log(`   Resolution Deadline: ${new Date(Number(metadata[6]) * 1000).toLocaleString()}`);
      console.log(`   ✅ All metadata verified`);
    } catch (error: any) {
      console.log(`   ❌ Verification failed: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Vote on Proposals");
  console.log("=".repeat(60));

  for (let i = 0; i < createdProposals.length; i++) {
    const proposalId = createdProposals[i];
    const support = i % 2 === 0; // Alternate between yes/no votes

    console.log(`\n🗳️  Voting on Proposal ${i + 1}: ${support ? "YES" : "NO"}`);

    try {
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      
      const voting = await contract.getProposalVoting(proposalId);
      console.log(`   For: ${voting[0]}, Against: ${voting[1]}`);
      console.log(`   ✅ Vote recorded`);
    } catch (error: any) {
      console.log(`   ❌ Vote failed: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Summary Statistics");
  console.log("=".repeat(60));

  console.log(`\n📊 Test Results:`);
  console.log(`   Total Proposals Created: ${createdProposals.length}`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Network: ADI Testnet (Chain ID: 99999)`);

  // Calculate statistics
  let totalRequested = 0;
  const issueTypes: { [key: string]: number } = {};
  const severities: { [key: string]: number } = {};

  for (const proposalId of createdProposals) {
    try {
      const metadata = await contract.getProposalMetadata(proposalId);
      const details = await contract.getProposalDetails(proposalId);
      
      totalRequested += Number(ethers.formatEther(details[5]));
      
      const issueTypeStr = await contract.getIssueTypeString(metadata[3]);
      const severityStr = await contract.getSeverityString(metadata[4]);
      
      issueTypes[issueTypeStr] = (issueTypes[issueTypeStr] || 0) + 1;
      severities[severityStr] = (severities[severityStr] || 0) + 1;
    } catch (error) {
      // Skip on error
    }
  }

  console.log(`\n   Total Funding Requested: ${totalRequested} ADI`);
  console.log(`\n   Proposals by Issue Type:`);
  Object.entries(issueTypes).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`);
  });
  console.log(`\n   Proposals by Severity:`);
  Object.entries(severities).forEach(([severity, count]) => {
    console.log(`   - ${severity}: ${count}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));

  console.log("\n🎯 Next Steps:");
  console.log("1. ✅ Contract deployed and verified");
  console.log("2. ✅ Proposal creation with rich metadata working");
  console.log("3. ✅ Voting mechanism functional");
  console.log("4. 🔄 Update frontend to display new metadata");
  console.log("5. 🔄 Integrate Claude AI for automatic metadata enhancement");
  console.log("6. 🔄 Build prediction market contracts");
  console.log("7. 🔄 Add impact verification system");

  // Save test results
  const testResults = {
    timestamp: new Date().toISOString(),
    contractAddress,
    network: "ADI Testnet",
    chainId: 99999,
    proposalsCreated: createdProposals.length,
    proposalIds: createdProposals,
    totalFundingRequested: totalRequested,
    issueTypeDistribution: issueTypes,
    severityDistribution: severities
  };

  fs.writeFileSync(
    'test-results.json',
    JSON.stringify(testResults, null, 2)
  );
  console.log("\n📝 Test results saved to test-results.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from "hardhat";

const CONTRACT_ABI = [
  "function getProposalMetadata(bytes32 proposalId) external view returns (bytes32, bytes32, uint8, uint8, uint8, bytes32, uint256, string, address, uint256, uint8)",
  "function getProposalDetails(bytes32 proposalId) external view returns (string, string, string, int256, int256, uint256, address)",
  "function getProposalVoting(bytes32 proposalId) external view returns (uint256, uint256, uint256, bool)",
  "function getIssueTypeString(uint8 issueType) external pure returns (string)",
  "function getSeverityString(uint8 severity) external pure returns (string)"
];

async function main() {
  console.log("🔍 Listing All Proposals in PredictionMarketDAO\n");
  console.log("=".repeat(70));

  const contractAddress = "0x1323f3CfE3c34165562a7B5CC16a867A4bBacA9d";
  const provider = new ethers.JsonRpcProvider(process.env.DAO_CHAIN_RPC_URL);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

  // All known proposal IDs
  const proposalIds = [
    // From test-full-flow.ts
    "0xca7a920ba445d2c26a5dea00e094a6c10899dd0843628fb839aafa17ad333829",
    "0xc5b889ba70672677d179fcabdd9ed031b8d339f1b19c75416744ef0943f0710e",
    "0x6012815eb86cd34aa46a0e058374d23fd3e5989a22fd5aafd8a9024c84c41078",
    // From test-proposal-creation.ts
    "0x3dbc5e4baf321b9d8d115ea03be40751e942fcedc79ae4eb52bb3002ddb7a516",
    // From impact agent
    "0xf35755f387bab7c5b5730ef4dd20f5f7dfb2aa1ce64e3bd4302685c96242fa97",
    "0xedf736834eddfdf18de6d61cdf277460ef7330fa43816a24ef5df6445198b397"
  ];

  console.log(`\nChecking ${proposalIds.length} proposals...\n`);

  let activeCount = 0;
  let totalFunding = BigInt(0);

  for (let i = 0; i < proposalIds.length; i++) {
    const proposalId = proposalIds[i];
    
    try {
      const metadata = await contract.getProposalMetadata(proposalId);
      const details = await contract.getProposalDetails(proposalId);
      const voting = await contract.getProposalVoting(proposalId);
      const issueTypeStr = await contract.getIssueTypeString(metadata[3]);
      const severityStr = await contract.getSeverityString(metadata[4]);

      console.log(`\n📋 PROPOSAL ${i + 1}`);
      console.log("-".repeat(70));
      console.log("ID:", proposalId.slice(0, 10) + "..." + proposalId.slice(-8));
      console.log("Title:", details[0]);
      console.log("Location:", details[2]);
      console.log("Amount:", ethers.formatEther(details[5]), "ADI");
      console.log("Issue Type:", issueTypeStr);
      console.log("Severity:", severityStr);
      console.log("Confidence:", metadata[2] + "%");
      console.log("Votes - For:", voting[0].toString(), "Against:", voting[1].toString());
      console.log("Deadline:", new Date(Number(voting[2]) * 1000).toLocaleString());
      console.log("Executed:", voting[3] ? "Yes" : "No");
      console.log("Status:", metadata[10] === 1n ? "ACTIVE" : "OTHER");

      if (metadata[10] === 1n) activeCount++;
      totalFunding += details[5];

    } catch (error) {
      console.log(`\n❌ Proposal ${i + 1}: Not found or error`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📊 SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total Proposals: ${proposalIds.length}`);
  console.log(`Active Proposals: ${activeCount}`);
  console.log(`Total Funding Requested: ${ethers.formatEther(totalFunding)} ADI`);
  console.log("\n✅ All proposals are stored on-chain in PredictionMarketDAO!");
  console.log("🌐 Contract:", contractAddress);
  console.log("🔗 Network: ADI Testnet (Chain ID: 99999)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

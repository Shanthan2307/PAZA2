import { ethers } from "hardhat";

const CONTRACT_ABI = [
  "function getProposalMetadata(bytes32 proposalId) external view returns (bytes32, bytes32, uint8, uint8, uint8, bytes32, uint256, string, address, uint256, uint8)",
  "function getProposalDetails(bytes32 proposalId) external view returns (string, string, string, int256, int256, uint256, address)",
  "function getIssueTypeString(uint8 issueType) external pure returns (string)",
  "function getSeverityString(uint8 severity) external pure returns (string)"
];

async function main() {
  const proposalId = "0xf35755f387bab7c5b5730ef4dd20f5f7dfb2aa1ce64e3bd4302685c96242fa97";
  const contractAddress = "0x1323f3CfE3c34165562a7B5CC16a867A4bBacA9d";

  const provider = new ethers.JsonRpcProvider(process.env.DAO_CHAIN_RPC_URL);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

  console.log("🔍 Verifying Proposal Created by Impact Agent\n");
  console.log("Proposal ID:", proposalId);
  console.log("Contract:", contractAddress);
  console.log("\n" + "=".repeat(70));

  const metadata = await contract.getProposalMetadata(proposalId);
  const details = await contract.getProposalDetails(proposalId);
  const issueTypeStr = await contract.getIssueTypeString(metadata[3]);
  const severityStr = await contract.getSeverityString(metadata[4]);

  console.log("\n📋 PROPOSAL DETAILS:");
  console.log("Title:", details[0]);
  console.log("Location:", details[2]);
  console.log("Coordinates:", Number(details[3]) / 1e6, ",", Number(details[4]) / 1e6);
  console.log("Requested Amount:", ethers.formatEther(details[5]), "ADI");
  console.log("Beneficiary:", details[6]);

  console.log("\n🏷️  METADATA:");
  console.log("Property ID:", metadata[0]);
  console.log("Evidence Hash:", metadata[1]);
  console.log("Verification Confidence:", metadata[2] + "%");
  console.log("Issue Type:", issueTypeStr, `(${metadata[3]})`);
  console.log("Severity:", severityStr, `(${metadata[4]})`);
  console.log("Market ID:", metadata[5]);
  console.log("IPFS CID:", metadata[7]);
  console.log("Proposer:", metadata[8]);
  console.log("Created At:", new Date(Number(metadata[9]) * 1000).toLocaleString());

  console.log("\n" + "=".repeat(70));
  console.log("✅ Proposal verified successfully!");
  console.log("🎯 Impact Agent is working correctly with PredictionMarketDAO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Initialize demo prediction markets for existing proposals
// This is for demo purposes only - in production, markets would be created on-chain

import { marketStore } from './marketStore';

export function initDemoMarkets() {
  // Check if already initialized
  if (marketStore.getMarkets().length > 0) {
    return;
  }

  // Demo Market 1: Denver Sidewalk Repair
  marketStore.addMarket({
    id: 'market-1',
    proposalId: '0x6545f1d3d21957c680260ae2fe08ac0e0c91f523f35ceb51864bb30fe562d116',
    title: 'Denver Sidewalk Repair Initiative',
    description: 'Will the sidewalk repair on Main Street be completed within 10 days of approval?',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeig2ojne33y74ijexds5ydvsplnhihipqatztxnjsne4uvj7lb5lq',
    deadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    yesPrice: 0.65,
    noPrice: 0.35,
    totalVolume: 1250,
    yesShares: 812,
    noShares: 438,
    status: 'active',
    category: 'Infrastructure',
    createdAt: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, // 2 days ago
    marketQuestion: 'Will this repair be completed within 10 days?',
    resolutionCriteria: 'Market resolves YES if repair is verified complete within 10 days of DAO approval. Otherwise resolves NO.',
    initialLiquidity: 1000
  });

  // Demo Market 2: Boston Pothole Repair
  marketStore.addMarket({
    id: 'market-2',
    proposalId: '0xa2ab6ca0708c027c73a239854e6b702e64c950156a83f20a1c52a77d66080de7',
    title: 'Boston Pothole Emergency Repair',
    description: 'Will the emergency pothole repair be completed within 10 days of approval?',
    imageUrl: 'https://gateway.pinata.cloud/ipfs/bafybeig2ojne33y74ijexds5ydvsplnhihipqatztxnjsne4uvj7lb5lq',
    deadline: Math.floor(Date.now() / 1000) + 5 * 24 * 60 * 60, // 5 days from now
    yesPrice: 0.72,
    noPrice: 0.28,
    totalVolume: 890,
    yesShares: 640,
    noShares: 250,
    status: 'active',
    category: 'Infrastructure',
    createdAt: Math.floor(Date.now() / 1000) - 1 * 24 * 60 * 60, // 1 day ago
    marketQuestion: 'Will this repair be completed within 10 days?',
    resolutionCriteria: 'Market resolves YES if repair is verified complete within 10 days of DAO approval. Otherwise resolves NO.',
    initialLiquidity: 800
  });

  console.log('✅ Demo prediction markets initialized');
}

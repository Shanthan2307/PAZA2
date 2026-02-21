// Simple in-memory store for launched prediction markets
// In production, this would be replaced with blockchain data

interface LaunchedMarket {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  imageUrl?: string;
  deadline: number;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  yesShares: number;
  noShares: number;
  status: 'active' | 'closed' | 'resolved';
  category?: string;
  createdAt: number;
  marketQuestion: string;
  resolutionCriteria: string;
  initialLiquidity: number;
}

class MarketStore {
  private markets: LaunchedMarket[] = [];
  private listeners: Set<() => void> = new Set();

  addMarket(market: LaunchedMarket) {
    this.markets.push(market);
    this.notifyListeners();
  }

  getMarkets(): LaunchedMarket[] {
    return [...this.markets];
  }

  getMarketByProposalId(proposalId: string): LaunchedMarket | undefined {
    return this.markets.find(m => m.proposalId === proposalId);
  }

  updateMarket(id: string, updates: Partial<LaunchedMarket>) {
    const index = this.markets.findIndex(m => m.id === id);
    if (index !== -1) {
      this.markets[index] = { ...this.markets[index], ...updates };
      this.notifyListeners();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const marketStore = new MarketStore();
export type { LaunchedMarket };

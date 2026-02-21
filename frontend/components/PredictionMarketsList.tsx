'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import PredictionMarket from './PredictionMarket';
import { marketStore, LaunchedMarket } from '../lib/marketStore';

export default function PredictionMarketsList() {
  const { address } = useAccount();
  const [markets, setMarkets] = useState<LaunchedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed' | 'resolved'>('active');
  const [sortBy, setSortBy] = useState<'volume' | 'deadline' | 'newest'>('volume');

  useEffect(() => {
    loadMarkets();
    
    // Subscribe to market store updates
    const unsubscribe = marketStore.subscribe(() => {
      loadMarkets();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  function loadMarkets() {
    try {
      setLoading(true);
      
      // Get markets from store
      const allMarkets = marketStore.getMarkets();
      setMarkets(allMarkets);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMarkets = markets
    .filter((market) => {
      if (filter === 'all') return true;
      return market.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
      if (sortBy === 'deadline') return a.deadline - b.deadline;
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      return 0;
    });

  const stats = {
    total: markets.length,
    active: markets.filter((m) => m.status === 'active').length,
    totalVolume: markets.reduce((sum, m) => sum + m.totalVolume, 0),
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading prediction markets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-sm text-gray-500 mb-1">Total Markets</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-sm text-gray-500 mb-1">Active Markets</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-sm text-gray-500 mb-1">Total Volume</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalVolume.toFixed(0)} ADI</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({markets.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'active'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'closed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'resolved'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="volume">Highest Volume</option>
              <option value="deadline">Ending Soon</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Markets List */}
      {filteredMarkets.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {filter !== 'all' ? filter : ''} markets found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'active'
              ? 'There are no active prediction markets at the moment.'
              : 'Try adjusting your filters to see more markets.'}
          </p>
          <button
            onClick={loadMarkets}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMarkets.map((market) => (
            <div key={market.id} className="relative">
              {/* Category Badge */}
              {market.category && (
                <div className="absolute -top-3 left-6 z-10">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                    {market.category}
                  </span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute -top-3 right-6 z-10">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${
                    market.status === 'active'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : market.status === 'closed'
                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                >
                  {market.status === 'active' ? '🟢 Active' : market.status === 'closed' ? '⏸️ Closed' : '✅ Resolved'}
                </span>
              </div>

              <PredictionMarket
                proposalId={market.proposalId}
                title={market.title}
                description={market.description}
                imageUrl={market.imageUrl}
                deadline={market.deadline}
                yesPrice={market.yesPrice}
                noPrice={market.noPrice}
                totalVolume={market.totalVolume}
                yesShares={market.yesShares}
                noShares={market.noShares}
              />
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-3">How Prediction Markets Work</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-1">📈 Market Prices = Probabilities</p>
            <p className="text-gray-600">
              If YES is trading at 0.65 ADI, the market believes there's a 65% chance of YES outcome.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">💰 Winning Shares Pay 1 ADI</p>
            <p className="text-gray-600">
              If your position wins, each share is worth 1 ADI. Losing shares become worthless.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">🎯 Buy Low, Sell High</p>
            <p className="text-gray-600">
              Profit by buying shares when you think the market has mispriced the probability.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">✅ DAO Verification</p>
            <p className="text-gray-600">
              Markets are resolved by DAO vote and validator verification of real-world outcomes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

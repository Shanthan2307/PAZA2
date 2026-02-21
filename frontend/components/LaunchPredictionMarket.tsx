'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { marketStore } from '../lib/marketStore';

interface LaunchPredictionMarketProps {
  proposalId: string;
  proposalTitle: string;
  proposalDescription?: string;
  proposalImageUrl?: string;
  proposalDeadline?: number;
  proposalCategory?: string;
  onSuccess?: () => void;
}

export default function LaunchPredictionMarket({
  proposalId,
  proposalTitle,
  proposalDescription,
  proposalImageUrl,
  proposalDeadline,
  proposalCategory,
  onSuccess,
}: LaunchPredictionMarketProps) {
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [marketQuestion, setMarketQuestion] = useState('');
  const [tradingPeriodDays, setTradingPeriodDays] = useState('7');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [resolutionCriteria, setResolutionCriteria] = useState('');

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Close modal on success
  if (isSuccess && showModal) {
    setTimeout(() => {
      setShowModal(false);
      onSuccess?.();
    }, 2000);
  }

  // Market Escrow Contract
  const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  
  const ESCROW_ABI = [
    {
      inputs: [
        { internalType: 'bytes32', name: 'marketId', type: 'bytes32' },
        { internalType: 'bytes32', name: 'proposalId', type: 'bytes32' }
      ],
      name: 'launchMarket',
      outputs: [],
      stateMutability: 'payable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getFeeConfig',
      outputs: [
        { internalType: 'uint256', name: 'launchFee', type: 'uint256' },
        { internalType: 'uint256', name: 'tradingFee', type: 'uint256' },
        { internalType: 'uint256', name: 'resolutionFee', type: 'uint256' }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ] as const;

  const handleLaunchMarket = async () => {
    if (!address || !marketQuestion || !initialLiquidity) return;

    try {
      // Generate market ID from proposal ID and timestamp
      const marketId = `0x${Buffer.from(`MARKET_${proposalId}_${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}` as `0x${string}`;
      const proposalIdBytes32 = proposalId.startsWith('0x') ? proposalId as `0x${string}` : `0x${proposalId.padEnd(66, '0')}` as `0x${string}`;

      // Launch market with escrow fee (0.01 ADI)
      writeContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'launchMarket',
        args: [marketId, proposalIdBytes32],
        value: BigInt('10000000000000000'), // 0.01 ADI in wei
      });

      // Add market to store after transaction
      const tradingDeadline = Math.floor(Date.now() / 1000) + parseInt(tradingPeriodDays) * 86400;
      
      marketStore.addMarket({
        id: marketId,
        proposalId,
        title: proposalTitle,
        description: marketQuestion,
        imageUrl: proposalImageUrl,
        deadline: tradingDeadline,
        yesPrice: 0.5,
        noPrice: 0.5,
        totalVolume: parseFloat(initialLiquidity),
        yesShares: parseFloat(initialLiquidity),
        noShares: parseFloat(initialLiquidity),
        status: 'active',
        category: proposalCategory,
        createdAt: Math.floor(Date.now() / 1000),
        marketQuestion,
        resolutionCriteria,
        initialLiquidity: parseFloat(initialLiquidity),
      });

    } catch (error) {
      console.error('Error launching market:', error);
      alert('Failed to launch market. Please try again.');
    }
  };

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
      >
        🎯 Launch Prediction Market
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Launch Prediction Market</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Create a prediction market for: <span className="font-medium">{proposalTitle}</span>
          </p>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Market Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Question (Binary: Yes/No) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={marketQuestion}
              onChange={(e) => setMarketQuestion(e.target.value)}
              placeholder="e.g., Will this project be completed within 10 days?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Frame as a yes/no question with clear resolution criteria
            </p>
          </div>

          {/* Resolution Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Criteria <span className="text-red-500">*</span>
            </label>
            <textarea
              value={resolutionCriteria}
              onChange={(e) => setResolutionCriteria(e.target.value)}
              placeholder="Describe how the market will be resolved (e.g., verified completion by validators, specific metrics achieved, etc.)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Trading Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trading Period (Days) <span className="text-red-500">*</span>
            </label>
            <select
              value={tradingPeriodDays}
              onChange={(e) => setTradingPeriodDays(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days (Recommended)</option>
              <option value="10">10 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How long traders can place bets before market closes
            </p>
          </div>

          {/* Initial Liquidity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Liquidity (ADI) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={initialLiquidity}
              onChange={(e) => setInitialLiquidity(e.target.value)}
              placeholder="100"
              step="10"
              min="10"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10 ADI recommended for healthy market
            </p>
          </div>

          {/* Market Parameters Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Market Parameters & Fees</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• <strong>Launch Fee:</strong> 0.01 ADI (held in escrow)</li>
              <li>• Initial YES/NO probability: 50%/50%</li>
              <li>• Trading fee: 0.3% per transaction</li>
              <li>• Resolution method: DAO vote + validator verification</li>
              <li>• Minimum bet: 0.1 ADI</li>
            </ul>
            <p className="text-xs text-gray-600 mt-2">
              💡 Launch fee is refundable if market is cancelled or disputed
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1">
                  <li>• Your initial liquidity will be locked until market resolution</li>
                  <li>• Market question cannot be changed after creation</li>
                  <li>• Ensure resolution criteria are clear and verifiable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunchMarket}
              disabled={!marketQuestion || !resolutionCriteria || !initialLiquidity || isPending || isConfirming}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isPending || isConfirming ? 'Launching...' : `Launch Market (0.01 ADI Fee)`}
            </button>
          </div>

          {isSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium text-sm text-center">
                ✓ Prediction market launched successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

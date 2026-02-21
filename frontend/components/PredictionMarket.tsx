'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

interface PredictionMarketProps {
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
}

export default function PredictionMarket({
  proposalId,
  title,
  description,
  imageUrl,
  deadline,
  yesPrice,
  noPrice,
  totalVolume,
  yesShares,
  noShares,
}: PredictionMarketProps) {
  const { address } = useAccount();
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [betAmount, setBetAmount] = useState('');
  const [showBettingInterface, setShowBettingInterface] = useState(false);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Calculate potential gain
  const calculateGain = () => {
    if (!betAmount || isNaN(parseFloat(betAmount))) return 0;
    const amount = parseFloat(betAmount);
    const price = selectedPosition === 'yes' ? yesPrice : noPrice;
    return amount / price;
  };

  // Calculate probability from price
  const yesProbability = Math.round(yesPrice * 100);
  const noProbability = Math.round(noPrice * 100);

  const handlePlaceBet = async () => {
    if (!betAmount || !address) return;

    try {
      // TODO: Replace with actual contract call
      console.log('Placing bet:', {
        proposalId,
        position: selectedPosition,
        amount: betAmount,
      });
      
      // Placeholder for contract interaction
      // writeContract({
      //   address: PREDICTION_MARKET_ADDRESS,
      //   abi: PREDICTION_MARKET_ABI,
      //   functionName: 'placeBet',
      //   args: [proposalId, selectedPosition === 'yes', parseEther(betAmount)],
      // });
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const timeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Market Closed';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-32 h-32 object-cover rounded-lg ml-6"
            />
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">⏱️ {timeRemaining()}</span>
          <span className="text-gray-500">💰 Volume: {totalVolume.toFixed(2)} ADI</span>
        </div>
      </div>

      {/* Price Chart Placeholder */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Market Probability</h4>
          <button className="text-sm text-blue-600 hover:underline">View Full Chart</button>
        </div>
        
        {/* Simple probability bars */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-green-700">YES</span>
              <span className="text-sm font-bold text-green-700">{yesProbability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${yesProbability}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-red-700">NO</span>
              <span className="text-sm font-bold text-red-700">{noProbability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-red-500 h-3 rounded-full transition-all"
                style={{ width: `${noProbability}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">YES Shares</div>
            <div className="text-lg font-bold text-gray-900">{yesShares.toFixed(0)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">NO Shares</div>
            <div className="text-lg font-bold text-gray-900">{noShares.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Betting Interface */}
      <div className="p-6">
        {!showBettingInterface ? (
          <button
            onClick={() => setShowBettingInterface(true)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Place Bet
          </button>
        ) : (
          <div className="space-y-4">
            {/* Position Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Position
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPosition('yes')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    selectedPosition === 'yes'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">👍 YES</div>
                  <div className="text-xs mt-1">{yesProbability}% probability</div>
                </button>
                <button
                  onClick={() => setSelectedPosition('no')}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    selectedPosition === 'no'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg">👎 NO</div>
                  <div className="text-xs mt-1">{noProbability}% probability</div>
                </button>
              </div>
            </div>

            {/* Bet Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Amount (ADI)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Potential Gain */}
            {betAmount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">You're betting:</span>
                  <span className="font-bold text-gray-900">{betAmount} ADI</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Potential shares:</span>
                  <span className="font-bold text-gray-900">{calculateGain().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">If you win:</span>
                  <span className="font-bold text-green-600">
                    {calculateGain().toFixed(2)} ADI
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <div className="text-xs text-gray-600">
                    Price per share: {selectedPosition === 'yes' ? yesPrice.toFixed(3) : noPrice.toFixed(3)} ADI
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBettingInterface(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={!betAmount || isPending || isConfirming}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending || isConfirming ? 'Confirming...' : 'Confirm Bet'}
              </button>
            </div>

            {/* Success Message */}
            {isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-sm">
                  ✓ Bet placed successfully!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

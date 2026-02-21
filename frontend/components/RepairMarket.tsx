'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface RepairMarketProps {
  marketId: string;
  proposalId: string;
  proposalTitle: string;
  propertyId: string;
}

// Deployed contract addresses
const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS || '0xAA4823a0040d958e3a4935De1Be1697CaAd060b3') as `0x${string}`;

const MARKET_ABI = [
  {
    inputs: [{ internalType: 'bytes32', name: 'marketId', type: 'bytes32' }],
    name: 'markets',
    outputs: [
      { internalType: 'bytes32', name: 'marketId_', type: 'bytes32' },
      { internalType: 'bytes32', name: 'proposalId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'propertyId', type: 'bytes32' },
      { internalType: 'uint256', name: 'approvalTime', type: 'uint256' },
      { internalType: 'uint256', name: 'repairDeadline', type: 'uint256' },
      { internalType: 'uint256', name: 'tradingDeadline', type: 'uint256' },
      { internalType: 'uint256', name: 'yesPool', type: 'uint256' },
      { internalType: 'uint256', name: 'noPool', type: 'uint256' },
      { internalType: 'bool', name: 'exists', type: 'bool' },
      { internalType: 'bool', name: 'resolved', type: 'bool' },
      { internalType: 'bool', name: 'outcomeYes', type: 'bool' },
      { internalType: 'bool', name: 'cancelled', type: 'bool' },
      { internalType: 'address', name: 'creator', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'marketId', type: 'bytes32' }],
    name: 'getImpliedYesProbabilityBps',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'marketId', type: 'bytes32' },
      { internalType: 'address', name: 'user', type: 'address' },
    ],
    name: 'getUserPosition',
    outputs: [
      { internalType: 'uint256', name: 'yesAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'noAmount', type: 'uint256' },
      { internalType: 'bool', name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'marketId', type: 'bytes32' }],
    name: 'stakeYes',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'marketId', type: 'bytes32' }],
    name: 'stakeNo',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'marketId', type: 'bytes32' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function RepairMarket({ marketId, proposalId, proposalTitle, propertyId }: RepairMarketProps) {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('0.01');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read market data
  const { data: marketData, refetch: refetchMarket } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: 'markets',
    args: [marketId as `0x${string}`],
  });

  const { data: probability, refetch: refetchProb } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: 'getImpliedYesProbabilityBps',
    args: [marketId as `0x${string}`],
  });

  const { data: userPosition, refetch: refetchPosition } = useReadContract({
    address: MARKET_ADDRESS,
    abi: MARKET_ABI,
    functionName: 'getUserPosition',
    args: address ? [marketId as `0x${string}`, address] : undefined,
  });

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetchMarket();
        refetchProb();
        refetchPosition();
      }, 2000);
    }
  }, [isSuccess, refetchMarket, refetchProb, refetchPosition]);

  if (!marketData || !marketData[8]) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <p className="text-gray-600">Market not found or not yet created.</p>
      </div>
    );
  }

  const [
    ,
    ,
    ,
    ,
    repairDeadline,
    tradingDeadline,
    yesPool,
    noPool,
    ,
    resolved,
    outcomeYes,
    cancelled,
  ] = marketData;

  const yesProbability = probability ? Number(probability) / 100 : 50;
  const noProbability = 100 - yesProbability;

  const now = Math.floor(Date.now() / 1000);
  const tradingOpen = now <= Number(tradingDeadline);
  const repairTimeRemaining = Number(repairDeadline) - now;

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Ended';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 60) {
      const hours = Math.floor(mins / 60);
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleStake = (yesSide: boolean) => {
    try {
      const value = parseEther(stakeAmount);
      writeContract({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: yesSide ? 'stakeYes' : 'stakeNo',
        args: [marketId as `0x${string}`],
        value,
      });
    } catch (err) {
      console.error('Error staking:', err);
    }
  };

  const handleClaim = () => {
    try {
      writeContract({
        address: MARKET_ADDRESS,
        abi: MARKET_ABI,
        functionName: 'claim',
        args: [marketId as `0x${string}`],
      });
    } catch (err) {
      console.error('Error claiming:', err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">Repair Timeline Market</h3>
          {cancelled && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
              Cancelled
            </span>
          )}
          {resolved && !cancelled && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              outcomeYes 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-red-100 text-red-800 border-red-200'
            }`}>
              Resolved: {outcomeYes ? 'YES' : 'NO'}
            </span>
          )}
          {!resolved && !cancelled && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              tradingOpen 
                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                : 'bg-orange-100 text-orange-800 border-orange-200'
            }`}>
              {tradingOpen ? 'Trading Open' : 'Trading Closed'}
            </span>
          )}
        </div>
        <p className="text-gray-700 font-medium">
          Will the repair for "{proposalTitle}" be completed within the deadline?
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Property ID: {propertyId.slice(0, 10)}...{propertyId.slice(-8)}
        </p>
      </div>

      {/* Countdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Trading Deadline</div>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(Number(tradingDeadline) - now)}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-600 mb-1">Repair Deadline</div>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(repairTimeRemaining)}
          </div>
        </div>
      </div>

      {/* Pools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900">Market Pools</h4>
          <div className="text-sm text-gray-600">
            Total: {formatEther(yesPool + noPool)} ADI
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">YES ({yesProbability.toFixed(1)}%)</span>
              <span className="font-medium text-gray-900">{formatEther(yesPool)} ADI</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${yesProbability}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">NO ({noProbability.toFixed(1)}%)</span>
              <span className="font-medium text-gray-900">{formatEther(noPool)} ADI</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${noProbability}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* User Position */}
      {address && userPosition && (userPosition[0] > 0n || userPosition[1] > 0n) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Your Position</h4>
          <div className="space-y-1 text-sm">
            {userPosition[0] > 0n && (
              <div className="flex justify-between">
                <span className="text-blue-700">YES stake:</span>
                <span className="font-medium text-blue-900">{formatEther(userPosition[0])} ADI</span>
              </div>
            )}
            {userPosition[1] > 0n && (
              <div className="flex justify-between">
                <span className="text-blue-700">NO stake:</span>
                <span className="font-medium text-blue-900">{formatEther(userPosition[1])} ADI</span>
              </div>
            )}
            {userPosition[2] && (
              <div className="text-green-700 font-medium mt-2">✓ Claimed</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {!cancelled && (
        <div className="space-y-4">
          {tradingOpen && !resolved && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stake Amount (ADI)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.0001"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.01"
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleStake(true)}
                  disabled={isPending || isConfirming || !address}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Stake YES'}
                </button>
                <button
                  onClick={() => handleStake(false)}
                  disabled={isPending || isConfirming || !address}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Stake NO'}
                </button>
              </div>
            </div>
          )}

          {resolved && userPosition && !userPosition[2] && (userPosition[0] > 0n || userPosition[1] > 0n) && (
            <button
              onClick={handleClaim}
              disabled={isPending || isConfirming}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isPending || isConfirming ? 'Processing...' : '💰 Claim Winnings'}
            </button>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error.message}</p>
        </div>
      )}

      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Transaction successful!</p>
          <p className="text-green-700 text-sm mt-1 font-mono">
            {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
        </div>
      )}

      {/* Demo Mode Badge */}
      {repairTimeRemaining < 3600 && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium border border-purple-200">
            🎯 Demo Mode: Compressed timing (10 min = 10 days)
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

export default function JoinDAO() {
  const { address } = useAccount();
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: isMember, isLoading: isCheckingMembership } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'isMember',
    args: address ? [address] : undefined,
  });

  const handleJoin = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'joinDAO',
        value: parseEther('0.0001'),
      });
    } catch (err) {
      console.error('Error joining DAO:', err);
    }
  };

  if (isMember) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              You're a DAO Member
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Your wallet is registered as a member. You can now vote on proposals and participate in governance.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Vote on proposals</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Execute approved proposals</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Participate in governance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Join PAZE DAO
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Stake 0.01 ETH to become a member and participate in voting for social impact initiatives.
        </p>

        {isCheckingMembership && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Checking membership status...
            </p>
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={isPending || isConfirming || !address}
          className="w-full bg-black text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? 'Processing...' : 'Join DAO'}
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Minimum stake: 0.0001 ADI + gas fees
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm font-medium mb-1">
            Error joining DAO
          </p>
          <p className="text-red-600 text-xs">
            {error.message}
          </p>
        </div>
      )}

      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-1">
            ✓ Successfully joined the DAO!
          </p>
          <p className="text-green-700 text-xs font-mono">
            Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
        </div>
      )}
    </div>
  );
}

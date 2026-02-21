'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

export default function CauseList() {
  const [proposalId, setProposalId] = useState('');
  const [support, setSupport] = useState(true);

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleVote = async () => {
    if (!proposalId) {
      alert('Please enter a proposal ID');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'vote',
        args: [proposalId as `0x${string}`, support],
      });
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleExecute = async () => {
    if (!proposalId) {
      alert('Please enter a proposal ID');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'executeProposal',
        args: [proposalId as `0x${string}`],
      });
    } catch (err) {
      console.error('Error executing proposal:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Vote on Proposals
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Enter a proposal ID to vote or execute. Get the ID from transaction logs.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Proposal ID
          </label>
          <input
            type="text"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Vote
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSupport(true)}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                support
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              👍 For
            </button>
            <button
              onClick={() => setSupport(false)}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                !support
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              👎 Against
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleVote}
            disabled={isPending || isConfirming || !proposalId}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Voting...' : 'Cast Vote'}
          </button>
          <button
            onClick={handleExecute}
            disabled={isPending || isConfirming || !proposalId}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Executing...' : 'Execute Proposal'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error.message}
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">
              ✅ Transaction successful!
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-2">
            ℹ️ How to get Proposal ID:
          </p>
          <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-disc list-inside">
            <li>Create a proposal and check the transaction logs</li>
            <li>Look for the ProposalCreated event</li>
            <li>Copy the proposalId from the event data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

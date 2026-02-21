'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

export default function CreateCause() {
  const [description, setDescription] = useState('');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createProposal',
        args: [description],
      });
    } catch (err) {
      console.error('Error creating proposal:', err);
    }
  };

  const handleReset = () => {
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Create New Proposal
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Submit a proposal for the DAO to vote on. Must be a member.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Proposal Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={6}
            placeholder="Describe your proposal in detail..."
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Voting period: 7 days | Quorum: 2 votes
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Creating...' : 'Create Proposal'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
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
              ✅ Proposal created successfully!
            </p>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Check the transaction logs for your Proposal ID
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

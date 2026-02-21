'use client';

import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';

interface CompletionProofFormProps {
  proposalId: string;
  onSuccess?: () => void;
}

const RESOLVER_ADDRESS = (process.env.NEXT_PUBLIC_RESOLVER_ADDRESS || '0x9f7045E0B7C8309962097a0Ac64AfB5820e7A0F1') as `0x${string}`;

const RESOLVER_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'proposalId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'completionEvidenceHash', type: 'bytes32' },
      { internalType: 'string', name: 'completionIpfsCID', type: 'string' },
      { internalType: 'uint256', name: 'completionTimestamp', type: 'uint256' },
    ],
    name: 'submitCompletionProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function CompletionProofForm({ proposalId, onSuccess }: CompletionProofFormProps) {
  const [evidenceHash, setEvidenceHash] = useState('');
  const [ipfsCID, setIpfsCID] = useState('');
  const [completionTimestamp, setCompletionTimestamp] = useState('');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert hex string to bytes32
      const evidenceHashBytes = evidenceHash.startsWith('0x') ? evidenceHash : `0x${evidenceHash}`;
      const timestamp = completionTimestamp ? parseInt(completionTimestamp) : Math.floor(Date.now() / 1000);

      writeContract({
        address: RESOLVER_ADDRESS,
        abi: RESOLVER_ABI,
        functionName: 'submitCompletionProof',
        args: [
          proposalId as `0x${string}`,
          evidenceHashBytes as `0x${string}`,
          ipfsCID,
          BigInt(timestamp),
        ],
      });
    } catch (err) {
      console.error('Error submitting proof:', err);
    }
  };

  const generateMockHash = () => {
    const randomHash = ethers.hexlify(ethers.randomBytes(32));
    setEvidenceHash(randomHash);
  };

  const useCurrentTime = () => {
    setCompletionTimestamp(Math.floor(Date.now() / 1000).toString());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Completion Proof</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence Hash (bytes32)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={evidenceHash}
              onChange={(e) => setEvidenceHash(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="0x..."
              required
            />
            <button
              type="button"
              onClick={generateMockHash}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 text-sm"
            >
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IPFS CID
          </label>
          <input
            type="text"
            value={ipfsCID}
            onChange={(e) => setIpfsCID(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="QmXxx..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Timestamp (Unix)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={completionTimestamp}
              onChange={(e) => setCompletionTimestamp(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Unix timestamp"
              required
            />
            <button
              type="button"
              onClick={useCurrentTime}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 text-sm"
            >
              Use Now
            </button>
          </div>
          {completionTimestamp && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(parseInt(completionTimestamp) * 1000).toLocaleString()}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isPending || isConfirming ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error.message}</p>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Proof submitted successfully!</p>
          <p className="text-green-700 text-sm mt-1 font-mono">
            {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> After submitting proof, a finalizer must call resolveByProof() to resolve the market.
        </p>
      </div>
    </div>
  );
}

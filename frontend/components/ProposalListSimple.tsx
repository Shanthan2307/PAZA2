'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';
import { ethers } from 'ethers';

interface Proposal {
  id: string;
  description: string;
  forVotes: number;
  againstVotes: number;
  deadline: number;
  executed: boolean;
  exists: boolean;
}

export default function ProposalListSimple() {
  const { address } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    try {
      setLoading(true);
      
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_DAO_CHAIN_RPC_URL || 'https://rpc.ab.testnet.adifoundation.ai/'
      );
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Get ProposalCreated events
      const filter = contract.filters.ProposalCreated();
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      console.log(`Found ${events.length} proposal events`);
      
      // Fetch details for each proposal using the proposals mapping
      const proposalPromises = events.map(async (event: any) => {
        try {
          const proposalId = event.args[0] as string;
          
          // Call the proposals mapping to get full details including vote counts
          const proposalData = await contract.proposals(proposalId);
          
          return {
            id: proposalId,
            description: proposalData[0] as string,
            forVotes: Number(proposalData[1]),
            againstVotes: Number(proposalData[2]),
            deadline: Number(proposalData[3]),
            executed: proposalData[4] as boolean,
            exists: proposalData[5] as boolean,
          };
        } catch (error) {
          console.error('Error processing proposal:', error);
          return null;
        }
      });

      const results = await Promise.all(proposalPromises);
      const validProposals = results.filter((p) => p !== null) as Proposal[];
      
      console.log(`Loaded ${validProposals.length} valid proposals`);
      setProposals(validProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(proposalId: string, support: boolean) {
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
  }

  async function handleExecute(proposalId: string) {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'executeProposal',
        args: [proposalId as `0x${string}`],
      });
    } catch (err) {
      console.error('Error executing:', err);
    }
  }

  function getTimeRemaining(deadline: number): string {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }

  function getStatusColor(proposal: Proposal): string {
    if (proposal.executed) return 'bg-green-100 text-green-800 border border-green-200';
    
    const now = Math.floor(Date.now() / 1000);
    if (proposal.deadline < now) return 'bg-gray-100 text-gray-700 border border-gray-200';
    
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  }

  function getStatusText(proposal: Proposal): string {
    if (proposal.executed) return '✅ Executed';
    
    const now = Math.floor(Date.now() / 1000);
    if (proposal.deadline < now) {
      if (proposal.forVotes > proposal.againstVotes) return '⏳ Ready to Execute';
      return '❌ Rejected';
    }
    
    return '🗳️ Active';
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading proposals...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No proposals found
        </h3>
        <p className="text-gray-600 mb-6">
          Create proposals through the Telegram bot or wait for AI-generated proposals.
        </p>
        <button
          onClick={loadProposals}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          All Proposals ({proposals.length})
        </h3>
        <button
          onClick={loadProposals}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-200 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal)}`}>
                    {getStatusText(proposal)}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {getTimeRemaining(proposal.deadline)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <button
                onClick={() => setSelectedProposal(selectedProposal === proposal.id ? null : proposal.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedProposal === proposal.id ? '▼ Hide Details' : '▶ Show Details'}
              </button>
              
              {selectedProposal === proposal.id && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                    {proposal.description}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">For: {proposal.forVotes}</span>
                  <span className="text-gray-600">Against: {proposal.againstVotes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${proposal.forVotes + proposal.againstVotes > 0 
                        ? (proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100 
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {address && !proposal.executed && proposal.deadline > Math.floor(Date.now() / 1000) && (
                <>
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={isPending || isConfirming}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    👍 Vote For
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={isPending || isConfirming}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    👎 Vote Against
                  </button>
                </>
              )}
              
              {address && !proposal.executed && proposal.deadline < Math.floor(Date.now() / 1000) && proposal.forVotes > proposal.againstVotes && (
                <button
                  onClick={() => handleExecute(proposal.id)}
                  disabled={isPending || isConfirming}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  ⚡ Execute Proposal
                </button>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-mono">
                Proposal ID: {proposal.id.slice(0, 10)}...{proposal.id.slice(-8)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error: {error.message}
          </p>
        </div>
      )}

      {isSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✓ Transaction successful!
          </p>
          <p className="text-green-700 text-sm mt-1 font-mono">
            Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
          </p>
        </div>
      )}
    </div>
  );
}

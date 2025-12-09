"use client";

import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";

interface SwitchData {
  owner: PublicKey;
  heartbeatDeadline: number;
  timeoutSeconds: number;
  status: string;
  beneficiaries: Array<{ address: PublicKey; shareBps: number }>;
}

export const MySwitches: FC = () => {
  const { publicKey } = useWallet();
  const program = useProgram();
  const [switchData, setSwitchData] = useState<SwitchData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKey && program) {
      loadSwitch();
    }
  }, [publicKey, program]);

  const loadSwitch = async () => {
    if (!publicKey || !program) return;

    setLoading(true);
    try {
      const [switchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("switch"), publicKey.toBuffer()],
        program.programId
      );

      const data = await program.account.switch.fetch(switchPda);
      setSwitchData(data as any);
    } catch (error: any) {
      console.log("No switch found or error:", error.message);
      setSwitchData(null);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (deadline: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;

    if (remaining <= 0) return "EXPIRED";

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: any): string => {
    if (status.active) return "text-green-600";
    if (status.expired) return "text-red-600";
    if (status.canceled) return "text-gray-600";
    return "text-gray-600";
  };

  const getStatusText = (status: any): string => {
    if (status.active) return "✅ Active";
    if (status.expired) return "⚠️ Expired";
    if (status.canceled) return "❌ Canceled";
    return "Unknown";
  };

  if (!publicKey) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-600">Connect your wallet to view your switches</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!switchData) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🆕</div>
          <p className="text-gray-600">No switches found. Create one to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">📊</div>
        <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">🛡️ Your Switch</h3>
              <p className={`text-sm font-medium ${getStatusColor(switchData.status)}`}>
                {getStatusText(switchData.status)}
              </p>
            </div>
            <button
              onClick={loadSwitch}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100 transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⏰</span>
                <span className="text-sm font-medium text-gray-600">Timeout Period</span>
              </div>
              <span className="text-lg font-bold text-gray-800">
                {Math.floor(switchData.timeoutSeconds / 3600)} hours
              </span>
              <span className="text-sm text-gray-600 ml-2">
                ({Math.floor(switchData.timeoutSeconds / 86400)} days)
              </span>
            </div>

            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⌛</span>
                <span className="text-sm font-medium text-gray-600">Time Remaining</span>
              </div>
              <span className="text-lg font-bold text-gray-800">
                {getTimeRemaining(switchData.heartbeatDeadline)}
              </span>
            </div>

            <div className="bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👥</span>
                <span className="text-sm font-medium text-gray-600">Beneficiaries</span>
              </div>
              <div className="space-y-2">
                {switchData.beneficiaries.map((b, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-600">Beneficiary {i + 1}</span>
                      <span className="text-sm font-bold text-gray-800">{(b.shareBps / 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono truncate">{b.address.toString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

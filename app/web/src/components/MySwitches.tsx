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
    if (status.active) return "text-green-400";
    if (status.expired) return "text-red-400";
    if (status.canceled) return "text-gray-400";
    return "text-gray-400";
  };

  const getStatusText = (status: any): string => {
    if (status.active) return "Active";
    if (status.expired) return "Expired";
    if (status.canceled) return "Canceled";
    return "Unknown";
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">My Switches</h2>
        <p className="text-gray-400">Connect your wallet to view your switches</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">My Switches</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!switchData) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">My Switches</h2>
        <p className="text-gray-400">No switches found. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">My Switches</h2>

      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Your Switch</h3>
              <p className={`text-sm ${getStatusColor(switchData.status)}`}>
                {getStatusText(switchData.status)}
              </p>
            </div>
            <button
              onClick={loadSwitch}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Timeout:</span>
              <span className="text-white ml-2">
                {Math.floor(switchData.timeoutSeconds / 3600)} hours
              </span>
            </div>

            <div>
              <span className="text-gray-400">Time Remaining:</span>
              <span className="text-white ml-2">
                {getTimeRemaining(switchData.heartbeatDeadline)}
              </span>
            </div>

            <div>
              <span className="text-gray-400">Beneficiaries:</span>
              <div className="mt-1 space-y-1">
                {switchData.beneficiaries.map((b, i) => (
                  <div key={i} className="text-xs text-white bg-gray-600 rounded p-2">
                    <div className="truncate">{b.address.toString()}</div>
                    <div className="text-gray-300">{(b.shareBps / 100).toFixed(2)}%</div>
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

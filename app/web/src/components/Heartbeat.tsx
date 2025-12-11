"use client";

import { FC, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";

interface SwitchInfo {
  switchId: string;
  heartbeatDeadline: number;
  status: any;
}

export const Heartbeat: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const [switches, setSwitches] = useState<SwitchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey && program) {
      loadSwitches();
    }
  }, [publicKey, program]);

  const loadSwitches = async () => {
    if (!publicKey || !program) return;

    setLoading(true);
    try {
      const allAccounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          {
            memcmp: {
              offset: 8,
              bytes: publicKey.toBase58(),
            },
          },
        ],
      });

      const switchList: SwitchInfo[] = [];
      for (const account of allAccounts) {
        try {
          const decoded = program.coder.accounts.decode("switch", account.account.data);
          if (decoded.status.active) {
            switchList.push({
              switchId: decoded.switchId,
              heartbeatDeadline: decoded.heartbeatDeadline.toNumber(),
              status: decoded.status,
            });
          }
        } catch (e) {
          console.log("Failed to decode account:", e);
        }
      }
      setSwitches(switchList);
    } catch (error) {
      console.error("Error loading switches:", error);
      setSwitches([]);
    } finally {
      setLoading(false);
    }
  };

  const sendHeartbeat = async (switchId: string) => {
    if (!publicKey || !program) {
      alert("Please connect your wallet");
      return;
    }

    setSendingId(switchId);
    try {
      const tx = await program.methods
        .sendHeartbeat(switchId)
        .rpc();

      console.log("Heartbeat sent:", tx);
      alert("Heartbeat sent successfully!");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error sending heartbeat:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const getTimeRemaining = (deadline: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;

    if (remaining <= 0) return "EXPIRED";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const isUrgent = (deadline: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    return remaining > 0 && remaining < 86400; // Less than 24 hours
  };

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="animated-icon">
          <div className="heart-icon"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Send Heartbeat</h2>
      </div>
      <p className="text-gray-600 mb-6">
        Prove you're alive and extend your deadline. Keep your switches active!
      </p>

      {loading ? (
        <div className="text-center py-4">
          <div className="w-8 h-8 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : switches.length === 0 ? (
        <p className="text-center text-gray-500 py-4">
          No active switches found. Create one to get started!
        </p>
      ) : (
        <div className="space-y-3">
          {switches.map((sw) => (
            <div 
              key={sw.switchId}
              className={`p-4 rounded-xl border ${
                isUrgent(sw.heartbeatDeadline) 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{sw.switchId}</h3>
                  <p className={`text-sm ${
                    isUrgent(sw.heartbeatDeadline) ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Time left: {getTimeRemaining(sw.heartbeatDeadline)}
                  </p>
                </div>
                <button
                  onClick={() => sendHeartbeat(sw.switchId)}
                  disabled={sendingId === sw.switchId}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isUrgent(sw.heartbeatDeadline)
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
                  } disabled:opacity-50`}
                >
                  {sendingId === sw.switchId ? "Sending..." : "Heartbeat"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

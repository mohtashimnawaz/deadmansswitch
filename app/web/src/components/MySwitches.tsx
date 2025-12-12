"use client";

import { FC, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";

interface SwitchData {
  publicKey: PublicKey;
  switchId: string;
  owner: PublicKey;
  heartbeatDeadline: number;
  timeoutSeconds: number;
  status: any;
  beneficiaries: Array<{ address: PublicKey; shareBps: number }>;
}

export const MySwitches: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const [switches, setSwitches] = useState<SwitchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [sendingHeartbeatId, setSendingHeartbeatId] = useState<string | null>(null);
  const [distributingId, setDistributingId] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey && program) {
      loadSwitches();
    }
  }, [publicKey, program]);

  const loadSwitches = async () => {
    if (!publicKey || !program) return;

    setLoading(true);
    try {
      // Use getProgramAccounts to fetch all switches for this owner
      const allAccounts = await connection.getProgramAccounts(program.programId, {
        filters: [
          // Anchor account discriminator for Switch (8 bytes) + owner pubkey offset
          {
            memcmp: {
              offset: 8, // After discriminator
              bytes: publicKey.toBase58(),
            },
          },
        ],
      });

      const switchDataList: SwitchData[] = [];
      for (const account of allAccounts) {
        try {
          const decoded = program.coder.accounts.decode("switch", account.account.data);
          switchDataList.push({
            publicKey: account.pubkey,
            switchId: decoded.switchId,
            owner: decoded.owner,
            heartbeatDeadline: decoded.heartbeatDeadline.toNumber(),
            timeoutSeconds: decoded.timeoutSeconds.toNumber(),
            status: decoded.status,
            beneficiaries: decoded.beneficiaries,
          });
        } catch (e) {
          console.log("Failed to decode account:", e);
        }
      }

      setSwitches(switchDataList);
    } catch (error: any) {
      console.error("Error loading switches:", error);
      setSwitches([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelSwitch = async (switchId: string) => {
    if (!publicKey || !program) return;
    
    if (!confirm(`Are you sure you want to cancel switch "${switchId}"? This will close the account.`)) {
      return;
    }

    setCancelingId(switchId);
    try {
      const tx = await program.methods
        .cancelSwitch(switchId)
        .rpc();

      console.log("Switch canceled:", tx);
      alert("Switch canceled successfully!");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error canceling switch:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setCancelingId(null);
    }
  };

  const sendHeartbeat = async (switchId: string) => {
    if (!publicKey || !program) return;

    setSendingHeartbeatId(switchId);
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
      setSendingHeartbeatId(null);
    }
  };

  const triggerExpiryAndDistribute = async (switchData: SwitchData) => {
    if (!program) return;

    setDistributingId(switchData.switchId);
    try {
      // First, trigger expiry to mark the switch as expired
      console.log("Triggering expiry for switch:", switchData.switchId);
      const expiryTx = await program.methods
        .triggerExpiry(switchData.switchId)
        .rpc();
      
      console.log("Expiry triggered:", expiryTx);

      // Then distribute to all beneficiaries
      for (const beneficiary of switchData.beneficiaries) {
        console.log("Distributing to beneficiary:", beneficiary.address.toString());
        try {
          const distributeTx = await program.methods
            .distributeSol()
            .accounts({
              beneficiary: beneficiary.address,
            })
            .rpc();
          
          console.log("Distribution tx:", distributeTx);
        } catch (distError: any) {
          console.error("Distribution error for beneficiary:", distError);
          // Continue to next beneficiary even if one fails
        }
      }

      alert("Switch expired and funds distributed to all beneficiaries!");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error in expiry/distribution:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setDistributingId(null);
    }
  };

  const getTimeRemaining = (deadline: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;

    if (remaining <= 0) return "EXPIRED";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: any): string => {
    if (status.active) return "text-green-600";
    if (status.expired) return "text-red-600";
    if (status.canceled) return "text-gray-600";
    return "text-gray-600";
  };

  const getStatusText = (status: any): string => {
    if (status.active) return "Active";
    if (status.expired) return "Expired";
    if (status.canceled) return "Canceled";
    return "Unknown";
  };

  if (!publicKey) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="animated-icon">
            <div className="chart-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Connect your wallet to view your switches</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="animated-icon">
            <div className="chart-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (switches.length === 0) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="animated-icon">
            <div className="chart-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">No switches found. Create one to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="animated-icon">
            <div className="chart-icon">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">My Switches ({switches.length})</h2>
        </div>
        <button
          onClick={loadSwitches}
          className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100 transition-all"
        >
          Refresh All
        </button>
      </div>

      <div className="space-y-4">
        {switches.map((switchData) => (
          <div 
            key={switchData.switchId} 
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{switchData.switchId}</h3>
                <p className={`text-sm font-medium ${getStatusColor(switchData.status)}`}>
                  {getStatusText(switchData.status)}
                </p>
              </div>
              <div className="flex gap-2">
                {switchData.status.active && getTimeRemaining(switchData.heartbeatDeadline) !== "EXPIRED" && (
                  <button
                    onClick={() => sendHeartbeat(switchData.switchId)}
                    disabled={sendingHeartbeatId === switchData.switchId}
                    className="text-sm font-medium text-green-600 hover:text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
                  >
                    {sendingHeartbeatId === switchData.switchId ? "Sending..." : "Send Heartbeat"}
                  </button>
                )}
                {switchData.status.active && getTimeRemaining(switchData.heartbeatDeadline) === "EXPIRED" && (
                  <button
                    onClick={() => triggerExpiryAndDistribute(switchData)}
                    disabled={distributingId === switchData.switchId}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-100 transition-all disabled:opacity-50"
                  >
                    {distributingId === switchData.switchId ? "Distributing..." : "Distribute Funds"}
                  </button>
                )}
                {switchData.status.active && getTimeRemaining(switchData.heartbeatDeadline) !== "EXPIRED" && (
                  <button
                    onClick={() => cancelSwitch(switchData.switchId)}
                    disabled={cancelingId === switchData.switchId}
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    {cancelingId === switchData.switchId ? "Canceling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="clock-icon" style={{width: '16px', height: '16px', borderWidth: '2px'}}></div>
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
                  <div className="heart-icon" style={{width: '16px', height: '16px', borderWidth: '2px'}}></div>
                  <span className="text-sm font-medium text-gray-600">Time Remaining</span>
                </div>
                <span className={`text-lg font-bold ${
                  getTimeRemaining(switchData.heartbeatDeadline) === "EXPIRED" 
                    ? "text-red-600" 
                    : "text-gray-800"
                }`}>
                  {getTimeRemaining(switchData.heartbeatDeadline)}
                </span>
              </div>
            </div>

            <div className="mt-3 bg-white/60 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div style={{display: 'flex', gap: '2px'}}>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Beneficiaries ({switchData.beneficiaries.length})
                </span>
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
        ))}
      </div>
    </div>
  );
};

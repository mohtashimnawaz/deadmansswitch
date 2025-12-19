"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useProgram } from "@/hooks/useProgram";
import {
  Icons,
  CardHeader,
  Badge,
  Spinner,
  EmptyState,
  Countdown,
  useToast,
} from "@/components/ui";

interface SwitchInfo {
  switchId: string;
  heartbeatDeadline: number;
  status: any;
}

export const Heartbeat: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const { addToast } = useToast();
  
  const [switches, setSwitches] = useState<SwitchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadSwitches = useCallback(async () => {
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
      
      // Sort by deadline (most urgent first)
      switchList.sort((a, b) => a.heartbeatDeadline - b.heartbeatDeadline);
      setSwitches(switchList);
    } catch (error) {
      console.error("Error loading switches:", error);
      setSwitches([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection]);

  useEffect(() => {
    if (publicKey && program) {
      loadSwitches();
    }
  }, [publicKey, program, loadSwitches]);

  const sendHeartbeat = async (switchId: string) => {
    if (!publicKey || !program) {
      addToast("error", "Wallet not connected");
      return;
    }

    setSendingId(switchId);
    try {
      const tx = await program.methods.sendHeartbeat(switchId).rpc();

      console.log("Heartbeat sent:", tx);
      addToast("success", "Heartbeat sent!", "Your deadline has been extended");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error sending heartbeat:", error);
      addToast("error", "Heartbeat failed", error.message);
    } finally {
      setSendingId(null);
    }
  };

  const isUrgent = (deadline: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    return remaining > 0 && remaining < 86400;
  };

  const isExpired = (deadline: number): boolean => {
    const now = Math.floor(Date.now() / 1000);
    return deadline - now <= 0;
  };

  const getUrgencyLevel = (deadline: number): "normal" | "warning" | "danger" | "expired" => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = deadline - now;
    
    if (remaining <= 0) return "expired";
    if (remaining < 3600) return "danger";  // Less than 1 hour
    if (remaining < 86400) return "warning"; // Less than 24 hours
    return "normal";
  };

  if (!publicKey) {
    return (
      <div className="card-static p-8">
        <EmptyState
          icon={<Icons.Heart className="w-8 h-8 text-zinc-500" />}
          title="Wallet not connected"
          description="Connect your wallet to send heartbeats and keep your switches active."
        />
      </div>
    );
  }

  return (
    <div className="card-static p-6 md:p-8">
      <CardHeader
        icon={<Icons.Heart className="w-6 h-6 text-white animate-heartbeat" />}
        title="Send Heartbeat"
        subtitle="Keep your switches active"
        action={
          <button onClick={loadSwitches} disabled={loading} className="btn-ghost">
            {loading ? <Spinner size="sm" /> : <Icons.Refresh className="w-5 h-5" />}
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : switches.length === 0 ? (
        <EmptyState
          icon={<Icons.Activity className="w-8 h-8 text-zinc-500" />}
          title="No active switches"
          description="Create a switch to start protecting your digital assets."
        />
      ) : (
        <div className="space-y-4">
          {/* Urgent Alert */}
          {switches.some((sw) => isUrgent(sw.heartbeatDeadline)) && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 animate-pulse-glow">
              <div className="flex items-center gap-3">
                <Icons.AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-200">
                  Some switches require urgent attention!
                </span>
              </div>
            </div>
          )}

          {/* Switch List */}
          <div className="space-y-3">
            {switches.map((sw, index) => {
              const urgency = getUrgencyLevel(sw.heartbeatDeadline);
              const expired = isExpired(sw.heartbeatDeadline);
              
              return (
                <div
                  key={sw.switchId}
                  className={`p-4 rounded-xl border transition-all animate-fade-in ${
                    urgency === "expired"
                      ? "bg-red-500/10 border-red-500/30"
                      : urgency === "danger"
                      ? "bg-red-500/5 border-red-500/20"
                      : urgency === "warning"
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-zinc-900/50 border-zinc-800"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        urgency === "expired" || urgency === "danger"
                          ? "bg-red-500/20"
                          : urgency === "warning"
                          ? "bg-yellow-500/20"
                          : "bg-purple-500/20"
                      }`}>
                        <Icons.Shield className={`w-5 h-5 ${
                          urgency === "expired" || urgency === "danger"
                            ? "text-red-400"
                            : urgency === "warning"
                            ? "text-yellow-400"
                            : "text-purple-400"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{sw.switchId}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Icons.Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <Countdown deadline={sw.heartbeatDeadline} className="text-sm" />
                          {urgency !== "normal" && (
                            <Badge variant={urgency === "expired" ? "danger" : urgency === "danger" ? "danger" : "warning"}>
                              {urgency === "expired" ? "Expired" : "Urgent"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => sendHeartbeat(sw.switchId)}
                      disabled={sendingId === sw.switchId || expired}
                      className={`btn ${
                        expired
                          ? "btn-danger opacity-50 cursor-not-allowed"
                          : urgency === "danger" || urgency === "warning"
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                          : "btn-success"
                      } px-4 py-2`}
                    >
                      {sendingId === sw.switchId ? (
                        <>
                          <Spinner size="sm" /> Sending...
                        </>
                      ) : expired ? (
                        "Expired"
                      ) : (
                        <>
                          <Icons.Heart className="w-4 h-4" /> Heartbeat
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{switches.length}</p>
                <p className="text-xs text-zinc-500">Active Switches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {switches.filter((sw) => isUrgent(sw.heartbeatDeadline)).length}
                </p>
                <p className="text-xs text-zinc-500">Need Attention</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {switches.filter((sw) => isExpired(sw.heartbeatDeadline)).length}
                </p>
                <p className="text-xs text-zinc-500">Expired</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

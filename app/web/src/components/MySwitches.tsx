"use client";

import { FC, useEffect, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";
import {
  Icons,
  CardHeader,
  Badge,
  Spinner,
  EmptyState,
  AddressDisplay,
  Countdown,
  TimeDisplay,
  Modal,
  useToast,
} from "@/components/ui";

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
  const { addToast } = useToast();
  
  const [switches, setSwitches] = useState<SwitchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSwitch, setSelectedSwitch] = useState<SwitchData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

      // Sort: Active first, then by deadline
      switchDataList.sort((a, b) => {
        if (a.status.active && !b.status.active) return -1;
        if (!a.status.active && b.status.active) return 1;
        return a.heartbeatDeadline - b.heartbeatDeadline;
      });

      setSwitches(switchDataList);
    } catch (error: any) {
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

  const cancelSwitch = async (switchData: SwitchData) => {
    if (!publicKey || !program) return;

    setActionLoading(switchData.switchId);
    try {
      const tx = await program.methods.cancelSwitch(switchData.switchId).rpc();

      console.log("Switch canceled:", tx);
      addToast("success", "Switch canceled", "Account has been closed");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error canceling switch:", error);
      addToast("error", "Cancel failed", error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const sendHeartbeat = async (switchId: string) => {
    if (!publicKey || !program) return;

    setActionLoading(switchId);
    try {
      const tx = await program.methods.sendHeartbeat(switchId).rpc();

      console.log("Heartbeat sent:", tx);
      addToast("success", "Heartbeat sent!", "Deadline extended");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error sending heartbeat:", error);
      addToast("error", "Heartbeat failed", error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerDistribution = async (switchData: SwitchData) => {
    if (!program) return;

    setActionLoading(switchData.switchId);
    try {
      // Trigger expiry
      const expiryTx = await program.methods.triggerExpiry(switchData.switchId).rpc();
      console.log("Expiry triggered:", expiryTx);

      // Distribute to beneficiaries
      for (const beneficiary of switchData.beneficiaries) {
        try {
          const distributeTx = await program.methods
            .distributeSol()
            .accounts({ beneficiary: beneficiary.address })
            .rpc();
          console.log("Distribution tx:", distributeTx);
        } catch (distError: any) {
          console.error("Distribution error:", distError);
        }
      }

      addToast("success", "Distribution complete", "Assets sent to beneficiaries");
      await loadSwitches();
    } catch (error: any) {
      console.error("Error in distribution:", error);
      addToast("error", "Distribution failed", error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusInfo = (switchData: SwitchData) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = switchData.heartbeatDeadline - now;

    if (switchData.status.canceled) {
      return { label: "Canceled", variant: "info" as const, icon: Icons.X };
    }
    if (switchData.status.expired || remaining <= 0) {
      return { label: "Expired", variant: "danger" as const, icon: Icons.AlertCircle };
    }
    if (remaining < 86400) {
      return { label: "Urgent", variant: "warning" as const, icon: Icons.Clock };
    }
    return { label: "Active", variant: "success" as const, icon: Icons.Check };
  };

  const isExpired = (switchData: SwitchData) => {
    const now = Math.floor(Date.now() / 1000);
    return switchData.heartbeatDeadline - now <= 0;
  };

  const viewDetails = (switchData: SwitchData) => {
    setSelectedSwitch(switchData);
    setShowDetailsModal(true);
  };

  if (!publicKey) {
    return (
      <div className="card-static p-8">
        <EmptyState
          icon={<Icons.Wallet className="w-8 h-8 text-zinc-500" />}
          title="Wallet not connected"
          description="Connect your wallet to view and manage your switches."
        />
      </div>
    );
  }

  return (
    <div className="card-static p-6 md:p-8">
      <CardHeader
        icon={<Icons.Activity className="w-6 h-6 text-white" />}
        title="My Switches"
        subtitle={switches.length > 0 ? `${switches.length} total` : undefined}
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
          icon={<Icons.Shield className="w-8 h-8 text-zinc-500" />}
          title="No switches found"
          description="Create your first Dead Man's Switch to protect your digital assets."
        />
      ) : (
        <div className="space-y-4">
          {switches.map((switchData, index) => {
            const statusInfo = getStatusInfo(switchData);
            const expired = isExpired(switchData);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={switchData.switchId}
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                      <Icons.Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{switchData.switchId}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          {switchData.beneficiaries.length} beneficiar{switchData.beneficiaries.length === 1 ? "y" : "ies"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => viewDetails(switchData)}
                    className="btn-ghost text-xs"
                  >
                    Details
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                      <Icons.Clock className="w-3.5 h-3.5" />
                      <span>Time Remaining</span>
                    </div>
                    <Countdown deadline={switchData.heartbeatDeadline} className="text-lg font-bold" />
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                      <Icons.Refresh className="w-3.5 h-3.5" />
                      <span>Timeout Period</span>
                    </div>
                    <TimeDisplay seconds={switchData.timeoutSeconds} className="text-lg font-bold text-white" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {switchData.status.active && !expired && (
                    <>
                      <button
                        onClick={() => sendHeartbeat(switchData.switchId)}
                        disabled={actionLoading === switchData.switchId}
                        className="btn-success flex-1"
                      >
                        {actionLoading === switchData.switchId ? (
                          <Spinner size="sm" />
                        ) : (
                          <Icons.Heart className="w-4 h-4" />
                        )}
                        Heartbeat
                      </button>
                      <button
                        onClick={() => cancelSwitch(switchData)}
                        disabled={actionLoading === switchData.switchId}
                        className="btn-danger"
                      >
                        <Icons.X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                  {switchData.status.active && expired && (
                    <button
                      onClick={() => triggerDistribution(switchData)}
                      disabled={actionLoading === switchData.switchId}
                      className="btn-warning flex-1"
                    >
                      {actionLoading === switchData.switchId ? (
                        <Spinner size="sm" />
                      ) : (
                        <Icons.Send className="w-4 h-4" />
                      )}
                      Distribute Funds
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedSwitch?.switchId || "Switch Details"}
        size="lg"
      >
        {selectedSwitch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Status</p>
                <Badge variant={getStatusInfo(selectedSwitch).variant}>
                  {getStatusInfo(selectedSwitch).label}
                </Badge>
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Time Remaining</p>
                <Countdown deadline={selectedSwitch.heartbeatDeadline} />
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Timeout Period</p>
                <TimeDisplay seconds={selectedSwitch.timeoutSeconds} className="font-semibold text-white" />
              </div>
              <div className="p-3 rounded-lg bg-zinc-800/50">
                <p className="text-xs text-zinc-500 mb-1">Beneficiaries</p>
                <p className="font-semibold text-white">{selectedSwitch.beneficiaries.length}</p>
              </div>
            </div>

            <div className="divider" />

            <div>
              <h4 className="font-semibold text-white mb-3">Beneficiaries</h4>
              <div className="space-y-2">
                {selectedSwitch.beneficiaries.map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-semibold">
                        {i + 1}
                      </div>
                      <AddressDisplay address={b.address.toString()} />
                    </div>
                    <Badge variant="purple">{(b.shareBps / 100).toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div className="flex gap-2">
              {selectedSwitch.status.active && !isExpired(selectedSwitch) && (
                <>
                  <button
                    onClick={() => {
                      sendHeartbeat(selectedSwitch.switchId);
                      setShowDetailsModal(false);
                    }}
                    className="btn-success flex-1"
                  >
                    <Icons.Heart className="w-4 h-4" /> Send Heartbeat
                  </button>
                  <button
                    onClick={() => {
                      cancelSwitch(selectedSwitch);
                      setShowDetailsModal(false);
                    }}
                    className="btn-danger"
                  >
                    <Icons.X className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

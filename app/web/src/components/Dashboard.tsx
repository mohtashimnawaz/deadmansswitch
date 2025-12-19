"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";
import {
  Icons,
  StatCard,
  Badge,
  Spinner,
  Countdown,
  AddressDisplay,
  SolAmount,
} from "@/components/ui";

interface SwitchData {
  switchId: string;
  heartbeatDeadline: number;
  timeoutSeconds: number;
  status: any;
  beneficiaryCount: number;
}

export const Dashboard: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  
  const [switches, setSwitches] = useState<SwitchData[]>([]);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!publicKey || !program) return;

    setLoading(true);
    try {
      // Load SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Load switches
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

      const switchList: SwitchData[] = [];
      for (const account of allAccounts) {
        try {
          const decoded = program.coder.accounts.decode("switch", account.account.data);
          switchList.push({
            switchId: decoded.switchId,
            heartbeatDeadline: decoded.heartbeatDeadline.toNumber(),
            timeoutSeconds: decoded.timeoutSeconds.toNumber(),
            status: decoded.status,
            beneficiaryCount: decoded.beneficiaries.length,
          });
        } catch (e) {
          console.log("Failed to decode:", e);
        }
      }

      setSwitches(switchList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection]);

  useEffect(() => {
    if (publicKey && program) {
      loadData();
    }
  }, [publicKey, program, loadData]);

  const activeSwitches = switches.filter((s) => s.status.active);
  const expiredSwitches = switches.filter((s) => {
    const now = Math.floor(Date.now() / 1000);
    return s.status.active && s.heartbeatDeadline - now <= 0;
  });
  const urgentSwitches = switches.filter((s) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = s.heartbeatDeadline - now;
    return s.status.active && remaining > 0 && remaining < 86400;
  });

  const totalBeneficiaries = switches.reduce((acc, s) => acc + s.beneficiaryCount, 0);

  // Get most urgent switch
  const mostUrgent = activeSwitches
    .filter((s) => {
      const now = Math.floor(Date.now() / 1000);
      return s.heartbeatDeadline - now > 0;
    })
    .sort((a, b) => a.heartbeatDeadline - b.heartbeatDeadline)[0];

  if (!publicKey) {
    return (
      <div className="card-static p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Icons.Shield className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Welcome to Dead Man's Switch
          </h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Secure your digital legacy on Solana. Automatically distribute assets 
            to your beneficiaries if you stop sending heartbeats.
          </p>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Icons.Shield className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-zinc-500">Secure</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Icons.Zap className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm text-zinc-500">Fast</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Icons.Users className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-zinc-500">Multi-beneficiary</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card-static p-8">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Switches"
          value={activeSwitches.length}
          icon={<Icons.Shield className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Total Beneficiaries"
          value={totalBeneficiaries}
          icon={<Icons.Users className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Wallet Balance"
          value={`${solBalance.toFixed(2)} SOL`}
          icon={<Icons.Wallet className="w-5 h-5 text-white" />}
        />
        <StatCard
          label="Urgent"
          value={urgentSwitches.length + expiredSwitches.length}
          icon={<Icons.AlertCircle className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Alerts */}
      {(urgentSwitches.length > 0 || expiredSwitches.length > 0) && (
        <div className="space-y-3">
          {expiredSwitches.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Icons.AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-200">
                    {expiredSwitches.length} switch{expiredSwitches.length > 1 ? "es" : ""} expired!
                  </p>
                  <p className="text-sm text-red-200/70">
                    Beneficiaries can now claim the assets
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {urgentSwitches.length > 0 && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center animate-pulse">
                  <Icons.Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-200">
                    {urgentSwitches.length} switch{urgentSwitches.length > 1 ? "es" : ""} need attention
                  </p>
                  <p className="text-sm text-yellow-200/70">
                    Less than 24 hours remaining - send a heartbeat soon
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Deadline */}
        <div className="card-static p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.Clock className="w-5 h-5 text-purple-400" />
            Next Deadline
          </h3>
          {mostUrgent ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{mostUrgent.switchId}</p>
                <Countdown deadline={mostUrgent.heartbeatDeadline} className="text-lg mt-1" />
              </div>
              <Badge variant={
                mostUrgent.heartbeatDeadline - Math.floor(Date.now() / 1000) < 86400 
                  ? "warning" 
                  : "success"
              }>
                {mostUrgent.heartbeatDeadline - Math.floor(Date.now() / 1000) < 86400 
                  ? "Urgent" 
                  : "Active"
                }
              </Badge>
            </div>
          ) : (
            <p className="text-zinc-500">No active deadlines</p>
          )}
        </div>

        {/* Wallet Info */}
        <div className="card-static p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.Wallet className="w-5 h-5 text-purple-400" />
            Connected Wallet
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Address</span>
              <AddressDisplay address={publicKey.toString()} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Balance</span>
              <SolAmount amount={solBalance} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Switches */}
      {switches.length > 0 && (
        <div className="card-static p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.Activity className="w-5 h-5 text-purple-400" />
            Recent Switches
          </h3>
          <div className="space-y-3">
            {switches.slice(0, 3).map((sw) => {
              const now = Math.floor(Date.now() / 1000);
              const remaining = sw.heartbeatDeadline - now;
              const isExpired = remaining <= 0;
              const isUrgent = remaining > 0 && remaining < 86400;

              return (
                <div
                  key={sw.switchId}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      isExpired ? "bg-red-500" : isUrgent ? "bg-yellow-500" : "bg-green-500"
                    }`} />
                    <span className="font-medium text-white">{sw.switchId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Countdown deadline={sw.heartbeatDeadline} className="text-sm" />
                    <Badge variant={isExpired ? "danger" : isUrgent ? "warning" : "success"}>
                      {isExpired ? "Expired" : isUrgent ? "Urgent" : "Active"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

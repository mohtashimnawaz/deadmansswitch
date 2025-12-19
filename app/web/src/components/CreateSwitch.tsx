"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "@/hooks/useProgram";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Icons,
  CardHeader,
  Badge,
  Spinner,
  EmptyState,
  SolAmount,
  AddressDisplay,
  useToast,
} from "@/components/ui";

interface TokenAccount {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol?: string;
}

interface AssetAllocation {
  beneficiary: string;
  assets: Array<{
    type: "SOL" | "TOKEN";
    mint?: string;
    amount: string;
    symbol?: string;
  }>;
}

const TIMEOUT_PRESETS = [
  { label: "1 Hour", value: 3600 },
  { label: "12 Hours", value: 43200 },
  { label: "1 Day", value: 86400 },
  { label: "3 Days", value: 259200 },
  { label: "1 Week", value: 604800 },
  { label: "2 Weeks", value: 1209600 },
  { label: "1 Month", value: 2592000 },
  { label: "Custom", value: -1 },
];

export const CreateSwitch: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();
  const { addToast } = useToast();

  const [switchName, setSwitchName] = useState<string>("");
  const [timeoutPreset, setTimeoutPreset] = useState<number>(86400);
  const [customTimeout, setCustomTimeout] = useState<number>(86400);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Wallet holdings
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);

  // Allocations
  const [allocations, setAllocations] = useState<AssetAllocation[]>([
    { beneficiary: "", assets: [{ type: "SOL", amount: "0" }] },
  ]);

  // Step navigation
  const [step, setStep] = useState(1);

  const actualTimeout = timeoutPreset === -1 ? customTimeout : timeoutPreset;

  const loadWalletAssets = useCallback(async () => {
    if (!publicKey) return;

    setLoadingAssets(true);
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      const tokenAccs = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokens: TokenAccount[] = tokenAccs.value
        .map((acc) => {
          const info = acc.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.amount,
            decimals: info.tokenAmount.decimals,
            uiAmount: info.tokenAmount.uiAmount,
            symbol: info.mint.slice(0, 4) + "...",
          };
        })
        .filter((t) => t.uiAmount > 0);

      setTokenAccounts(tokens);
    } catch (error) {
      console.error("Error loading assets:", error);
      addToast("error", "Failed to load assets", "Please try again");
    } finally {
      setLoadingAssets(false);
    }
  }, [publicKey, connection, addToast]);

  useEffect(() => {
    if (publicKey) {
      loadWalletAssets();
    }
  }, [publicKey, loadWalletAssets]);

  const addBeneficiary = () => {
    setAllocations([
      ...allocations,
      { beneficiary: "", assets: [{ type: "SOL", amount: "0" }] },
    ]);
  };

  const removeBeneficiary = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateBeneficiaryAddress = (index: number, address: string) => {
    const updated = [...allocations];
    updated[index].beneficiary = address;
    setAllocations(updated);
  };

  const addAssetToBeneficiary = (
    beneficiaryIndex: number,
    type: "SOL" | "TOKEN",
    mint?: string,
    symbol?: string
  ) => {
    const updated = [...allocations];
    updated[beneficiaryIndex].assets.push({
      type,
      mint,
      amount: "0",
      symbol,
    });
    setAllocations(updated);
  };

  const updateAssetAmount = (
    beneficiaryIndex: number,
    assetIndex: number,
    amount: string
  ) => {
    const updated = [...allocations];
    updated[beneficiaryIndex].assets[assetIndex].amount = amount;
    setAllocations(updated);
  };

  const removeAsset = (beneficiaryIndex: number, assetIndex: number) => {
    const updated = [...allocations];
    updated[beneficiaryIndex].assets.splice(assetIndex, 1);
    setAllocations(updated);
  };

  const getTotalAllocated = (type: "SOL" | "TOKEN", mint?: string) => {
    return allocations.reduce((total, alloc) => {
      const filtered = alloc.assets.filter(
        (a) => a.type === type && (!mint || a.mint === mint)
      );
      return total + filtered.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);
    }, 0);
  };

  const validateStep1 = () => {
    if (!switchName || switchName.length === 0 || switchName.length > 32) {
      addToast("error", "Invalid name", "Switch name must be 1-32 characters");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (const alloc of allocations) {
      if (!alloc.beneficiary) {
        addToast("error", "Missing address", "All beneficiaries must have an address");
        return false;
      }
      try {
        new PublicKey(alloc.beneficiary);
      } catch {
        addToast("error", "Invalid address", `${alloc.beneficiary.slice(0, 8)}... is not valid`);
        return false;
      }
      if (alloc.assets.length === 0) {
        addToast("error", "No assets", "Each beneficiary needs at least one asset");
        return false;
      }
    }

    const totalSol = getTotalAllocated("SOL");
    if (totalSol > solBalance) {
      addToast("error", "Insufficient SOL", `Allocated ${totalSol} but only have ${solBalance.toFixed(4)}`);
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleCreateSwitch = async () => {
    if (!publicKey || !program) {
      addToast("error", "Wallet not connected", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const sharePerBeneficiary = Math.floor(10000 / allocations.length);

      const beneficiaries = allocations.map((alloc) => ({
        address: new PublicKey(alloc.beneficiary),
        shareBps: sharePerBeneficiary,
      }));

      const tx = await program.methods
        .initializeSwitch(switchName, new BN(actualTimeout), beneficiaries, { sol: {} })
        .rpc();

      console.log("Switch created:", tx);
      addToast("success", "Switch created!", `Transaction: ${tx.slice(0, 8)}...`);

      // Reset form
      setSwitchName("");
      setAllocations([{ beneficiary: "", assets: [{ type: "SOL", amount: "0" }] }]);
      setStep(1);
      await loadWalletAssets();
    } catch (error: any) {
      console.error("Error creating switch:", error);
      addToast("error", "Creation failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="card-static p-8">
        <EmptyState
          icon={<Icons.Wallet className="w-8 h-8 text-zinc-500" />}
          title="Wallet not connected"
          description="Connect your wallet to create a Dead Man's Switch and protect your digital assets."
        />
      </div>
    );
  }

  return (
    <div className="card-static p-6 md:p-8">
      <CardHeader
        icon={<Icons.Shield className="w-6 h-6 text-white" />}
        title="Create New Switch"
        subtitle="Set up your digital legacy protection"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => s < step && setStep(s)}
              disabled={s > step}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                s === step
                  ? "bg-purple-500 text-white"
                  : s < step
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {s < step ? <Icons.Check className="w-5 h-5" /> : s}
            </button>
            {s < 3 && (
              <div className={`w-full h-0.5 mx-2 ${s < step ? "bg-green-500/50" : "bg-zinc-700"}`} style={{ width: "80px" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="label">Switch Name</label>
            <input
              type="text"
              value={switchName}
              onChange={(e) => setSwitchName(e.target.value)}
              className="input"
              placeholder="My Emergency Switch"
              maxLength={32}
            />
            <p className="text-xs text-zinc-500 mt-2">
              A unique identifier for this switch (1-32 characters)
            </p>
          </div>

          <div>
            <label className="label">Timeout Duration</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {TIMEOUT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setTimeoutPreset(preset.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    timeoutPreset === preset.value
                      ? "bg-purple-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {timeoutPreset === -1 && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={customTimeout}
                  onChange={(e) => setCustomTimeout(Number(e.target.value))}
                  className="input"
                  placeholder="Seconds"
                />
                <span className="text-zinc-400 text-sm whitespace-nowrap">
                  = {Math.floor(customTimeout / 86400)}d {Math.floor((customTimeout % 86400) / 3600)}h
                </span>
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              If no heartbeat is sent within this period, assets will be distributed
            </p>
          </div>

          <button onClick={handleNextStep} className="btn-primary w-full">
            Continue <Icons.ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Beneficiaries */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          {/* Wallet Assets Summary */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-400">Your Assets</span>
              <button
                onClick={loadWalletAssets}
                disabled={loadingAssets}
                className="btn-ghost text-xs"
              >
                {loadingAssets ? <Spinner size="sm" /> : <Icons.Refresh className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <SolAmount amount={solBalance} />
              {tokenAccounts.length > 0 && (
                <Badge variant="info">{tokenAccounts.length} tokens</Badge>
              )}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              Allocated: {getTotalAllocated("SOL").toFixed(4)} SOL
            </div>
          </div>

          {/* Beneficiaries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Beneficiaries</label>
              <button onClick={addBeneficiary} className="btn-ghost text-xs">
                <Icons.Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="space-y-4">
              {allocations.map((alloc, allocIndex) => (
                <div key={allocIndex} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-semibold">
                        {allocIndex + 1}
                      </div>
                      <span className="font-medium text-white">Beneficiary {allocIndex + 1}</span>
                    </div>
                    {allocations.length > 1 && (
                      <button
                        onClick={() => removeBeneficiary(allocIndex)}
                        className="btn-danger text-xs px-2 py-1"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={alloc.beneficiary}
                    onChange={(e) => updateBeneficiaryAddress(allocIndex, e.target.value)}
                    className={`input text-sm mb-3 ${!alloc.beneficiary && "input-error"}`}
                    placeholder="Wallet address (e.g., 7xKX...)"
                  />

                  {/* Assets for this beneficiary */}
                  <div className="space-y-2">
                    {alloc.assets.map((asset, assetIndex) => (
                      <div key={assetIndex} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${asset.type === "SOL" ? "sol-icon" : "token-icon"}`}>
                          {asset.type === "SOL" ? "◎" : "T"}
                        </div>
                        <span className="text-sm text-zinc-300 w-16">
                          {asset.type === "SOL" ? "SOL" : asset.symbol}
                        </span>
                        <input
                          type="number"
                          step="0.0001"
                          value={asset.amount}
                          onChange={(e) => updateAssetAmount(allocIndex, assetIndex, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="0.00"
                        />
                        <button
                          onClick={() => removeAsset(allocIndex, assetIndex)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Icons.X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add asset buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {!alloc.assets.some((a) => a.type === "SOL") && (
                      <button
                        onClick={() => addAssetToBeneficiary(allocIndex, "SOL")}
                        className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all font-medium border border-emerald-500/20"
                      >
                        + SOL
                      </button>
                    )}
                    {tokenAccounts.map((token) =>
                      !alloc.assets.some((a) => a.mint === token.mint) ? (
                        <button
                          key={token.mint}
                          onClick={() => addAssetToBeneficiary(allocIndex, "TOKEN", token.mint, token.symbol)}
                          className="text-xs px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all font-medium border border-purple-500/20"
                        >
                          + {token.symbol}
                        </button>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={handleNextStep} className="btn-primary flex-1">
              Continue <Icons.ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
            <h3 className="text-lg font-bold text-white mb-4">Review Your Switch</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium text-white">{switchName}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Timeout</span>
                <span className="font-medium text-white">
                  {Math.floor(actualTimeout / 86400)}d {Math.floor((actualTimeout % 86400) / 3600)}h
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Beneficiaries</span>
                <span className="font-medium text-white">{allocations.length}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-zinc-400">Share per beneficiary</span>
                <span className="font-medium text-white">
                  {(100 / allocations.length).toFixed(1)}%
                </span>
              </div>

              <div className="pt-2">
                <span className="text-zinc-400 text-sm">Beneficiary addresses:</span>
                <div className="mt-2 space-y-2">
                  {allocations.map((alloc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50">
                      <AddressDisplay address={alloc.beneficiary} />
                      <Badge variant="purple">{(100 / allocations.length).toFixed(0)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <Icons.AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">Important</p>
                <p className="text-xs text-yellow-200/70 mt-1">
                  Once created, you must send heartbeats before each timeout period expires. 
                  If you miss a heartbeat, beneficiaries can claim the assets.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary flex-1">
              Back
            </button>
            <button
              onClick={handleCreateSwitch}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Creating...
                </>
              ) : (
                <>
                  <Icons.Shield className="w-5 h-5" /> Create Switch
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

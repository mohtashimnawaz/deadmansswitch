"use client";

import { FC, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "@/hooks/useProgram";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

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

export const CreateSwitchWithAssets: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [timeout, setTimeout] = useState<number>(86400);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  
  // Wallet holdings
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  
  // Allocations
  const [allocations, setAllocations] = useState<AssetAllocation[]>([
    { beneficiary: "", assets: [] }
  ]);

  useEffect(() => {
    if (publicKey) {
      loadWalletAssets();
    }
  }, [publicKey]);

  const loadWalletAssets = async () => {
    if (!publicKey) return;
    
    setLoadingAssets(true);
    try {
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Get token accounts
      const tokenAccs = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokens: TokenAccount[] = tokenAccs.value
        .map((acc) => {
          const info = acc.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.amount,
            decimals: info.tokenAmount.decimals,
            uiAmount: info.tokenAmount.uiAmount,
            symbol: info.mint.slice(0, 4) + "..." // Could fetch metadata
          };
        })
        .filter((t) => t.uiAmount > 0);

      setTokenAccounts(tokens);
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const addBeneficiary = () => {
    setAllocations([...allocations, { beneficiary: "", assets: [] }]);
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
      symbol
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
      return (
        total +
        filtered.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0)
      );
    }, 0);
  };

  const handleCreateSwitch = async () => {
    if (!publicKey || !program) {
      alert("Please connect your wallet");
      return;
    }

    // Validate allocations
    for (const alloc of allocations) {
      if (!alloc.beneficiary) {
        alert("All beneficiaries must have an address");
        return;
      }
      if (alloc.assets.length === 0) {
        alert("Each beneficiary must have at least one asset allocation");
        return;
      }
      try {
        new PublicKey(alloc.beneficiary);
      } catch {
        alert(`Invalid beneficiary address: ${alloc.beneficiary}`);
        return;
      }
    }

    // Check total allocations don't exceed holdings
    const totalSol = getTotalAllocated("SOL");
    if (totalSol > solBalance) {
      alert(`Total SOL allocated (${totalSol}) exceeds balance (${solBalance})`);
      return;
    }

    for (const token of tokenAccounts) {
      const totalToken = getTotalAllocated("TOKEN", token.mint);
      if (totalToken > token.uiAmount) {
        alert(
          `Total ${token.symbol} allocated (${totalToken}) exceeds balance (${token.uiAmount})`
        );
        return;
      }
    }

    setLoading(true);
    try {
      // Use the new initialize_switch_with_assets instruction
      const allocationsForContract = allocations.map((alloc) => ({
        address: new PublicKey(alloc.beneficiary),
        assets: alloc.assets.map((asset) => ({
          assetType:
            asset.type === "SOL"
              ? { sol: {} }
              : { splToken: { mint: new PublicKey(asset.mint!) } },
          amount: new BN(
            parseFloat(asset.amount) *
              (asset.type === "SOL"
                ? LAMPORTS_PER_SOL
                : Math.pow(10, tokenAccounts.find((t) => t.mint === asset.mint)?.decimals || 9))
          ),
        })),
      }));

      const tx = await program.methods
        .initializeSwitchWithAssets(new BN(timeout), allocationsForContract)
        .accountsPartial({
          owner: publicKey,
        })
        .rpc();

      console.log("Switch with asset allocations created:", tx);
      alert("Switch created successfully with asset allocations!");

      // Reset form
      setAllocations([{ beneficiary: "", assets: [] }]);
      await loadWalletAssets(); // Refresh balances
    } catch (error: any) {
      console.error("Error creating switch:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="animated-icon">
            <div className="shield-icon"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create Switch</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Connect your wallet to view assets and create a switch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="animated-icon">
          <div className="shield-icon"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Create Switch with Assets</h2>
      </div>

      {/* Timeout */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <div className="clock-icon" style={{width: '14px', height: '14px', borderWidth: '2px'}}></div>
            <span>Timeout Duration</span>
          </div>
        </label>
        <input
          type="number"
          value={timeout}
          onChange={(e) => setTimeout(Number(e.target.value))}
          className="input-field"
          placeholder="86400"
        />
        <p className="text-sm text-gray-500 mt-2">
          {Math.floor(timeout / 3600)} hours ({Math.floor(timeout / 86400)} days)
        </p>
      </div>

      {/* Wallet Assets */}
      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Your Assets</h3>
          <button
            onClick={loadWalletAssets}
            disabled={loadingAssets}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-100 transition-all"
          >
            {loadingAssets ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div style={{width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #14F195, #9945FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white'}}>S</div>
              <span className="font-medium text-gray-700">SOL</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">{solBalance.toFixed(4)}</div>
              <div className="text-xs text-gray-500">
                Allocated: {getTotalAllocated("SOL").toFixed(4)}
              </div>
            </div>
          </div>

          {tokenAccounts.map((token) => (
            <div
              key={token.mint}
              className="bg-white rounded-lg p-3 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <div style={{width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white'}}>T</div>
                <div>
                  <div className="font-medium text-gray-700">{token.symbol}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {token.mint.slice(0, 8)}...
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{token.uiAmount}</div>
                <div className="text-xs text-gray-500">
                  Allocated: {getTotalAllocated("TOKEN", token.mint)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiaries & Allocations */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            <div className="flex items-center gap-2">
              <div style={{display: 'flex', gap: '2px'}}>
                <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
              </div>
              <span>Beneficiaries & Asset Allocations</span>
            </div>
          </label>
          <button
            onClick={addBeneficiary}
            className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-purple-50 transition-all"
          >
            <span className="text-lg">+</span> Add Beneficiary
          </button>
        </div>

        <div className="space-y-4">
          {allocations.map((alloc, allocIndex) => (
            <div
              key={allocIndex}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-700">
                  Beneficiary {allocIndex + 1}
                </h4>
                {allocations.length > 1 && (
                  <button
                    onClick={() => removeBeneficiary(allocIndex)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              <input
                type="text"
                value={alloc.beneficiary}
                onChange={(e) =>
                  updateBeneficiaryAddress(allocIndex, e.target.value)
                }
                className="input-field mb-3"
                placeholder="Beneficiary wallet address"
              />

              {/* Assets for this beneficiary */}
              <div className="space-y-2 mb-3">
                {alloc.assets.map((asset, assetIndex) => (
                  <div
                    key={assetIndex}
                    className="flex gap-2 items-center bg-white p-2 rounded-lg"
                  >
                    <div style={{width: '20px', height: '20px', borderRadius: '50%', background: asset.type === 'SOL' ? 'linear-gradient(135deg, #14F195, #9945FF)' : 'linear-gradient(135deg, #f59e0b, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'white'}}>
                      {asset.type === "SOL" ? "S" : "T"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                      {asset.type === "SOL" ? "SOL" : asset.symbol}
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      value={asset.amount}
                      onChange={(e) =>
                        updateAssetAmount(allocIndex, assetIndex, e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-400"
                      placeholder="Amount"
                    />
                    <button
                      onClick={() => removeAsset(allocIndex, assetIndex)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Add asset buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => addAssetToBeneficiary(allocIndex, "SOL")}
                  className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all font-medium"
                >
                  + Add SOL
                </button>
                {tokenAccounts.map((token) => (
                  <button
                    key={token.mint}
                    onClick={() =>
                      addAssetToBeneficiary(
                        allocIndex,
                        "TOKEN",
                        token.mint,
                        token.symbol
                      )
                    }
                    className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all font-medium"
                  >
                    + Add {token.symbol}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCreateSwitch}
        disabled={loading || allocations.length === 0}
        className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {loading ? "Creating..." : "Create Switch with Assets"}
      </button>
    </div>
  );
};

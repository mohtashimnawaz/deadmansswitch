"use client";

import { FC, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "@/hooks/useProgram";

export const CreateSwitch: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

  const [switchName, setSwitchName] = useState<string>("");
  const [timeout, setTimeout] = useState<number>(86400); // 24 hours default
  const [beneficiaries, setBeneficiaries] = useState<
    Array<{ address: string; share: number }>
  >([{ address: "", share: 100 }]);
  const [loading, setLoading] = useState(false);

  const addBeneficiary = () => {
    setBeneficiaries([...beneficiaries, { address: "", share: 0 }]);
  };

  const updateBeneficiary = (
    index: number,
    field: "address" | "share",
    value: string | number
  ) => {
    const updated = [...beneficiaries];
    updated[index] = { ...updated[index], [field]: value };
    setBeneficiaries(updated);
  };

  const removeBeneficiary = (index: number) => {
    setBeneficiaries(beneficiaries.filter((_, i) => i !== index));
  };

  const handleCreateSwitch = async () => {
    if (!publicKey || !program) {
      alert("Please connect your wallet");
      return;
    }

    // Validate switch name
    if (!switchName || switchName.length === 0 || switchName.length > 32) {
      alert("Switch name must be 1-32 characters");
      return;
    }

    // Validate beneficiaries
    const totalShare = beneficiaries.reduce((sum, b) => sum + b.share, 0);
    if (totalShare !== 100) {
      alert("Total share must equal 100%");
      return;
    }

    for (const b of beneficiaries) {
      try {
        new PublicKey(b.address);
      } catch {
        alert(`Invalid beneficiary address: ${b.address}`);
        return;
      }
    }

    setLoading(true);
    try {
      const beneficiaryList = beneficiaries.map((b) => ({
        address: new PublicKey(b.address),
        shareBps: b.share * 100, // Convert percentage to basis points
      }));

      const tx = await program.methods
        .initializeSwitch(
          switchName,
          new BN(timeout),
          beneficiaryList,
          { sol: {} } // TokenType::Sol
        )
        .rpc();

      console.log("Switch created:", tx);
      alert("Switch created successfully!");
      setSwitchName("");
    } catch (error: any) {
      console.error("Error creating switch:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalShare = beneficiaries.reduce((sum, b) => sum + b.share, 0);

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="animated-icon">
          <div className="shield-icon"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Create Switch</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <div className="shield-icon" style={{width: '14px', height: '14px', borderWidth: '2px'}}></div>
              <span>Switch Name</span>
            </div>
          </label>
          <input
            type="text"
            value={switchName}
            onChange={(e) => setSwitchName(e.target.value)}
            className="input-field"
            placeholder="My Emergency Switch"
            maxLength={32}
          />
          <p className="text-sm text-gray-500 mt-2">
            Unique name for this switch (1-32 characters)
          </p>
        </div>

        <div>
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

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              <div className="flex items-center gap-2">
                <div style={{display: 'flex', gap: '2px'}}>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                  <div style={{width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%'}}></div>
                </div>
                <span>Beneficiaries</span>
              </div>
            </label>
            <button
              onClick={addBeneficiary}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-purple-50 transition-all"
            >
              <span className="text-lg">+</span> Add
            </button>
          </div>

          <div className="space-y-3">
            {beneficiaries.map((beneficiary, index) => (
              <div key={index} className="flex gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="text"
                  value={beneficiary.address}
                  onChange={(e) =>
                    updateBeneficiary(index, "address", e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Solana wallet address"
                />
                <input
                  type="number"
                  value={beneficiary.share}
                  onChange={(e) =>
                    updateBeneficiary(index, "share", Number(e.target.value))
                  }
                  className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="%"
                />
                {beneficiaries.length > 1 && (
                  <button
                    onClick={() => removeBeneficiary(index)}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={`mt-3 p-3 rounded-lg ${
              totalShare === 100 
                ? "bg-green-50 border border-green-200" 
                : "bg-amber-50 border border-amber-200"
            }`}>
            <p className={`text-sm font-medium ${
                totalShare === 100 ? "text-green-700" : "text-amber-700"
              }`}>
              Total: {totalShare}% {totalShare === 100 ? "" : "(must equal 100%)"}
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateSwitch}
          disabled={loading || !publicKey || totalShare !== 100}
          className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? "Creating..." : "Create Switch"}
        </button>
      </div>
    </div>
  );
};

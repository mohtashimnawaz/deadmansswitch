"use client";

import { FC, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";

export const CreateSwitch: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const program = useProgram();

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
      const [switchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("switch"), publicKey.toBuffer()],
        program.programId
      );

      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), publicKey.toBuffer()],
        program.programId
      );

      const beneficiaryList = beneficiaries.map((b) => ({
        address: new PublicKey(b.address),
        shareBps: b.share * 100, // Convert percentage to basis points
      }));

      const tx = await program.methods
        .initializeSwitch(
          timeout,
          beneficiaryList,
          { sol: {} } // TokenType::Sol
        )
        .accounts({
          switch: switchPda,
          escrow: escrowPda,
          owner: publicKey,
        })
        .rpc();

      console.log("Switch created:", tx);
      alert("Switch created successfully!");
    } catch (error: any) {
      console.error("Error creating switch:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalShare = beneficiaries.reduce((sum, b) => sum + b.share, 0);

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Create Switch</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Timeout (seconds)
          </label>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="86400"
          />
          <p className="text-xs text-gray-400 mt-1">
            {Math.floor(timeout / 3600)} hours
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Beneficiaries
            </label>
            <button
              onClick={addBeneficiary}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              + Add
            </button>
          </div>

          {beneficiaries.map((beneficiary, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={beneficiary.address}
                onChange={(e) =>
                  updateBeneficiary(index, "address", e.target.value)
                }
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="Beneficiary address"
              />
              <input
                type="number"
                value={beneficiary.share}
                onChange={(e) =>
                  updateBeneficiary(index, "share", Number(e.target.value))
                }
                className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="%"
              />
              {beneficiaries.length > 1 && (
                <button
                  onClick={() => removeBeneficiary(index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <p
            className={`text-xs mt-2 ${
              totalShare === 100 ? "text-green-400" : "text-red-400"
            }`}
          >
            Total: {totalShare}% {totalShare === 100 ? "✓" : "(must be 100%)"}
          </p>
        </div>

        <button
          onClick={handleCreateSwitch}
          disabled={loading || !publicKey || totalShare !== 100}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {loading ? "Creating..." : "Create Switch"}
        </button>
      </div>
    </div>
  );
};

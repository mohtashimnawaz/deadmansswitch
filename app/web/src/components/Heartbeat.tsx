"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "@/hooks/useProgram";

export const Heartbeat: FC = () => {
  const { publicKey } = useWallet();
  const program = useProgram();
  const [loading, setLoading] = useState(false);

  const sendHeartbeat = async () => {
    if (!publicKey || !program) {
      alert("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      const [switchPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("switch"), publicKey.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .sendHeartbeat()
        .accounts({
          switch: switchPda,
          owner: publicKey,
        })
        .rpc();

      console.log("Heartbeat sent:", tx);
      alert("Heartbeat sent successfully! ❤️");
    } catch (error: any) {
      console.error("Error sending heartbeat:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl animate-pulse">💓</div>
        <h2 className="text-2xl font-bold text-gray-800">Send Heartbeat</h2>
      </div>
      <p className="text-gray-600 mb-6">
        Prove you're alive and extend your deadline. Keep your switch active!
      </p>

      <button
        onClick={sendHeartbeat}
        disabled={loading || !publicKey}
        className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-xl text-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">❤️</span>
        {loading ? "⏳ Sending..." : "I'm Alive!"}
      </button>
    </div>
  );
};

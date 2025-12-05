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
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Send Heartbeat</h2>
      <p className="text-gray-400 mb-4">
        Send a heartbeat to prove you're alive and extend your deadline.
      </p>

      <button
        onClick={sendHeartbeat}
        disabled={loading || !publicKey}
        className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        <span className="text-2xl">❤️</span>
        {loading ? "Sending..." : "I'm Alive!"}
      </button>
    </div>
  );
};

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../../../target/idl/deadmansswitch.json";
import { Deadmansswitch } from "../../../target/types/deadmansswitch";

const programId = new PublicKey(idl.address);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    return new Program(idl as any, provider) as Program<Deadmansswitch>;
  }, [connection, wallet]);
}

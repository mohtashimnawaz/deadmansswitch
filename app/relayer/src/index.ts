import { PublicKey } from "@solana/web3.js";
import { DeadManSwitchRelayer } from "./relayer";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config();

function main() {
  const config = {
    rpcUrl: process.env.SOLANA_RPC_URL || "http://127.0.0.1:8899",
    keypairPath: process.env.RELAYER_KEYPAIR_PATH || path.resolve(
      process.env.HOME || "~",
      ".config/solana/id.json"
    ),
    programId: new PublicKey(
      process.env.PROGRAM_ID || "BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr"
    ),
    checkInterval: parseInt(process.env.CHECK_INTERVAL_MS || "60000"),
    maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
  };

  console.log("Starting Dead Man's Switch Relayer...");
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`Program ID: ${config.programId.toString()}`);
  console.log(`Check interval: ${config.checkInterval}ms`);

  const relayer = new DeadManSwitchRelayer(config);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down relayer...");
    relayer.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down relayer...");
    relayer.stop();
    process.exit(0);
  });

  // Start the relayer
  relayer.start().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

main();

import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import { createLogger } from "./logger";
import { Deadmansswitch } from "../../target/types/deadmansswitch";

const logger = createLogger();

interface RelayerConfig {
  rpcUrl: string;
  keypairPath: string;
  programId: PublicKey;
  checkInterval: number;
  maxRetries: number;
}

export class DeadManSwitchRelayer {
  private connection: Connection;
  private program: Program<Deadmansswitch>;
  private wallet: Wallet;
  private config: RelayerConfig;
  private isRunning: boolean = false;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, "confirmed");

    // Load keypair
    const keypairData = JSON.parse(
      fs.readFileSync(path.resolve(config.keypairPath), "utf-8")
    );
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    this.wallet = new Wallet(keypair);

    // Setup Anchor provider and program
    const provider = new AnchorProvider(this.connection, this.wallet, {
      commitment: "confirmed",
    });
    anchor.setProvider(provider);

    // Load IDL
    const idlPath = path.resolve(__dirname, "../../../target/idl/deadmansswitch.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    this.program = new Program(idl, provider);

    logger.info(`Relayer initialized with program ID: ${config.programId.toString()}`);
    logger.info(`Relayer wallet: ${this.wallet.publicKey.toString()}`);
  }

  /**
   * Start the relayer monitoring loop
   */
  async start(): Promise<void> {
    this.isRunning = true;
    logger.info("Relayer started. Monitoring switches...");

    while (this.isRunning) {
      try {
        await this.checkAndTriggerExpiredSwitches();
      } catch (error) {
        logger.error("Error in relayer loop:", error);
      }

      // Wait for next interval
      await this.sleep(this.config.checkInterval);
    }
  }

  /**
   * Stop the relayer
   */
  stop(): void {
    this.isRunning = false;
    logger.info("Relayer stopped");
  }

  /**
   * Check all active switches and trigger expiry for expired ones
   */
  private async checkAndTriggerExpiredSwitches(): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    logger.debug(`Checking switches at timestamp: ${currentTime}`);

    try {
      // Fetch all switch accounts
      const switches = await this.program.account.switch.all();
      logger.info(`Found ${switches.length} total switches`);

      let activeCount = 0;
      let expiredCount = 0;
      let triggeredCount = 0;

      for (const switchAccount of switches) {
        const switchData = switchAccount.account;
        const switchPubkey = switchAccount.publicKey;
        const switchId = switchData.switchId;

        // Only process active switches
        if (!this.isActive(switchData.status)) {
          continue;
        }

        activeCount++;

        // Check if deadline has passed
        const deadline = switchData.heartbeatDeadline.toNumber();
        if (currentTime > deadline) {
          logger.info(
            `Switch ${switchPubkey.toString()} (${switchId}) expired. Deadline: ${deadline}, Current: ${currentTime}`
          );
          expiredCount++;

          // Trigger expiry
          const success = await this.triggerExpiry(switchPubkey, switchId);
          if (success) {
            triggeredCount++;
            
            // Distribute funds to all beneficiaries
            await this.distributeFunds(switchPubkey, switchData, switchId);
          }
        } else {
          const timeRemaining = deadline - currentTime;
          logger.debug(
            `Switch ${switchPubkey.toString()} (${switchId}) active. Time remaining: ${timeRemaining}s`
          );
        }
      }

      logger.info(
        `Scan complete: ${activeCount} active, ${expiredCount} expired, ${triggeredCount} triggered`
      );
    } catch (error) {
      logger.error("Error checking switches:", error);
    }
  }

  /**
   * Trigger expiry for a switch
   */
  private async triggerExpiry(switchPubkey: PublicKey, switchId: string): Promise<boolean> {
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        logger.info(`Triggering expiry for switch: ${switchPubkey.toString()} (${switchId})`);

        const tx = await this.program.methods
          .triggerExpiry(switchId)
          .accounts({
            switch: switchPubkey,
          })
          .rpc();

        logger.info(`Expiry triggered successfully. Tx: ${tx}`);
        return true;
      } catch (error: any) {
        retries++;
        logger.error(
          `Failed to trigger expiry (attempt ${retries}/${this.config.maxRetries}):`,
          error.message
        );

        if (retries < this.config.maxRetries) {
          await this.sleep(2000 * retries); // Exponential backoff
        }
      }
    }

    return false;
  }

  /**
   * Distribute funds to all beneficiaries
   */
  private async distributeFunds(switchPubkey: PublicKey, switchData: any, switchId: string): Promise<void> {
    const tokenType = switchData.tokenType;
    const beneficiaries = switchData.beneficiaries;

    logger.info(`Distributing funds to ${beneficiaries.length} beneficiaries for switch ${switchId}`);

    for (const beneficiary of beneficiaries) {
      try {
        if (this.isSolTokenType(tokenType)) {
          await this.distributeSol(switchPubkey, switchData, beneficiary.address, switchId);
        } else {
          await this.distributeSpl(switchPubkey, switchData, beneficiary.address, switchId);
        }
      } catch (error: any) {
        logger.error(
          `Failed to distribute to beneficiary ${beneficiary.address.toString()}:`,
          error.message
        );
      }
    }
  }

  /**
   * Distribute SOL to a beneficiary
   */
  private async distributeSol(
    switchPubkey: PublicKey,
    switchData: any,
    beneficiaryPubkey: PublicKey,
    switchId: string
  ): Promise<void> {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), switchData.owner.toBuffer(), Buffer.from(switchId)],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .distributeSol()
        .accounts({
          switch: switchPubkey,
          escrow: escrow,
          beneficiary: beneficiaryPubkey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      logger.info(`SOL distributed to ${beneficiaryPubkey.toString()}. Tx: ${tx}`);
    } catch (error: any) {
      // Check if already distributed or insufficient funds
      if (error.message.includes("InsufficientFunds")) {
        logger.warn("No more funds to distribute");
      } else {
        throw error;
      }
    }
  }

  /**
   * Distribute SPL tokens to a beneficiary
   */
  private async distributeSpl(
    switchPubkey: PublicKey,
    switchData: any,
    beneficiaryPubkey: PublicKey,
    switchId: string
  ): Promise<void> {
    // This would require additional token account lookups
    // Implementation depends on your token account structure
    logger.warn("SPL distribution not yet implemented in relayer");
  }

  /**
   * Helper methods
   */
  private isActive(status: any): boolean {
    return status.active !== undefined;
  }

  private isSolTokenType(tokenType: any): boolean {
    return tokenType.sol !== undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

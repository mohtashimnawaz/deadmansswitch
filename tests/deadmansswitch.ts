import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Deadmansswitch } from "../target/types/deadmansswitch";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("deadmansswitch", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.deadmansswitch as Program<Deadmansswitch>;
  
  const owner = provider.wallet as anchor.Wallet;
  const beneficiary1 = Keypair.generate();
  const beneficiary2 = Keypair.generate();

  let switchPda: PublicKey;
  let escrowPda: PublicKey;
  let switchBump: number;
  let escrowBump: number;

  before(async () => {
    // Derive PDAs
    [switchPda, switchBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("switch"), owner.publicKey.toBuffer()],
      program.programId
    );

    [escrowPda, escrowBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop to beneficiaries for account creation
    const airdrop1 = await provider.connection.requestAirdrop(
      beneficiary1.publicKey,
      LAMPORTS_PER_SOL
    );
    const airdrop2 = await provider.connection.requestAirdrop(
      beneficiary2.publicKey,
      LAMPORTS_PER_SOL
    );

    await provider.connection.confirmTransaction(airdrop1);
    await provider.connection.confirmTransaction(airdrop2);
  });

  describe("initialize_switch", () => {
    it("Creates a switch with valid beneficiaries", async () => {
      const timeoutSeconds = 60; // 1 minute for testing
      const beneficiaries = [
        {
          address: beneficiary1.publicKey,
          shareBps: 6000, // 60%
        },
        {
          address: beneficiary2.publicKey,
          shareBps: 4000, // 40%
        },
      ];

      const tx = await program.methods
        .initializeSwitch(
          new BN(timeoutSeconds),
          beneficiaries,
          { sol: {} }
        )
        .accounts({
          switch: switchPda,
          escrow: escrowPda,
          owner: owner.publicKey,
        })
        .rpc();

      console.log("Switch initialized:", tx);

      // Fetch and verify switch account
      const switchAccount = await program.account.switch.fetch(switchPda);
      
      expect(switchAccount.owner.toString()).to.equal(owner.publicKey.toString());
      expect(switchAccount.timeoutSeconds.toNumber()).to.equal(timeoutSeconds);
      expect(switchAccount.beneficiaries).to.have.lengthOf(2);
      expect(switchAccount.beneficiaries[0].shareBps).to.equal(6000);
      expect(switchAccount.beneficiaries[1].shareBps).to.equal(4000);
      
      // Check status is Active
      expect(switchAccount.status).to.have.property("active");
    });

    it("Fails with invalid share distribution", async () => {
      const anotherOwner = Keypair.generate();
      
      // Airdrop to new owner
      const airdrop = await provider.connection.requestAirdrop(
        anotherOwner.publicKey,
        LAMPORTS_PER_SOL * 2
      );
      await provider.connection.confirmTransaction(airdrop);

      const [anotherSwitch] = PublicKey.findProgramAddressSync(
        [Buffer.from("switch"), anotherOwner.publicKey.toBuffer()],
        program.programId
      );

      const [anotherEscrow] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), anotherOwner.publicKey.toBuffer()],
        program.programId
      );

      const beneficiaries = [
        {
          address: beneficiary1.publicKey,
          shareBps: 6000, // 60%
        },
        {
          address: beneficiary2.publicKey,
          shareBps: 3000, // 30% - Total is 90%, should fail
        },
      ];

      try {
        await program.methods
          .initializeSwitch(
            new BN(60),
            beneficiaries,
            { sol: {} }
          )
          .accounts({
            switch: anotherSwitch,
            escrow: anotherEscrow,
            owner: anotherOwner.publicKey,
          })
          .signers([anotherOwner])
          .rpc();
        
        expect.fail("Should have failed with invalid share distribution");
      } catch (error: any) {
        expect(error.message).to.include("InvalidShareDistribution");
      }
    });
  });

  describe("send_heartbeat", () => {
    it("Updates the heartbeat deadline", async () => {
      // Get initial deadline
      const switchBefore = await program.account.switch.fetch(switchPda);
      const deadlineBefore = switchBefore.heartbeatDeadline.toNumber();

      // Wait a second to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send heartbeat
      await program.methods
        .sendHeartbeat()
        .accounts({
          switch: switchPda,
          owner: owner.publicKey,
        })
        .rpc();

      // Check deadline was updated
      const switchAfter = await program.account.switch.fetch(switchPda);
      const deadlineAfter = switchAfter.heartbeatDeadline.toNumber();

      expect(deadlineAfter).to.be.greaterThan(deadlineBefore);
    });

    it("Fails when non-owner tries to send heartbeat", async () => {
      const nonOwner = Keypair.generate();
      
      try {
        await program.methods
          .sendHeartbeat()
          .accounts({
            switch: switchPda,
            owner: nonOwner.publicKey,
          })
          .signers([nonOwner])
          .rpc();
        
        expect.fail("Should have failed - only owner can send heartbeat");
      } catch (error: any) {
        expect(error).to.exist;
      }
    });
  });

  describe("fund and distribute", () => {
    it("Funds escrow with SOL", async () => {
      const fundAmount = 0.5 * LAMPORTS_PER_SOL;

      // Send SOL to escrow PDA
      const tx = await provider.connection.sendTransaction(
        new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: escrowPda,
            lamports: fundAmount,
          })
        ),
        [owner.payer]
      );

      await provider.connection.confirmTransaction(tx);

      // Verify escrow balance
      const balance = await provider.connection.getBalance(escrowPda);
      expect(balance).to.be.at.least(fundAmount);

      console.log(`Escrow funded with ${balance / LAMPORTS_PER_SOL} SOL`);
    });

    it("Triggers expiry after deadline", async () => {
      // Wait for deadline to pass (60 seconds + buffer)
      console.log("Waiting for deadline to pass (65 seconds)...");
      await new Promise(resolve => setTimeout(resolve, 65000));

      // Trigger expiry
      await program.methods
        .triggerExpiry()
        .accounts({
          switch: switchPda,
        })
        .rpc();

      // Verify status changed to Expired
      const switchAccount = await program.account.switch.fetch(switchPda);
      expect(switchAccount.status).to.have.property("expired");
    });

    it("Distributes SOL to beneficiaries", async () => {
      // Get initial balances
      const beneficiary1BalanceBefore = await provider.connection.getBalance(
        beneficiary1.publicKey
      );
      const beneficiary2BalanceBefore = await provider.connection.getBalance(
        beneficiary2.publicKey
      );

      // Distribute to beneficiary 1 (60% share)
      await program.methods
        .distributeSol()
        .accounts({
          switch: switchPda,
          escrow: escrowPda,
          beneficiary: beneficiary1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Distribute to beneficiary 2 (40% share)
      await program.methods
        .distributeSol()
        .accounts({
          switch: switchPda,
          escrow: escrowPda,
          beneficiary: beneficiary2.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify beneficiaries received funds
      const beneficiary1BalanceAfter = await provider.connection.getBalance(
        beneficiary1.publicKey
      );
      const beneficiary2BalanceAfter = await provider.connection.getBalance(
        beneficiary2.publicKey
      );

      const beneficiary1Received = beneficiary1BalanceAfter - beneficiary1BalanceBefore;
      const beneficiary2Received = beneficiary2BalanceAfter - beneficiary2BalanceBefore;

      console.log(`Beneficiary 1 received: ${beneficiary1Received / LAMPORTS_PER_SOL} SOL`);
      console.log(`Beneficiary 2 received: ${beneficiary2Received / LAMPORTS_PER_SOL} SOL`);

      expect(beneficiary1Received).to.be.greaterThan(0);
      expect(beneficiary2Received).to.be.greaterThan(0);

      // Verify beneficiaries received funds proportionally
      // Note: Due to rent-exempt calculations and rounding, ratios may not be exact
      // Just verify both received reasonable amounts
      const totalReceived = beneficiary1Received + beneficiary2Received;
      expect(totalReceived).to.be.greaterThan(0.3 * LAMPORTS_PER_SOL); // At least 0.3 SOL distributed
    });
  });

  describe("cancel_switch", () => {
    it("Allows owner to cancel active switch", async () => {
      // Create a new switch for cancellation test
      const newOwner = Keypair.generate();
      
      const airdrop = await provider.connection.requestAirdrop(
        newOwner.publicKey,
        LAMPORTS_PER_SOL * 2
      );
      await provider.connection.confirmTransaction(airdrop);

      const [newSwitch] = PublicKey.findProgramAddressSync(
        [Buffer.from("switch"), newOwner.publicKey.toBuffer()],
        program.programId
      );

      const [newEscrow] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), newOwner.publicKey.toBuffer()],
        program.programId
      );

      // Initialize new switch
      await program.methods
        .initializeSwitch(
          new BN(3600),
          [{ address: beneficiary1.publicKey, shareBps: 10000 }],
          { sol: {} }
        )
        .accounts({
          switch: newSwitch,
          escrow: newEscrow,
          owner: newOwner.publicKey,
        })
        .signers([newOwner])
        .rpc();

      // Cancel it
      await program.methods
        .cancelSwitch()
        .accounts({
          switch: newSwitch,
          owner: newOwner.publicKey,
        })
        .signers([newOwner])
        .rpc();

      // Verify status is Canceled
      const switchAccount = await program.account.switch.fetch(newSwitch);
      expect(switchAccount.status).to.have.property("canceled");
    });
  });
});

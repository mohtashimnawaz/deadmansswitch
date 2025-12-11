use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::system_program::{transfer, Transfer as SystemTransfer};

declare_id!("BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr");

const MAX_BENEFICIARIES: usize = 10;
const BASIS_POINTS_TOTAL: u16 = 10000; // 100.00%
const MAX_SWITCH_ID_LEN: usize = 32;

#[program]
pub mod deadmansswitch {
    use super::*;

    /// Initialize a new Dead Man's Switch with a unique ID
    pub fn initialize_switch(
        ctx: Context<InitializeSwitch>,
        switch_id: String,
        timeout_seconds: i64,
        beneficiaries: Vec<Beneficiary>,
        token_type: TokenType,
    ) -> Result<()> {
        require!(
            switch_id.len() > 0 && switch_id.len() <= MAX_SWITCH_ID_LEN,
            ErrorCode::InvalidSwitchId
        );
        
        require!(
            beneficiaries.len() > 0 && beneficiaries.len() <= MAX_BENEFICIARIES,
            ErrorCode::InvalidBeneficiaryCount
        );

        // Validate shares sum to 10000 basis points (100%)
        let total_shares: u16 = beneficiaries.iter().map(|b| b.share_bps).sum();
        require!(
            total_shares == BASIS_POINTS_TOTAL,
            ErrorCode::InvalidShareDistribution
        );

        require!(timeout_seconds > 0, ErrorCode::InvalidTimeout);

        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;

        switch.owner = ctx.accounts.owner.key();
        switch.switch_id = switch_id.clone();
        switch.beneficiaries = beneficiaries;
        switch.token_type = token_type;
        switch.timeout_seconds = timeout_seconds;
        switch.heartbeat_deadline = clock.unix_timestamp + timeout_seconds;
        switch.status = SwitchStatus::Active;
        switch.bump = ctx.bumps.switch;

        msg!(
            "Switch '{}' initialized. Deadline: {}",
            switch_id,
            switch.heartbeat_deadline
        );

        Ok(())
    }

    /// Initialize a switch with specific asset allocations (enhanced version)
    pub fn initialize_switch_with_assets(
        ctx: Context<InitializeSwitch>,
        switch_id: String,
        timeout_seconds: i64,
        allocations: Vec<BeneficiaryAllocation>,
    ) -> Result<()> {
        require!(
            switch_id.len() > 0 && switch_id.len() <= MAX_SWITCH_ID_LEN,
            ErrorCode::InvalidSwitchId
        );
        
        require!(
            allocations.len() > 0 && allocations.len() <= MAX_BENEFICIARIES,
            ErrorCode::InvalidBeneficiaryCount
        );

        require!(timeout_seconds > 0, ErrorCode::InvalidTimeout);

        // Validate each beneficiary has at least one asset
        for allocation in allocations.iter() {
            require!(
                allocation.assets.len() > 0,
                ErrorCode::InvalidAssetAllocation
            );
        }

        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;

        switch.owner = ctx.accounts.owner.key();
        switch.switch_id = switch_id.clone();
        // Convert allocations to simple beneficiaries for backward compatibility
        switch.beneficiaries = allocations.iter().map(|a| Beneficiary {
            address: a.address,
            share_bps: 0, // Not used in asset-based allocation
        }).collect();
        switch.token_type = TokenType::Sol; // Default, actual types stored in allocations
        switch.timeout_seconds = timeout_seconds;
        switch.heartbeat_deadline = clock.unix_timestamp + timeout_seconds;
        switch.status = SwitchStatus::Active;
        switch.bump = ctx.bumps.switch;

        msg!(
            "Switch '{}' with asset allocations initialized. {} beneficiaries. Deadline: {}",
            switch_id,
            allocations.len(),
            switch.heartbeat_deadline
        );

        Ok(())
    }

    /// Send a heartbeat to extend the deadline
    pub fn send_heartbeat(ctx: Context<SendHeartbeat>, _switch_id: String) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;

        require!(
            switch.status == SwitchStatus::Active,
            ErrorCode::SwitchNotActive
        );

        // Check if deadline has already passed - if so, mark as expired and reject heartbeat
        require!(
            clock.unix_timestamp <= switch.heartbeat_deadline,
            ErrorCode::SwitchAlreadyExpired
        );

        // Update deadline only if switch is still active and not expired
        switch.heartbeat_deadline = clock.unix_timestamp + switch.timeout_seconds;

        msg!("Heartbeat received. New deadline: {}", switch.heartbeat_deadline);

        Ok(())
    }

    /// Trigger expiry and distribute funds to beneficiaries
    pub fn trigger_expiry(ctx: Context<TriggerExpiry>, _switch_id: String) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let clock = Clock::get()?;

        require!(
            switch.status == SwitchStatus::Active,
            ErrorCode::SwitchNotActive
        );

        require!(
            clock.unix_timestamp > switch.heartbeat_deadline,
            ErrorCode::DeadlineNotPassed
        );

        // Mark as expired first to prevent re-entrancy
        switch.status = SwitchStatus::Expired;

        msg!("Switch expired. Distributing funds to beneficiaries.");

        Ok(())
    }

    /// Distribute SOL from escrow to beneficiaries
    pub fn distribute_sol(ctx: Context<DistributeSol>) -> Result<()> {
        let switch = &ctx.accounts.switch;

        require!(
            switch.status == SwitchStatus::Expired,
            ErrorCode::SwitchNotExpired
        );

        require!(
            matches!(switch.token_type, TokenType::Sol),
            ErrorCode::InvalidTokenType
        );

        let escrow_balance = ctx.accounts.escrow.lamports();
        let rent_exempt = Rent::get()?.minimum_balance(ctx.accounts.escrow.data_len());
        let distributable = escrow_balance.saturating_sub(rent_exempt);

        require!(distributable > 0, ErrorCode::InsufficientFunds);

        // Find the beneficiary for this transaction
        let beneficiary_pubkey = ctx.accounts.beneficiary.key();
        let beneficiary_info = switch
            .beneficiaries
            .iter()
            .find(|b| b.address == beneficiary_pubkey)
            .ok_or(ErrorCode::BeneficiaryNotFound)?;

        let amount = (distributable as u128)
            .checked_mul(beneficiary_info.share_bps as u128)
            .unwrap()
            .checked_div(BASIS_POINTS_TOTAL as u128)
            .unwrap() as u64;

        // Transfer from escrow PDA to beneficiary
        let owner_key = switch.owner;
        let seeds = &[
            b"escrow",
            owner_key.as_ref(),
            &[switch.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            SystemTransfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.beneficiary.to_account_info(),
            },
            signer_seeds,
        );

        transfer(cpi_context, amount)?;

        msg!(
            "Distributed {} lamports to beneficiary {}",
            amount,
            beneficiary_pubkey
        );

        Ok(())
    }

    /// Distribute specific asset amount to beneficiary (enhanced version)
    pub fn distribute_asset(
        ctx: Context<DistributeAsset>,
        amount: u64,
        asset_type: AssetType,
    ) -> Result<()> {
        let switch = &ctx.accounts.switch;

        require!(
            switch.status == SwitchStatus::Expired,
            ErrorCode::SwitchNotExpired
        );

        // Verify beneficiary is in the list
        let beneficiary_pubkey = ctx.accounts.beneficiary.key();
        require!(
            switch.beneficiaries.iter().any(|b| b.address == beneficiary_pubkey),
            ErrorCode::BeneficiaryNotFound
        );

        match asset_type {
            AssetType::Sol => {
                // Transfer SOL
                let owner_key = switch.owner;
                let seeds = &[
                    b"escrow",
                    owner_key.as_ref(),
                    &[switch.bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_context = CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    SystemTransfer {
                        from: ctx.accounts.escrow.to_account_info(),
                        to: ctx.accounts.beneficiary.to_account_info(),
                    },
                    signer_seeds,
                );

                transfer(cpi_context, amount)?;
                msg!("Distributed {} lamports (SOL) to {}", amount, beneficiary_pubkey);
            }
            AssetType::SplToken { mint } => {
                // Transfer SPL tokens
                let owner_key = switch.owner;
                let seeds = &[
                    b"escrow",
                    owner_key.as_ref(),
                    &[switch.bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_accounts = Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.beneficiary_token_account.to_account_info(),
                    authority: ctx.accounts.escrow.to_account_info(),
                };

                let cpi_program = ctx.accounts.token_program.to_account_info();
                let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

                token::transfer(cpi_ctx, amount)?;
                msg!("Distributed {} tokens ({}) to {}", amount, mint, beneficiary_pubkey);
            }
        }

        Ok(())
    }

    /// Distribute SPL tokens from escrow to beneficiaries
    pub fn distribute_spl(ctx: Context<DistributeSpl>) -> Result<()> {
        let switch = &ctx.accounts.switch;

        require!(
            switch.status == SwitchStatus::Expired,
            ErrorCode::SwitchNotExpired
        );

        require!(
            matches!(switch.token_type, TokenType::Spl { .. }),
            ErrorCode::InvalidTokenType
        );

        let escrow_balance = ctx.accounts.escrow_token_account.amount;
        require!(escrow_balance > 0, ErrorCode::InsufficientFunds);

        // Find the beneficiary for this transaction
        let beneficiary_pubkey = ctx.accounts.beneficiary.key();
        let beneficiary_info = switch
            .beneficiaries
            .iter()
            .find(|b| b.address == beneficiary_pubkey)
            .ok_or(ErrorCode::BeneficiaryNotFound)?;

        let amount = (escrow_balance as u128)
            .checked_mul(beneficiary_info.share_bps as u128)
            .unwrap()
            .checked_div(BASIS_POINTS_TOTAL as u128)
            .unwrap() as u64;

        // Transfer from escrow token account to beneficiary token account
        let owner_key = switch.owner;
        let seeds = &[
            b"escrow",
            owner_key.as_ref(),
            &[switch.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.beneficiary_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, amount)?;

        msg!(
            "Distributed {} tokens to beneficiary {}",
            amount,
            beneficiary_pubkey
        );

        Ok(())
    }

    /// Cancel the switch and return funds to owner
    pub fn cancel_switch(ctx: Context<CancelSwitch>, switch_id: String) -> Result<()> {
        let switch = &mut ctx.accounts.switch;

        require!(
            switch.status == SwitchStatus::Active,
            ErrorCode::SwitchNotActive
        );

        switch.status = SwitchStatus::Canceled;

        msg!("Switch '{}' canceled by owner", switch_id);

        Ok(())
    }

    /// Withdraw SOL after cancellation
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, switch_id: String) -> Result<()> {
        let switch = &ctx.accounts.switch;

        require!(
            switch.status == SwitchStatus::Canceled,
            ErrorCode::SwitchNotCanceled
        );

        let escrow_balance = ctx.accounts.escrow.lamports();
        let rent_exempt = Rent::get()?.minimum_balance(ctx.accounts.escrow.data_len());
        let withdrawable = escrow_balance.saturating_sub(rent_exempt);

        require!(withdrawable > 0, ErrorCode::InsufficientFunds);

        let owner_key = switch.owner;
        let switch_id_bytes = switch_id.as_bytes();
        let escrow_bump = ctx.bumps.escrow;
        let seeds = &[
            b"escrow",
            owner_key.as_ref(),
            switch_id_bytes,
            &[escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            SystemTransfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.owner.to_account_info(),
            },
            signer_seeds,
        );

        transfer(cpi_context, withdrawable)?;

        msg!("Withdrawn {} lamports to owner", withdrawable);

        Ok(())
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[derive(Accounts)]
#[instruction(switch_id: String)]
pub struct InitializeSwitch<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Switch::INIT_SPACE,
        seeds = [b"switch", owner.key().as_ref(), switch_id.as_bytes()],
        bump
    )]
    pub switch: Account<'info, Switch>,
    
    /// CHECK: PDA for holding escrow funds
    #[account(
        seeds = [b"escrow", owner.key().as_ref(), switch_id.as_bytes()],
        bump
    )]
    pub escrow: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(switch_id: String)]
pub struct SendHeartbeat<'info> {
    #[account(
        mut,
        seeds = [b"switch", owner.key().as_ref(), switch_id.as_bytes()],
        bump = switch.bump,
        has_one = owner
    )]
    pub switch: Account<'info, Switch>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(switch_id: String)]
pub struct TriggerExpiry<'info> {
    #[account(
        mut,
        seeds = [b"switch", switch.owner.as_ref(), switch_id.as_bytes()],
        bump = switch.bump
    )]
    pub switch: Account<'info, Switch>,
}

#[derive(Accounts)]
pub struct DistributeSol<'info> {
    #[account(
        seeds = [b"switch", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump = switch.bump
    )]
    pub switch: Account<'info, Switch>,
    
    #[account(
        mut,
        seeds = [b"escrow", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump
    )]
    /// CHECK: PDA escrow account
    pub escrow: UncheckedAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Beneficiary receiving funds
    pub beneficiary: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeSpl<'info> {
    #[account(
        seeds = [b"switch", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump = switch.bump
    )]
    pub switch: Account<'info, Switch>,
    
    #[account(
        seeds = [b"escrow", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump
    )]
    /// CHECK: PDA escrow account
    pub escrow: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Beneficiary receiving funds
    pub beneficiary: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub beneficiary_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeAsset<'info> {
    #[account(
        seeds = [b"switch", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump = switch.bump
    )]
    pub switch: Account<'info, Switch>,
    
    #[account(
        mut,
        seeds = [b"escrow", switch.owner.as_ref(), switch.switch_id.as_bytes()],
        bump
    )]
    /// CHECK: PDA escrow account
    pub escrow: UncheckedAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Optional token account for escrow (for SPL transfers)
    pub escrow_token_account: UncheckedAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Beneficiary receiving funds
    pub beneficiary: UncheckedAccount<'info>,
    
    #[account(mut)]
    /// CHECK: Optional token account for beneficiary (for SPL transfers)
    pub beneficiary_token_account: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(switch_id: String)]
pub struct CancelSwitch<'info> {
    #[account(
        mut,
        close = owner,
        seeds = [b"switch", owner.key().as_ref(), switch_id.as_bytes()],
        bump = switch.bump,
        has_one = owner
    )]
    pub switch: Account<'info, Switch>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(switch_id: String)]
pub struct WithdrawSol<'info> {
    #[account(
        seeds = [b"switch", owner.key().as_ref(), switch_id.as_bytes()],
        bump = switch.bump,
        has_one = owner
    )]
    pub switch: Account<'info, Switch>,
    
    #[account(
        mut,
        seeds = [b"escrow", owner.key().as_ref(), switch_id.as_bytes()],
        bump
    )]
    /// CHECK: PDA escrow account
    pub escrow: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Switch {
    pub owner: Pubkey,                              // 32
    #[max_len(MAX_SWITCH_ID_LEN)]
    pub switch_id: String,                          // 4 + 32 = 36
    #[max_len(MAX_BENEFICIARIES)]
    pub beneficiaries: Vec<Beneficiary>,            // 4 + (10 * 34) = 344
    pub token_type: TokenType,                      // 1 + 32 = 33
    pub timeout_seconds: i64,                       // 8
    pub heartbeat_deadline: i64,                    // 8
    pub status: SwitchStatus,                       // 1
    pub bump: u8,                                   // 1
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Beneficiary {
    pub address: Pubkey,        // 32
    pub share_bps: u16,         // 2 (basis points, e.g., 5000 = 50%)
}

// Enhanced beneficiary with specific asset allocations
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct BeneficiaryAllocation {
    pub address: Pubkey,                        // 32
    #[max_len(5)]
    pub assets: Vec<AssetAllocation>,          // 4 + (5 * 41) = 209
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct AssetAllocation {
    pub asset_type: AssetType,                 // 1 + 32 = 33
    pub amount: u64,                           // 8 (lamports or token amount)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum TokenType {
    Sol,
    Spl { mint: Pubkey },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum AssetType {
    Sol,
    SplToken { mint: Pubkey },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum SwitchStatus {
    Active,
    Expired,
    Canceled,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid switch ID (1-32 characters allowed)")]
    InvalidSwitchId,
    
    #[msg("Invalid number of beneficiaries (1-10 allowed)")]
    InvalidBeneficiaryCount,
    
    #[msg("Beneficiary shares must sum to 10000 basis points (100%)")]
    InvalidShareDistribution,
    
    #[msg("Timeout must be positive")]
    InvalidTimeout,
    
    #[msg("Switch is not active")]
    SwitchNotActive,
    
    #[msg("Deadline has not passed yet")]
    DeadlineNotPassed,
    
    #[msg("Switch has not expired")]
    SwitchNotExpired,
    
    #[msg("Switch has not been canceled")]
    SwitchNotCanceled,
    
    #[msg("Switch has already expired - heartbeat rejected")]
    SwitchAlreadyExpired,
    
    #[msg("Invalid token type for this operation")]
    InvalidTokenType,
    
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
    
    #[msg("Beneficiary not found")]
    BeneficiaryNotFound,
    
    #[msg("Invalid asset allocation - beneficiary must have at least one asset")]
    InvalidAssetAllocation,
}

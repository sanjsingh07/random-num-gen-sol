use anchor_lang::prelude::*;
use switchboard_on_demand::accounts::RandomnessAccountData;
// use switchboard_solana::accounts::RandomnessAccountData;

declare_id!("BuTi7S9im4n85wxH5LixDNxcp13ywzM2jTPmfVRVdN9q");

#[program]
pub mod random_number_gen {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let contract_state = &mut ctx.accounts.contract_state;
        contract_state.last_random_number = 0; // place holder default
        contract_state.current_random_number = 0; // place holder default
        contract_state.bump = ctx.bumps.contract_state;

        Ok(())
    }

    pub fn gen_random_number(ctx: Context<GenRandomNum>, max_range: u8) -> Result<()> {
        let clock: Clock = Clock::get()?;
        let contract_state = &mut ctx.accounts.contract_state;
        // call the switchboard on-demand parse function to get the randomness data
        let randomness_data =
            RandomnessAccountData::parse(ctx.accounts.randomness_account_data.data.borrow())
                .unwrap();
        // call the switchboard on-demand get_value function to get the revealed random value
        let revealed_random_value = randomness_data
            .get_value(&clock)
            .map_err(|_| ErrorCode::RandomnessNotResolved)?;

        // Use the revealed random value to determine the gen-random-num
        let randomness_result = revealed_random_value[0] % max_range + 1; // +1 to make max_range inclusive in case revealed_random_value[0] comes out 0

        msg!("random number is {}:", randomness_result);

        contract_state.last_random_number = contract_state.current_random_number;
        contract_state.current_random_number = randomness_result;
        Ok(())
    }
}

// === Errors ===
#[error_code]
pub enum ErrorCode {
    RandomnessAlreadyRevealed,
    RandomnessNotResolved,
}

// === Accounts ===
#[account]
pub struct ContractState {
    last_random_number: u8, // Stores the result of the latest flip
    // randomness_account: Pubkey, // Reference to the Switchboard randomness account
    current_random_number: u8, // The current guess
    bump: u8,
}

// === Instructions ===
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
        payer = user,
        seeds = [b"contract-state".as_ref(), user.key().as_ref()],
        space = 8 + 100,
        bump)]
    pub contract_state: Account<'info, ContractState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GenRandomNum<'info> {
    #[account(mut,
        seeds = [b"contract-state".as_ref(), user.key().as_ref()],
        bump = contract_state.bump)]
    pub contract_state: Account<'info, ContractState>,
    /// CHECK: The account's data is validated manually within the handler.
    pub randomness_account_data: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

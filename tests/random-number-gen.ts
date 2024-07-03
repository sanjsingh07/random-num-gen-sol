import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RandomNumberGen } from "../target/types/random_number_gen";
import {
  PublicKey,
  Keypair,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import {
  AnchorUtils,
  InstructionUtils,
  Queue,
  Randomness,
  SB_ON_DEMAND_PID,
  sleep,
} from "@switchboard-xyz/on-demand";

describe("random-number-gen", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.RandomNumberGen as Program<RandomNumberGen>;

  let contract_state = PublicKey.findProgramAddressSync([Buffer.from("contract-state"), payer.publicKey.toBuffer()], program.programId)

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });

  it("gen-random-number", async () => {
    // Switchboard sbQueue fixed
    const sbQueue = new PublicKey("FfD96yeXs4cxZshoPPSKhSPgVQxLAJUT3gefgh84m1Di");
    const sbProgramId = SB_ON_DEMAND_PID;
    const sbIdl = await anchor.Program.fetchIdl(sbProgramId, provider);
    const sbProgram = new anchor.Program(sbIdl!, sbProgramId, provider);

     // setup
  // const path = "sb-randomness/target/deploy/sb_randomness-keypair.json";
  // const [_, myProgramKeypair] = await AnchorUtils.initWalletFromFile(path);
  // const coinFlipProgramId = myProgramKeypair.publicKey;
  // const coinFlipProgram = await myAnchorProgram(provider, coinFlipProgramId);

    const rngKp = Keypair.generate();
    // const [randomness, ix] = await Randomness.create(sbIdl, rngKp, sbQueue);
    // const [randomness, ix] = await Randomness.create(sbProgram, rngKp, sbQueue);

    const [randomness, ix] = await Randomness.create(sbProgram, rngKp, sbQueue);

    const revealIx = await randomness.revealIx();

    // const randomNumIx = await program.instruction.genRandomNumber()

    const randomNuxtx = await program.methods.genRandomNumber(10).accounts(
      {
        contractState: contract_state[0],
        randomnessAccountData: randomness.pubkey,
        user: payer.publicKey,
        systemProgram: SystemProgram.programId,
      }
    ).signers([payer.payer])
    .rpc();

    // const settleFlipIx = await coinFlipProgram.instruction.settleFlip(
    //   escrowBump,
    //   {
    //     accounts: {
    //       playerState: playerStateAccount,
    //       randomnessAccountData: randomness.pubkey,
    //       escrowAccount: escrowAccount,
    //       user: provider.wallet.publicKey,
    //       systemProgram: SystemProgram.programId,
    //     },
    //   }
    // );
  // Add the revealIx and this instruction together and execute 

    // randomness.serializeIxToFile(
    //   [revealIx, settleFlipIx],
    //   "serializedIx.bin"
    // );


  });

  it("Reading Account", async () => {
    // read the account back
    let result = await program.account.contractState.fetch(contract_state[0]);

    console.log(`the value ${JSON.stringify(result)} was stored in ${contract_state[0].toBase58()}`);
  });
});

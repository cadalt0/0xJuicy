const { ethers } = require("ethers");
require("dotenv").config();

const LENDING_VAULT_ABI = [
  "function repayLoan(address user, string loanId)",
  "function getLoan(address user, string loanId) view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];

async function main() {
  const user = process.argv[2];
  const loanId = process.argv[3];
  if (!user || !loanId) {
    console.error("Usage: node scripts/payloan.js <wallet_address> <loan_id>");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vault = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESS,
    LENDING_VAULT_ABI,
    wallet
  );
  const usdc = new ethers.Contract(
    process.env.USDC_ADDRESS,
    ERC20_ABI,
    wallet
  );

  // Get loan details
  const loan = await vault.getLoan(user, loanId);
  if (!loan.active) {
    console.error("Loan is not active or does not exist.");
    process.exit(1);
  }
  if (loan.repaid) {
    console.error("Loan is already repaid.");
    process.exit(1);
  }

  // Check USDC balance and allowance
  const usdcAmount = loan.usdcAmount;
  const balance = await usdc.balanceOf(wallet.address);
  if (balance.lt(usdcAmount)) {
    console.error(`Insufficient USDC balance. Have: ${ethers.utils.formatUnits(balance, 6)}, need: ${ethers.utils.formatUnits(usdcAmount, 6)}`);
    process.exit(1);
  }
  const allowance = await usdc.allowance(wallet.address, process.env.LENDING_VAULT_ADDRESS);
  if (allowance.lt(usdcAmount)) {
    console.log("Approving USDC...");
    const approveTx = await usdc.approve(process.env.LENDING_VAULT_ADDRESS, usdcAmount);
    await approveTx.wait();
    console.log("USDC approved.");
  }

  // Repay the loan
  console.log(`Repaying loan for user ${user}, loanId ${loanId}...`);
  const repayTx = await vault.repayLoan(user, loanId, { gasLimit: 300000 });
  console.log(`Repay tx sent: ${repayTx.hash}`);
  await repayTx.wait();
  console.log("Loan repaid and (if original) ETH collateral unlocked.");
}

main().catch(console.error); 
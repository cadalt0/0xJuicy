const { ethers } = require("ethers");
require("dotenv").config();

const LENDING_VAULT_ABI = [
  "function markLoanRepaidFromOtherChain(address user, string loanId)",
  "function getLoan(address user, string loanId) view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active)"
];

async function main() {
  const user = process.argv[2];
  const loanId = process.argv[3];
  if (!user || !loanId) {
    console.error("Usage: node scripts/repayment.js <wallet_address> <loan_id>");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY3, provider);
  const vault = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESS,
    LENDING_VAULT_ABI,
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

  // Mark the loan as repaid from another chain
  console.log(`Marking loan as repaid for user ${user}, loanId ${loanId}...`);
  const markTx = await vault.markLoanRepaidFromOtherChain(user, loanId, { gasLimit: 300000 });
  console.log(`Mark tx sent: ${markTx.hash}`);
  await markTx.wait();
  console.log("Loan marked as repaid from other chain.");
}

main().catch(console.error);

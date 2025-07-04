const { ethers } = require("ethers");
require("dotenv").config();

const LENDING_VAULT_ABI = [
  "function getLoan(address user, string loanId) view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active)"
];

async function fetchLoan(providerUrl, contractAddress, user, loanId, label) {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const vault = new ethers.Contract(contractAddress, LENDING_VAULT_ABI, provider);

  try {
    const loan = await vault.getLoan(user, loanId);
    // If both ethAmount and usdcAmount are zero, treat as not found
    if (loan.ethAmount.eq(0) && loan.usdcAmount.eq(0)) {
      console.log(`[${label}] Loan not found for user ${user}, loanId ${loanId}`);
      return;
    }
    console.log(`[${label}] Loan details for user ${user}, loanId ${loanId}:`);
    console.log({
      ethAmount: ethers.utils.formatEther(loan.ethAmount),
      usdcAmount: ethers.utils.formatUnits(loan.usdcAmount, 6),
      repaid: loan.repaid,
      active: loan.active
    });
  } catch (err) {
    console.error(`[${label}] Error fetching loan:`, err.message);
  }
}

async function main() {
  // Get user and loanId from command line
  const user = process.argv[2];
  const loanId = process.argv[3];
  if (!user || !loanId) {
    console.error("Usage: node scripts/fetch-collateral-both-chains.js <user_address> <loan_id>");
    process.exit(1);
  }

  await fetchLoan(
    process.env.SEPOLIA_RPC_URL,
    process.env.LENDING_VAULT_ADDRESS,
    user,
    loanId,
    "Sepolia"
  );
  await fetchLoan(
    process.env.LINEA_RPC_URL,
    process.env.LENDING_VAULT_ADDRESSL,
    user,
    loanId,
    "Linea"
  );
}

main().catch(console.error);
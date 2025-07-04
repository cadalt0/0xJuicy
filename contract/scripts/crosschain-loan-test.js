const { ethers } = require("ethers");
require("dotenv").config();
const assert = require("assert");

async function main() {
  // Providers and wallets
  const sepoliaProvider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const lineaProvider = new ethers.providers.JsonRpcProvider(process.env.LINEA_RPC_URL);
  const walletSepolia = new ethers.Wallet(process.env.PRIVATE_KEY, sepoliaProvider); // user
  const walletLinea = new ethers.Wallet(process.env.PRIVATE_KEY3, lineaProvider);   // cross-chain adder
  const walletLineaUser = new ethers.Wallet(process.env.PRIVATE_KEY, lineaProvider); // user on linea
  const walletSepoliaAdmin = new ethers.Wallet(process.env.PRIVATE_KEY3, sepoliaProvider); // cross-chain adder on sepolia

  // Contracts
  const vaultSepolia = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESS,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    walletSepolia
  );
  const vaultSepoliaAdmin = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESS,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    walletSepoliaAdmin
  );
  const vaultLinea = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESSL,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    walletLinea
  );
  const vaultLineaUser = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESSL,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    walletLineaUser
  );

  const usdcAmount = ethers.utils.parseUnits("0.1", 6);
  const ethAmount = ethers.utils.parseEther("0.0001");

  // 1. Originate loan on Sepolia
  const originalLoanId = `${Date.now()}`; // unique string loanId for test
  console.log("[Sepolia] Creating loan...", originalLoanId);
  const tx = await vaultSepolia.originateLoan(originalLoanId, usdcAmount, "sepolia", walletSepolia.address, { value: ethAmount });
  await tx.wait();
  console.log("[Sepolia] Loan originated.");
  let loan = await vaultSepolia.getLoan(walletSepolia.address, originalLoanId);
  console.log(`[Sepolia] Loan details:`, loan);
  assert(loan.active && !loan.repaid, "Sepolia loan should be active and not repaid after origination");

  // 2. Clone loan to Linea Sepolia
  const clonedLoanId = `${originalLoanId}-(linea)`;
  console.log("[Linea] Cloning loan to Linea Sepolia...", clonedLoanId);
  const tx2 = await vaultLinea.addLoanFromOtherChain(
    walletSepolia.address,
    clonedLoanId,
    loan.ethAmount,
    loan.usdcAmount
  );
  await tx2.wait();
  console.log("[Linea] Loan cloned.");
  let loanLineaCloned = await vaultLinea.getLoan(walletSepolia.address, clonedLoanId);
  console.log("[Linea] Cloned loan after clone:", loanLineaCloned);
  assert(loanLineaCloned.active && !loanLineaCloned.repaid, "Linea cloned loan should be active and not repaid after clone");

  // 3. Repay the cloned loan on Linea Sepolia with PRIVATE_KEY
  console.log("[Linea] Repaying cloned loan on Linea Sepolia with user...");
  const usdcLinea = new ethers.Contract(
    process.env.USDC_ADDRESS_LINEA,
    [
      "function approve(address,uint256) returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function balanceOf(address) view returns (uint256)"
    ],
    walletLineaUser
  );
  const allowance = await usdcLinea.allowance(walletLineaUser.address, process.env.LENDING_VAULT_ADDRESSL);
  if (allowance.lt(usdcAmount)) {
    const approveTx = await usdcLinea.approve(process.env.LENDING_VAULT_ADDRESSL, usdcAmount);
    await approveTx.wait();
    console.log("[Linea] USDC approved.");
  }
  // Check status before repay
  loanLineaCloned = await vaultLinea.getLoan(walletSepolia.address, clonedLoanId);
  console.log("[Linea] Cloned loan before repay:", loanLineaCloned);
  const repayTx = await vaultLineaUser.repayLoan(walletSepolia.address, clonedLoanId, { gasLimit: 300000 });
  await repayTx.wait();
  console.log("[Linea] Cloned loan repaid (should only mark as repaid, no ETH unlock).");
  let loanLinea = await vaultLinea.getLoan(walletSepolia.address, clonedLoanId);
  console.log(`[Linea] Cloned loan details:`, loanLinea);
  assert(loanLinea.active && loanLinea.repaid, "Linea cloned loan should be active and repaid after repay");

  // 4. Mark the original loan as repaid on Sepolia with PRIVATE_KEY3
  console.log("[Sepolia] Marking original loan as repaid with cross-chain adder...");
  const ethBalanceBefore = await sepoliaProvider.getBalance(walletSepolia.address);
  const markTx = await vaultSepoliaAdmin.markLoanRepaidFromOtherChain(walletSepolia.address, originalLoanId);
  await markTx.wait();
  console.log("[Sepolia] Original loan marked as repaid by cross-chain adder.");
  loan = await vaultSepolia.getLoan(walletSepolia.address, originalLoanId);
  const ethBalanceAfter = await sepoliaProvider.getBalance(walletSepolia.address);
  console.log(`[Sepolia] Original loan after mark:`, loan);
  assert(!loan.active && loan.repaid, "Sepolia loan should be inactive and repaid after admin mark");
  console.log(`[Sepolia] ETH balance before: ${ethers.utils.formatEther(ethBalanceBefore)}`);
  console.log(`[Sepolia] ETH balance after:  ${ethers.utils.formatEther(ethBalanceAfter)}`);
  if (ethBalanceAfter.gt(ethBalanceBefore)) {
    console.log("[Sepolia] ETH was unlocked and sent to the user after admin marking!");
  } else {
    console.log("[Sepolia] ETH was NOT unlocked. Check contract logic.");
  }
}

main().catch(console.error); 
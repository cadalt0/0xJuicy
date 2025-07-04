import { ethers } from "ethers";

const LENDING_VAULT_ABI = [
  "function repayLoan(address user, string loanId)",
  "function getLoan(address user, string loanId) view returns (uint256 ethAmount, uint256 usdcAmount, bool repaid, bool active)",
  "function markLoanRepaidFromOtherChain(address user, string loanId)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)"
];

function getChainEnv(chain: string) {
  if (chain === "ethereum") {
    return {
      rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!,
      vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESS!,
      usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS!,
    };
  } else if (chain === "linea") {
    return {
      rpcUrl: process.env.NEXT_PUBLIC_LINEA_RPC_URL!,
      vaultAddress: process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESSL!,
      usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS_LINEA!,
    };
  }
  throw new Error("Unsupported chain");
}

// Utility to get cross-chain loanId with correct suffix
function getCrossChainLoanId(loanId: string, collateralChain: 'ethereum' | 'linea') {
  const chainSuffix = collateralChain === 'ethereum' ? 'eth' : 'linea';
  return `${loanId}-(${chainSuffix})`;
}

// Utility to normalize chain names to internal IDs
function normalizeChainId(chain: string): 'ethereum' | 'linea' {
  if (chain === 'Sepolia' || chain === 'ethereum') return 'ethereum';
  if (chain === 'Linea' || chain === 'linea') return 'linea';
  throw new Error('Unsupported chain: ' + chain);
}

// Main function for both same-chain and cross-chain repayment
export async function repayLoanWithSignerCrossChain({
  user,
  loanId,
  collateralChain, // 'ethereum' or 'linea' (where funds are)
  payChain,        // 'ethereum' or 'linea' (where user is paying)
  signer
}: {
  user: string,
  loanId: string,
  collateralChain: string,
  payChain: string,
  signer: ethers.Signer
}) {
  try {
    // Normalize chain IDs
    const normCollateralChain = normalizeChainId(collateralChain);
    const normPayChain = normalizeChainId(payChain);
    // If same chain, use normal repay
    if (normCollateralChain === normPayChain) {
      return await repayLoanWithSigner({
        user,
        loanId,
        chain: normPayChain,
        signer
      });
    }
    // Cross-chain: pay on payChain with loanId-(eth) or loanId-(linea)
    const crossLoanId = getCrossChainLoanId(loanId, normCollateralChain);
    const { vaultAddress, usdcAddress } = getChainEnv(normPayChain);
    const vault = new ethers.Contract(vaultAddress, LENDING_VAULT_ABI, signer);
    const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    const walletAddress = await signer.getAddress();
    // Get loan details (on payChain, with crossLoanId)
    const loan = await vault.getLoan(user, crossLoanId);
    if (!loan.active) return { error: "Loan is not active or does not exist." };
    if (loan.repaid) return { error: "Loan is already repaid." };
    const usdcAmount = loan.usdcAmount ?? loan[1];
    // Check USDC balance and allowance
    const balance = await usdc.balanceOf(walletAddress);
    if (balance < usdcAmount) {
      return { error: `Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)}, need: ${ethers.formatUnits(usdcAmount, 6)}` };
    }
    const allowance = await usdc.allowance(walletAddress, vaultAddress);
    if (allowance < usdcAmount) {
      const approveTx = await usdc.approve(vaultAddress, usdcAmount);
      await approveTx.wait();
    }
    // Repay the loan on payChain
    const repayTx = await vault.repayLoan(user, crossLoanId, { gasLimit: 300000 });
    await repayTx.wait();
    // Now, mark as repaid on the original chain (backend wallet)
    // Use the original loanId (NO -(chain) suffix)
    const { vaultAddress: origVaultAddress, rpcUrl: origRpcUrl } = getChainEnv(normCollateralChain);
    const backendProvider = new ethers.JsonRpcProvider(origRpcUrl);
    const backendWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY3!, backendProvider);
    const origVault = new ethers.Contract(origVaultAddress, LENDING_VAULT_ABI, backendWallet);
    const markTx = await origVault.markLoanRepaidFromOtherChain(user, loanId, { gasLimit: 300000 });
    await markTx.wait();
    return {
      success: true,
      repayTxHash: repayTx.hash,
      markTxHash: markTx.hash
    };
  } catch (err: any) {
    return { error: err.message || String(err) };
  }
}

// Keep the original same-chain repay for direct calls
export async function repayLoanWithSigner({
  user,
  loanId,
  chain,
  signer
}: {
  user: string,
  loanId: string,
  chain: string,
  signer: ethers.Signer
}) {
  try {
    const normChain = normalizeChainId(chain);
    const { vaultAddress, usdcAddress } = getChainEnv(normChain);
    const vault = new ethers.Contract(vaultAddress, LENDING_VAULT_ABI, signer);
    const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
    const walletAddress = await signer.getAddress();
    // Get loan details
    const loan = await vault.getLoan(user, loanId);
    if (!loan.active) {
      return { error: "Loan is not active or does not exist." };
    }
    if (loan.repaid) {
      return { error: "Loan is already repaid." };
    }
    const usdcAmount = loan.usdcAmount ?? loan[1];
    // Check USDC balance and allowance
    const balance = await usdc.balanceOf(walletAddress);
    if (balance < usdcAmount) {
      return { error: `Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)}, need: ${ethers.formatUnits(usdcAmount, 6)}` };
    }
    const allowance = await usdc.allowance(walletAddress, vaultAddress);
    if (allowance < usdcAmount) {
      const approveTx = await usdc.approve(vaultAddress, usdcAmount);
      await approveTx.wait();
    }
    // Repay the loan
    const repayTx = await vault.repayLoan(user, loanId, { gasLimit: 300000 });
    await repayTx.wait();
    return {
      success: true,
      repayTxHash: repayTx.hash
    };
  } catch (err: any) {
    return { error: err.message || String(err) };
  }
}

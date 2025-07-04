const { ethers } = require("ethers");
require("dotenv").config();

// LendingVault ABI (minimal, only needed functions/events)
const LENDING_VAULT_ABI = [
  // originateLoan
  "function originateLoan(string loanId, uint256 usdcAmount, string usdcChain, address usdcAddress) payable",
  // addLoanFromOtherChain
  "function addLoanFromOtherChain(address user, string loanId, uint256 ethAmount, uint256 usdcAmount)",
  // LoanOriginated event
  "event LoanOriginated(address indexed user, string loanId, uint256 ethAmount, uint256 usdcAmount, string usdcChain, address usdcAddress)"
];

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function sendUSDCOnChain(chain, to, amount) {
  let rpcUrl, usdcAddress;
  if (chain === "eth") {
    rpcUrl = process.env.SEPOLIA_RPC_URL;
    usdcAddress = process.env.USDC_ADDRESS_SEPOLIA;
  } else if (chain === "linea") {
    rpcUrl = process.env.LINEA_RPC_URL;
    usdcAddress = process.env.USDC_ADDRESS_LINEA;
  } else {
    throw new Error("Unsupported chain: " + chain);
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY4, provider);
  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, wallet);

  // Check balance
  const balance = await usdc.balanceOf(wallet.address);
  if (balance.lt(amount)) {
    throw new Error(`Insufficient USDC balance. Have: ${ethers.utils.formatUnits(balance, 6)}, need: ${ethers.utils.formatUnits(amount, 6)}`);
  }

  // Send USDC
  const tx = await usdc.transfer(to, amount);
  console.log(`USDC sent! Tx hash: ${tx.hash}`);
  await tx.wait();
  console.log("USDC transfer confirmed.");
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const vault = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESS,
    LENDING_VAULT_ABI,
    wallet
  );

  const usdcAmount = ethers.utils.parseUnits("0.01", 6);
  const ethAmount = ethers.utils.parseEther("0.0001");
  const usdcChain = "linea";
  const usdcAddress = "0xd5A3259cc15C588EdAF23FaFB9620910580189f4";
  const loanId = `${Date.now()}`;

  console.log(`Creating loan with ID: ${loanId}`);
  const tx = await vault.originateLoan(loanId, usdcAmount, usdcChain, usdcAddress, { value: ethAmount });
  const receipt = await tx.wait();

  // Find and log the LoanOriginated event
  const iface = new ethers.utils.Interface(LENDING_VAULT_ABI);
  const event = receipt.logs
    .map(log => {
      try { return iface.parseLog(log); } catch { return null; }
    })
    .find(parsed => parsed && parsed.name === "LoanOriginated");

  if (event) {
    const { user, loanId, ethAmount, usdcAmount, usdcChain, usdcAddress } = event.args;
    console.log('LoanOriginated event details:');
    console.log('  user:', user);
    console.log('  loanId:', loanId);
    console.log('  ethAmount:', ethers.utils.formatEther(ethAmount));
    console.log('  usdcAmount:', ethers.utils.formatUnits(usdcAmount, 6));
    console.log('  usdcChain:', usdcChain);
    console.log('  usdcAddress:', usdcAddress);

    // Determine the origin chain for the clone suffix
    let originSuffix = "";
    if (process.env.SEPOLIA_RPC_URL && provider.connection.url === process.env.SEPOLIA_RPC_URL) {
      originSuffix = "-(eth)";
    } else if (process.env.LINEA_RPC_URL && provider.connection.url === process.env.LINEA_RPC_URL) {
      originSuffix = "-(linea)";
    } else {
      originSuffix = usdcChain === "linea" ? "-(linea)" : "-(eth)";
    }
    const clonedLoanId = `${loanId}${originSuffix}`;

    // Clone loan to the other chain (cross-chain)
    const lineaProvider = new ethers.providers.JsonRpcProvider(process.env.LINEA_RPC_URL);
    const crossChainAdder = new ethers.Wallet(process.env.PRIVATE_KEY3, lineaProvider);
    const vaultLinea = new ethers.Contract(
      process.env.LENDING_VAULT_ADDRESSL,
      LENDING_VAULT_ABI,
      crossChainAdder
    );
    console.log(`Cloning loan to Linea with ID: ${clonedLoanId}`);
    const cloneTx = await vaultLinea.addLoanFromOtherChain(user, clonedLoanId, ethAmount, usdcAmount);
    await cloneTx.wait();
    console.log('Loan cloned to Linea.');

    // Only send USDC if loan is active (event emission means success)
    try {
      await sendUSDCOnChain(usdcChain, usdcAddress, usdcAmount);
    } catch (err) {
      console.error("Failed to send USDC:", err.message);
    }
  } else {
    console.log("No LoanOriginated event found in transaction receipt.");
  }
}

main().catch(console.error); 
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const vaultAddress = "0xfD5d0e648363C899A18C626b93D14d1ae16C1816";
  const usdcAddress = process.env.USDC_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const provider = ethers.provider;

  // Wallets
  const wallet1 = new ethers.Wallet(process.env.PRIVATE_KEY, provider); // Loan creator
  const wallet2 = new ethers.Wallet(process.env.PRIVATE_KEY2, provider); // Repayer

  const vault1 = await ethers.getContractAt("LendingVault", vaultAddress, wallet1);
  const vault2 = await ethers.getContractAt("LendingVault", vaultAddress, wallet2);
  const usdc1 = await ethers.getContractAt([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transfer(address,uint256) returns (bool)",
    "function transferFrom(address,address,uint256) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ], usdcAddress, wallet1);
  const usdc2 = await ethers.getContractAt([
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transfer(address,uint256) returns (bool)",
    "function transferFrom(address,address,uint256) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ], usdcAddress, wallet2);

  const usdcAmount = ethers.utils.parseUnits("0.1", 6);
  const ethAmount = ethers.utils.parseEther("0.001");

  // 1. Originate loan with wallet1
  console.log("[Wallet1] Address:", wallet1.address);
  console.log("[Wallet1] ETH balance before:", ethers.utils.formatEther(await wallet1.getBalance()));
  console.log("[Wallet1] USDC balance before:", (await usdc1.balanceOf(wallet1.address)).toString());

  console.log("[Wallet1] Originating loan...");
  let tx = await vault1.originateLoan(usdcAmount, { value: ethAmount });
  await tx.wait();
  console.log("[Wallet1] Loan originated.");

  // Get the new loan ID (userLoanCount - 1)
  const userLoanCount = await vault1.userLoanCount(wallet1.address);
  const newLoanId = userLoanCount.toNumber() - 1;
  console.log("[Wallet1] New loanId:", newLoanId);

  // 2. Approve USDC with wallet2
  console.log("[Wallet2] Address:", wallet2.address);
  console.log("[Wallet2] USDC balance before:", (await usdc2.balanceOf(wallet2.address)).toString());
  console.log("[Wallet2] Approving USDC...");
  tx = await usdc2.approve(vaultAddress, usdcAmount);
  await tx.wait();
  console.log("[Wallet2] USDC approved.");

  // 3. Repay the loan for wallet1 using wallet2
  console.log("[Wallet2] Repaying loan for Wallet1...");
  tx = await vault2.repayLoan(wallet1.address, newLoanId, { gasLimit: 300000 });
  await tx.wait();
  console.log("[Wallet2] Loan repaid and ETH withdrawn to Wallet1.");

  // Final balances
  console.log("[Wallet1] ETH balance after:", ethers.utils.formatEther(await wallet1.getBalance()));
  console.log("[Wallet1] USDC balance after:", (await usdc1.balanceOf(wallet1.address)).toString());
  console.log("[Wallet2] USDC balance after:", (await usdc2.balanceOf(wallet2.address)).toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 
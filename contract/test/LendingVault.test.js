const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LendingVault", function () {
  let LendingVault, lendingVault, usdc, owner, user;

  beforeEach(async function () {
    [owner, user, _] = await ethers.getSigners();
    // Deploy a mock USDC token
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();
    await usdc.deployed();
    // Deploy LendingVault
    LendingVault = await ethers.getContractFactory("LendingVault");
    lendingVault = await LendingVault.deploy(usdc.address);
    await lendingVault.deployed();
  });

  it("should originate a loan and emit event", async function () {
    const usdcAmount = ethers.utils.parseUnits("100", 6);
    await expect(lendingVault.connect(user).originateLoan(usdcAmount, "testchain", user.address, { value: ethers.utils.parseEther("1") }))
      .to.emit(lendingVault, "LoanOriginated");
    const loan = await lendingVault.getLoan(user.address, 0);
    expect(loan.ethAmount).to.equal(ethers.utils.parseEther("1"));
    expect(loan.usdcAmount).to.equal(usdcAmount);
    expect(loan.repaid).to.equal(false);
    expect(loan.active).to.equal(true);
  });

  it("should allow repayment and auto-withdraw ETH", async function () {
    const usdcAmount = ethers.utils.parseUnits("100", 6);
    await lendingVault.connect(user).originateLoan(usdcAmount, "testchain", user.address, { value: ethers.utils.parseEther("1") });
    // Mint USDC to user and approve
    await usdc.mint(user.address, usdcAmount);
    await usdc.connect(user).approve(lendingVault.address, usdcAmount);
    // Repay
    await expect(lendingVault.connect(user).repayLoan(0))
      .to.emit(lendingVault, "LoanRepaid")
      .and.to.emit(lendingVault, "CollateralWithdrawn");
    const loan = await lendingVault.getLoan(user.address, 0);
    expect(loan.active).to.equal(false);
    expect(loan.repaid).to.equal(true);
  });
});

// Minimal mock USDC for testing
const { ContractFactory } = require("ethers");
const { artifacts } = require("hardhat");

describe("MockUSDC", function () {
  let usdc, owner, user;
  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const USDC = await ethers.getContractFactory("MockUSDC");
    usdc = await USDC.deploy();
    await usdc.deployed();
  });
  it("should mint and transfer USDC", async function () {
    await usdc.mint(user.address, 1000);
    expect(await usdc.balanceOf(user.address)).to.equal(1000);
    await usdc.connect(user).transfer(owner.address, 500);
    expect(await usdc.balanceOf(owner.address)).to.equal(500);
  });
});

// Solidity for MockUSDC (to be placed in contracts/MockUSDC.sol):
// pragma solidity ^0.8.0;
// contract MockUSDC {
//     string public name = "MockUSDC";
//     string public symbol = "USDC";
//     uint8 public decimals = 6;
//     mapping(address => uint256) public balanceOf;
//     mapping(address => mapping(address => uint256)) public allowance;
//     function mint(address to, uint256 amount) public { balanceOf[to] += amount; }
//     function transfer(address to, uint256 amount) public returns (bool) { require(balanceOf[msg.sender] >= amount, "bal"); balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true; }
//     function approve(address spender, uint256 amount) public returns (bool) { allowance[msg.sender][spender] = amount; return true; }
//     function transferFrom(address from, address to, uint256 amount) public returns (bool) { require(balanceOf[from] >= amount, "bal"); require(allowance[from][msg.sender] >= amount, "allow"); balanceOf[from] -= amount; allowance[from][msg.sender] -= amount; balanceOf[to] += amount; return true; }
// } 
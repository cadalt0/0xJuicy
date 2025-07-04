const { ethers } = require("ethers");
require("dotenv").config();

async function deployToNetwork(rpcUrl, privateKey, usdcAddress) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.ContractFactory(
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").bytecode,
    wallet
  );
  const contract = await factory.deploy(usdcAddress);
  await contract.deployed();
  console.log(`LendingVault deployed to ${contract.address} on ${rpcUrl}`);
}

async function main() {
  await deployToNetwork(
    process.env.SEPOLIA_RPC_URL,
    process.env.PRIVATE_KEY,
    process.env.USDC_ADDRESS
  );
  await deployToNetwork(
    process.env.LINEA_RPC_URL,
    process.env.PRIVATE_KEY,
    process.env.USDC_ADDRESS_LINEA
  );
}

main().catch(console.error); 
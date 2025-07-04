const { ethers } = require("ethers");
require("dotenv").config();

async function queryEventsInChunks(contract, filter, fromBlock, toBlock, chunkSize = 500) {
  let events = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);
    const chunkEvents = await contract.queryFilter(filter, start, end);
    events = events.concat(chunkEvents);
  }
  return events;
}

async function main() {
  const lineaProvider = new ethers.providers.JsonRpcProvider(process.env.LINEA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY3, lineaProvider);
  const vaultLinea = new ethers.Contract(
    process.env.LENDING_VAULT_ADDRESSL,
    require("../artifacts/contracts/LendingVault.sol/LendingVault.json").abi,
    wallet
  );

  // Set the user address and loanId you want to fetch
  const user = "0xd5A3259cc15C588EdAF23FaFB9620910580189f4"; // Example user
  const loanId = "1751538179108-(linea)"; // Now a string

  // Fetch loan details
  const loan = await vaultLinea.getLoan(user, loanId);
  console.log(`Loan details for user ${user}, loanId ${loanId}:`);
  console.log({
    ethAmount: ethers.utils.formatEther(loan.ethAmount),
    usdcAmount: ethers.utils.formatUnits(loan.usdcAmount, 6),
    repaid: loan.repaid,
    active: loan.active
  });

  // Fetch all events for this loan in 500-block chunks
  const iface = vaultLinea.interface;
  const fromBlock = 0; // You can set this to contract deployment block for efficiency
  const toBlock = await lineaProvider.getBlockNumber();

  // LoanOriginated
  const originatedFilter = vaultLinea.filters.LoanOriginated(user, null, null, null, null, null);
  const originatedEvents = await queryEventsInChunks(vaultLinea, originatedFilter, fromBlock, toBlock);
  originatedEvents
    .filter(ev => ev.args.loanId === loanId)
    .forEach(ev => {
      console.log("LoanOriginated:", iface.parseLog(ev).args);
    });

  // LoanRepaid
  const repaidFilter = vaultLinea.filters.LoanRepaid(user, null, null);
  const repaidEvents = await queryEventsInChunks(vaultLinea, repaidFilter, fromBlock, toBlock);
  repaidEvents
    .filter(ev => ev.args.loanId === loanId)
    .forEach(ev => {
      console.log("LoanRepaid:", iface.parseLog(ev).args);
    });

  // LoanMarkedRepaid
  const markedRepaidFilter = vaultLinea.filters.LoanMarkedRepaid(user, null);
  const markedRepaidEvents = await queryEventsInChunks(vaultLinea, markedRepaidFilter, fromBlock, toBlock);
  markedRepaidEvents
    .filter(ev => ev.args.loanId === loanId)
    .forEach(ev => {
      console.log("LoanMarkedRepaid:", iface.parseLog(ev).args);
    });
}

main().catch(console.error); 
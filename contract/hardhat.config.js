require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    linea: {
      url: process.env.LINEA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
}; 
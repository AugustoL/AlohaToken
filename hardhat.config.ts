import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // For local development
    hardhat: {},
    // For testnet deployment (example for Sepolia)
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR-INFURA-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    // For mainnet deployment
    mainnet: {
      url: process.env.MAINNET_URL || "https://mainnet.infura.io/v3/YOUR-INFURA-PROJECT-ID",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    // Optimism (Layer 2) - Popular in 2025 for lower gas fees
    optimism: {
      url: process.env.OPTIMISM_URL || "https://mainnet.optimism.io",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  // For Etherscan verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};

export default config;
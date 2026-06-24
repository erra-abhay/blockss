import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    besu: {
      url: process.env.BESU_RPC_URL || "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: process.env.PLATFORM_WALLET_PRIVATE_KEY 
        ? [process.env.PLATFORM_WALLET_PRIVATE_KEY] 
        : [] // Add local default fallback or leave empty for tests
    },
    hardhat: {
      chainId: 1337 // Match Besu
    }
  }
};

export default config;

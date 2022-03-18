import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// https://hardhat.org/guides/create-task.html
task('eth-balance', 'total amount of ETH held in the contract')
  .addParam("pool", "ETHPool's address")
  .setAction(async(args, hre) => {
  if(!(hre.ethers.utils.isAddress(args.pool))) {
    console.log(args)
    throw new Error("invalid arguments");
  }
  const balance = await hre.ethers.provider.getBalance(args.pool);
  console.log("Pool Size in ETH", hre.ethers.utils.formatEther(balance));
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337,
      loggingEnabled: false,
      gas: 12000000,
      gasPrice: "auto",
      blockGasLimit: 12000000,
      accounts: {
        mnemonic: 'myth like bonus scare over problem client lizard pioneer submit female collect',
      },
    },
    ganache: {
      chainId: 1337,
      url: "http://localhost:8545",
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  abiExporter: {
    path: "./build/abis",
    clear: false,
    flat: true,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "build/types",
    target: "ethers-v5"
  }
};

export default config;

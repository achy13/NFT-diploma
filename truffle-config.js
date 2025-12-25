require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },
    
    sepolia: {
      provider: () => {
        if (!process.env.MNEMONIC) {
          throw new Error('MNEMONIC is not set in .env file');
        }
        const rpcUrl = process.env.RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
        if (!rpcUrl) {
          throw new Error('RPC_URL or INFURA_PROJECT_ID must be set in .env');
        }
        return new HDWalletProvider({
          mnemonic: { phrase: process.env.MNEMONIC },
          providerOrUrl: rpcUrl,
          numberOfAddresses: 5,
          shareNonce: true,
          pollingInterval: 20000
        });
      },
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 20000000000,
      confirmations: 1,
      timeoutBlocks: 400,
      networkCheckTimeout: 180000,
      skipDryRun: true
    },
    
    goerli: {
      provider: () => new HDWalletProvider(
        process.env.MNEMONIC,
        `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 5,
      gas: 5500000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        viaIR: true,
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  plugins: [
    'truffle-plugin-verify'
  ],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },

  mocha: {
    timeout: 100000
  }
};


require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: "https://sepolia.infura.io/v3/827e9235c6fa4ff8a15347397b4aca76",
      },
      allowUnlimitedContractSize: true,
    },
    base_testnet: {
      url: "https://goerli.base.org",
      accounts: [
        "",
      ],
    },

    base_mainnet: {
      url: "https://developer-access-mainnet.base.org",
      accounts: [
        "",
      ],
    },
  },

  etherscan: {
    apiKey: {
      base_mainnet: ""
    },
    customChains: [
      {
        network: "base_mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      }
    ]
  }

};

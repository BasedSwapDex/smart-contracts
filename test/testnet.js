const { ethers, upgrades } = require("hardhat");
const {
  abi: ERC20ABI,
} = require("@openzeppelin/contracts/build/contracts/ERC20.json");
const {
  abi: ProxyAdminABI,
} = require("@openzeppelin/contracts/build/contracts/ProxyAdmin.json");

// Astra whale that we used for the mainnet testing purpose
const TESTNET_ACCOUNT = "0xf3079B08C59435c92798c39c19b0FF0676F79056";

let router;
let owner, addr1, addr2, addrs, daiHolder, usdcHolder, testnet, testnetAdmin;
let RouterContract;

const URL = "TEST_URL";

describe("Indices", () => {
  const erc20Token = (tokenAddress) =>
    ethers.getContractAt(ERC20ABI, tokenAddress, owner);

  before(async () => {
    [owner] = await ethers.getSigners();
    testnet = await ethers.getImpersonatedSigner(TESTNET_ACCOUNT);
    
    
    router = await ethers.getContractAt("PancakeRouter","0x539007a0626eD49F54e0DA0dAc7eaa0707064112", testnet);

  });

//   async function checkBalanceOfToken(_userAddress){
//     let wbtcBalance = await wbtcToken.balanceOf(_userAddress)
//     console.log("Balance of WBTC ", wbtcBalance)
//     let usdtBalance = await usdtToken.balanceOf(_userAddress)
//     console.log("Balance of USDT", usdtBalance)
//     let usdcBalance = await usdcToken.balanceOf(_userAddress)
//     console.log("Balance of USDC", usdcBalance)
//     let wethBalance = await wethToken.balanceOf(_userAddress)
//     console.log("Balance of WETH", wethBalance)
//   }

  describe("Test swap contract", () => {
    it("Test with index rebalance", async () => {

        console.log("\nIndices initialised\n");
        await router.connect(testnet).addLiquidity("0xa1e47642DFC75D259E3Ee417F04c339c7504a7A9","0xA830DE16B4d470d37f554E448d956BD9a13F8839","10000000000000000000000","10000000000000000000000","10","10","0xf3079B08C59435c92798c39c19b0FF0676F79056","16910647700");
        console.log("\nRebalanced, token balance after rebalance\n");
    })

  });

});
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address", deployer.address);

  const weth = "0x4200000000000000000000000000000000000006";
  const factory = await hre.ethers.deployContract("PancakeFactory", [
    deployer.address,
  ]);
  await factory.waitForDeployment();
  console.log("Factory ", factory.target);

  const router = await hre.ethers.deployContract("PancakeRouter", [
    factory.address,
    weth
  ]);
  await router.waitForDeployment();
  console.log("Router ", router.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

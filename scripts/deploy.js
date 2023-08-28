const { ethers, upgrades } = require("hardhat");

async function main() {
  // Get the Address from Ganache Chain to deploy.
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address", deployer.address);

  const MockTokens = await ethers.getContractFactory("MockToken");
  const MasterChef = await ethers.getContractFactory('BasedFarming');

  // Deploy
  let test = await MockTokens.deploy("TEST", "TEST");
  let lp = await MockTokens.deploy("LP Token", "LP");
  console.log("test deployed to:", test.address);
  console.log("test deployed to:", lp.address);

  
  const masterChef = await upgrades.deployProxy(MasterChef, [test.address, deployer.address, "1000000000000000000", 0]);
  console.log('BasedFarming deployed to:', masterChef.address);
}

main();

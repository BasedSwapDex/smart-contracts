const { ethers, upgrades } = require("hardhat");

async function main() {
  const contract = await ethers.getContractFactory("BasedFarming");
  const upgrade = await upgrades.upgradeProxy(
    "",
    contract
  );
  console.log("Contract upgraded", upgrade);
}

main();
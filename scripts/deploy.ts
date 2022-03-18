import "@nomiclabs/hardhat-ethers"
import { ethers } from "hardhat";

async function main() {
  const ETHPool = await ethers.getContractFactory('ETHPool');
  const [deployer] = await ethers.getSigners();

  console.log("Deploy With:", deployer.address);

  const ethPool = await ETHPool.deploy();
  console.log("Deployed At", ethPool.address);
  await ethPool.deployed();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  });
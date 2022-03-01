const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("Transactions", function () {
  // 重置网络数据
  beforeEach(async function () {
    await hre.network.provider.send("hardhat_reset")
  })

  it("Should return the new transaction count once it's changed", async function () {
    const transactionsFactory = await ethers.getContractFactory("Transactions");
    const transactionsContract = await transactionsFactory.deploy();
    await transactionsContract.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const addToBlockchainTx = await transactionsContract.addToBlockchain(
      addr1.address,
      ethers.utils.parseEther("0.1"),
      "test",
      "test",
    );

    // wait until the transaction is mined
    console.log(`Loading - ${addToBlockchainTx.hash}`);
    await addToBlockchainTx.wait();
    console.log(`Success - ${addToBlockchainTx.hash}`);
    expect( await transactionsContract.getAllTransactions()).to.have.lengthOf(1);
  });
});

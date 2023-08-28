const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = ethers;

describe('BasedFarming Contract', function () {
  let masterChef;
  let owner;
  let user1;
  let user2;
  let lpToken;
  let rewardToken;
  let BasedToken;

  const BONUS_MULTIPLIER = 1;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    const MasterChef = await ethers.getContractFactory('BasedFarming');
    BasedToken = await ethers.getContractFactory('MockToken'); // Replace with your actual BasedToken contract factory

    lpToken = await BasedToken.deploy("LP", "LP");
    rewardToken = await BasedToken.deploy("Test", "TST");

    masterChef = await upgrades.deployProxy(MasterChef, [rewardToken.address, owner.address, 10000000, 0]);
    await masterChef.deployed();

    await rewardToken.mint(masterChef.address, 20000000000);
  });

  describe('Deployment', function () {
    it('Should set the correct owner', async function () {
      expect(await masterChef.owner()).to.equal(owner.address);
    });
  });

  describe('Pool Management', function () {
    it('Should add a new pool', async function () {
      await masterChef.add(100, lpToken.address, true);
      const poolInfo = await masterChef.poolInfo(0);

      expect(poolInfo.lpToken).to.equal(lpToken.address);
      expect(poolInfo.allocPoint).to.equal(100);
      expect(poolInfo.accBasedPerShare).to.equal(0);
    });

    it('Should update pool allocation points', async function () {
      await masterChef.add(100, lpToken.address, true);
      await masterChef.set(0, 200, true);

      const poolInfo = await masterChef.poolInfo(0);
      expect(poolInfo.allocPoint).to.equal(200);
    });
  });

  describe('User Actions', function () {

    beforeEach(async () => {
      await masterChef.add(100, lpToken.address, true);
      await lpToken.mint(user1.address, 1000);
      await lpToken.mint(user2.address, 1000);
      await lpToken.connect(user1).approve(masterChef.address, 1000);
      await lpToken.connect(user2).approve(masterChef.address, 1000);
    });

    it('Should deposit LP tokens', async function () {
      await masterChef.connect(user1).deposit(0, 100);
      const userInfo = await masterChef.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(100);
    });

    it('Should withdraw LP tokens', async function () {
      await masterChef.connect(user1).deposit(0, 100);
      await masterChef.connect(user1).withdraw(0, 50);
      const userInfo = await masterChef.userInfo(0, user1.address);
      expect(userInfo.amount).to.equal(50);
    });

    it('Should deposit and withdraw with rewards', async function () {
      await masterChef.connect(user1).deposit(0, 100);
      await masterChef.connect(user2).deposit(0, 200);
      
      // Move to the next block to generate rewards
      await ethers.provider.send('evm_mine');

      const user1RewardBefore = await masterChef.pendingBased(0, user1.address);
      await masterChef.connect(user1).withdraw(0, 50);
      const user1RewardAfter = await masterChef.pendingBased(0, user1.address);

      const user2RewardBefore = await masterChef.pendingBased(0, user2.address);
      await masterChef.connect(user2).withdraw(0, 100);
      const user2RewardAfter = await masterChef.pendingBased(0, user2.address);

      expect(user1RewardAfter).to.be.lt(user1RewardBefore);
      expect(user2RewardAfter).to.be.lt(user2RewardBefore);
    });

    it('Should claim rewards', async function () {
      await masterChef.connect(user1).deposit(0, 100);

      // Move to the next block to generate rewards
      await ethers.provider.send('evm_mine');

      const user1RewardBefore = await masterChef.pendingBased(0, user1.address);
      await masterChef.connect(user1).deposit(0, 0);
      const user1RewardAfter = await masterChef.pendingBased(0, user1.address);

      expect(user1RewardAfter).to.equal(0); // Rewards claimed

      const basedBalanceBefore = await rewardToken.balanceOf(user1.address);
      await masterChef.connect(user1).withdraw(0, 100);
      const basedBalanceAfter = await rewardToken.balanceOf(user1.address);
      const expectedBasedReward = user1RewardBefore.add(user1RewardAfter);

      expect(basedBalanceAfter.sub(basedBalanceBefore)).to.equal(expectedBasedReward);
    });
  });
});

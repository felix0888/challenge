import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ETHPool, ETHPool__factory } from "../build/types";

describe("ETHPool", function () {
  let ethPool: ETHPool;
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let team: SignerWithAddress;
  let teamRole: string;

  beforeEach(async () => {
    [owner, alice, bob, team] = await ethers.getSigners();
    const ethPoolFactory = (await ethers.getContractFactory("ETHPool", owner)) as ETHPool__factory;
    ethPool = await ethPoolFactory.deploy();
    await ethPool.deployed();

    teamRole = await ethPool.TEAM_MEMBER();
  });

  describe("deploy", () => {
    it("should set the team member", async () => {
      expect(await ethPool.hasRole(teamRole, owner.address)).to.equal(true);
    });
  });

  describe("grantTeamRole", () => {
    it("should be reverted if non-owner tries", async () => {
      await expect(
        ethPool.connect(alice).grantTeamRole(team.address)
      ).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should grant team member role", async () => {
      await ethPool.grantTeamRole(team.address);
      expect(await ethPool.hasRole(teamRole, team.address)).to.equal(true);
    });
  });

  describe("revokeTeamRole", () => {
    beforeEach(async () => {
      await ethPool.grantTeamRole(team.address);
    });

    it("should be reverted if non-owner tries", async () => {
      await expect(
        ethPool.connect(alice).revokeTeamRole(team.address)
      ).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should revoke team member role", async () => {
      await ethPool.revokeTeamRole(team.address);
      expect(await ethPool.hasRole(teamRole, team.address)).to.equal(false);
    });
  });

  describe("deposit", async () => {
    it("should set the totalShare and userShare", async () => {
      await ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("100") });
      expect(await ethPool.userShares(alice.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await ethPool.totalShare()).to.equal(ethers.utils.parseEther("100"));

      await ethPool.connect(bob).deposit({ value: ethers.utils.parseEther("150") });
      expect(await ethPool.userShares(bob.address)).to.equal(ethers.utils.parseEther("150"));
      expect(await ethPool.totalShare()).to.equal(ethers.utils.parseEther("250"));

      await ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("180") });
      expect(await ethPool.userShares(alice.address)).to.equal(ethers.utils.parseEther("280"));
      expect(await ethPool.totalShare()).to.equal(ethers.utils.parseEther("430"));
    });

    it("should emit Deposit event", async () => {
      await expect(
        ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("100") })
      ).to.emit(
        ethPool, "Deposit"
      ).withArgs(
        alice.address, ethers.utils.parseEther("100")
      );
    });
  });

  describe("depositRewards", async () => {
    beforeEach(async () => {
      await ethPool.grantTeamRole(team.address);
    });

    it("should be revereted if non-team member tries", async () => {
      await expect(
        ethPool.connect(alice).depositRewards({ value: ethers.utils.parseEther("10") })
      ).to.be.reverted;
    });

    it("should accept reward deposit of team", async () => {
      expect(
        await ethPool.connect(team).depositRewards({ value: ethers.utils.parseEther("10") })
      ).to.changeEtherBalance(
        ethPool, ethers.utils.parseEther("10")
      );
    });

    it("should emit DepositRewards event", async () => {
      await expect(
        ethPool.connect(team).depositRewards({ value: ethers.utils.parseEther("10") })
      ).to.emit(
        ethPool, "DepositRewards"
      ).withArgs(
        team.address, ethers.utils.parseEther("10")
      );
    });
  });

  describe("withdraw", async () => {
    beforeEach(async () => {
      await ethPool.grantTeamRole(team.address);
    });

    it("case #1: a in 100, b in 300, t in 200 => a out 150, b out 450", async () => {
      await ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("100") });
      await ethPool.connect(bob).deposit({ value: ethers.utils.parseEther("300") });
      await ethPool.connect(team).depositRewards({ value: ethers.utils.parseEther("200") });

      expect(await ethPool.totalShare()).to.equal(ethers.utils.parseEther("400"));
      expect(await ethPool.userShares(alice.address)).to.equal(ethers.utils.parseEther("100"));
      expect(await ethPool.userShares(bob.address)).to.equal(ethers.utils.parseEther("300"));

      await expect(
        await ethPool.connect(alice).withdraw()
      ).to.changeEtherBalance(
        alice, ethers.utils.parseEther("150")
      );
      expect(await ethPool.totalShare()).to.equal(ethers.utils.parseEther("300"));
      expect(await ethPool.userShares(alice.address)).to.equal(0);
      expect(await ethPool.userShares(bob.address)).to.equal(ethers.utils.parseEther("300"));

      await expect(
        await ethPool.connect(bob).withdraw()
      ).to.changeEtherBalance(
        bob, ethers.utils.parseEther("450")
      );
      expect(await ethPool.totalShare()).to.equal(0);
      expect(await ethPool.userShares(alice.address)).to.equal(0);
      expect(await ethPool.userShares(bob.address)).to.equal(0);
    });

    it("case #2: a in 100, t in 200, b in 300 => a out 300, b out 300", async () => {
      await ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("100") });
      await ethPool.connect(team).depositRewards({ value: ethers.utils.parseEther("200") });
      await ethPool.connect(bob).deposit({ value: ethers.utils.parseEther("300") });

      await expect(
        await ethPool.connect(alice).withdraw()
      ).to.changeEtherBalance(
        alice, ethers.utils.parseEther("300")
      );

      await expect(
        await ethPool.connect(bob).withdraw()
      ).to.changeEtherBalance(
        bob, ethers.utils.parseEther("300")
      );
    });

    it("should emit Withdraw event", async () => {
      await ethPool.connect(alice).deposit({ value: ethers.utils.parseEther("100") });
      await ethPool.connect(team).depositRewards({ value: ethers.utils.parseEther("200") });

      await expect(
        ethPool.connect(alice).withdraw()
      ).to.emit(
        ethPool, "Withdraw"
      ).withArgs(
        alice.address, ethers.utils.parseEther("300")
      );
    });
  });
});

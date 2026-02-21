import { expect } from "chai";
import { ethers } from "hardhat";
import { TarsDAO } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TarsDAO", function () {
  let dao: TarsDAO;
  let owner: SignerWithAddress;
  let verifier: SignerWithAddress;
  let agent: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  
  const MINIMUM_STAKE = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, verifier, agent, beneficiary] = await ethers.getSigners();
    
    const TarsDAO = await ethers.getContractFactory("TarsDAO");
    dao = await TarsDAO.deploy();
    await dao.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const DEFAULT_ADMIN_ROLE = await dao.DEFAULT_ADMIN_ROLE();
      expect(await dao.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should mint initial supply to contract", async function () {
      const balance = await dao.balanceOf(await dao.getAddress());
      expect(balance).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Join as Verifier", function () {
    it("Should allow joining with sufficient stake", async function () {
      await expect(dao.connect(verifier).joinAsVerifier({ value: MINIMUM_STAKE }))
        .to.emit(dao, "VerifierJoined")
        .withArgs(verifier.address);

      const VERIFIER_ROLE = await dao.VERIFIER_ROLE();
      expect(await dao.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
      expect(await dao.stakedAmount(verifier.address)).to.equal(MINIMUM_STAKE);
    });

    it("Should fail with insufficient stake", async function () {
      await expect(
        dao.connect(verifier).joinAsVerifier({ value: ethers.parseEther("50") })
      ).to.be.revertedWith("Insufficient stake");
    });

    it("Should transfer TARS tokens to verifier", async function () {
      await dao.connect(verifier).joinAsVerifier({ value: MINIMUM_STAKE });
      const balance = await dao.balanceOf(verifier.address);
      expect(balance).to.equal(MINIMUM_STAKE);
    });
  });

  describe("Join as Agent", function () {
    it("Should allow joining as agent", async function () {
      await expect(dao.connect(agent).joinAsAgent())
        .to.emit(dao, "AgentJoined")
        .withArgs(agent.address);

      const AGENT_ROLE = await dao.AGENT_ROLE();
      expect(await dao.hasRole(AGENT_ROLE, agent.address)).to.be.true;
    });

    it("Should transfer TARS tokens to agent", async function () {
      await dao.connect(agent).joinAsAgent();
      const balance = await dao.balanceOf(agent.address);
      expect(balance).to.equal(MINIMUM_STAKE / 2n);
    });
  });

  describe("Create Cause", function () {
    beforeEach(async function () {
      await dao.connect(verifier).joinAsVerifier({ value: MINIMUM_STAKE });
    });

    it("Should allow verifier to create cause", async function () {
      const imageHash = ethers.keccak256(ethers.toUtf8Bytes("test-image"));
      const description = "Help disaster victims";
      const amount = ethers.parseEther("10");

      await expect(
        dao.connect(verifier).createCause(imageHash, description, amount, beneficiary.address)
      ).to.emit(dao, "CauseCreated");
    });

    it("Should fail if not authorized", async function () {
      const imageHash = ethers.keccak256(ethers.toUtf8Bytes("test-image"));
      
      await expect(
        dao.connect(beneficiary).createCause(
          imageHash,
          "test",
          ethers.parseEther("10"),
          beneficiary.address
        )
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Verify Cause", function () {
    let causeId: string;

    beforeEach(async function () {
      await dao.connect(verifier).joinAsVerifier({ value: MINIMUM_STAKE });
      
      const imageHash = ethers.keccak256(ethers.toUtf8Bytes("test-image"));
      const tx = await dao.connect(verifier).createCause(
        imageHash,
        "Test cause",
        ethers.parseEther("10"),
        beneficiary.address
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => {
        try {
          return dao.interface.parseLog(log)?.name === "CauseCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = dao.interface.parseLog(event);
        causeId = parsed?.args[0];
      }
    });

    it("Should allow verifier to verify cause", async function () {
      await expect(dao.connect(verifier).verifyCause(causeId))
        .to.emit(dao, "CauseVerified")
        .withArgs(causeId, verifier.address);
    });
  });
});

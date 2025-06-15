import { expect } from "chai";
import { ethers } from "hardhat";
import { AlohaToken } from "../typechain-types";

// add helper
const getId = (alias: string) =>
  ethers.solidityPackedKeccak256(["string"], [alias]);

describe("AlohaToken", function () {
  let alohaToken: AlohaToken;
  let owner: any, addr1: any, addr2: any, addr3: any, addr4: any;
  const surfer1ID = getId("Surfer1");
  const surfer2ID = getId("Surfer2");
  const surfer3ID = getId("Surfer3");
  const surfer4ID = getId("Surfer4");
  const surfer5ID = getId("Surfer5");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AlohaToken");
    alohaToken = (await Factory.deploy(
      owner.address,
      1,               // minApprovals
      24 * 60 * 60,    // surferAddTimeInterval
      24 * 60 * 60,    // sessionAddTimeInterval
      [addr1.address, addr2.address, addr3.address],
      ["Surfer1", "Surfer2", "Surfer3"],
      ["QmProfileHash1", "QmProfileHash2", "QmProfileHash3"]
    )) as AlohaToken;

    // initial mutual approvals (now by surferId)
    await alohaToken.connect(addr1).approveSurfers([surfer2ID]);
    await alohaToken.connect(addr2).approveSurfers([surfer1ID]);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await alohaToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await alohaToken.balanceOf(owner.address);
      expect(await alohaToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await alohaToken.name()).to.equal("Aloha");
      expect(await alohaToken.symbol()).to.equal("ALH");
    });
  });

  describe("Surfer Management", function () {
    it("Should add and approve a new surfer", async function () {
      await alohaToken.connect(addr4).addSurfer("Surfer4", "QmProfileHash4");

      const signers = [addr1, addr2];
      const signatures = await Promise.all(
        signers.map(async signer => {
          return signer.signMessage(ethers.getBytes(surfer4ID));
        })
      );

      expect((await alohaToken.getSurferByID(surfer4ID)).approvals.length).to.equal(0);

      await alohaToken
        .connect(addr1)
        .approveSurferWithSignatures(
          surfer4ID,
          signers.map(s => s.address),
          signatures
        );

      const approvalsList = (await alohaToken.getSurferByID(surfer4ID)).approvals;
      expect(approvalsList).to.deep.equal([surfer1ID, surfer2ID]);

      // check individual status using alias mapping
      for (const signer of signers) {
        const fromId = await alohaToken.surferIDByAddress(signer.address);
        expect(
          await alohaToken.getSurferApproval(fromId, surfer4ID)
        ).to.be.true;
      }

      const surfer = await alohaToken.getSurferByID(surfer4ID);
      expect(surfer.owner).to.equal(addr4.address);
      expect(surfer.offchainInfoHash).to.equal("QmProfileHash4");
    });

    it("Should delete a surfer", async function () {
      await alohaToken.connect(owner).deleteSurfer(surfer1ID, 0);
      expect(await alohaToken.isSurferByID(surfer1ID)).to.be.false;
    });

    it("Should edit a surfer by owner", async function () {
      await alohaToken
        .connect(owner)
        .editSurfer(surfer1ID, 0, addr4.address, "QmNewProfileHash");
      const surfer = await alohaToken.getSurferByID(surfer1ID);
      expect(surfer.owner).to.equal(addr4.address);
      expect(surfer.offchainInfoHash).to.equal("QmNewProfileHash");
    });

    it("Should edit a surfer by themselves", async function () {
      await alohaToken
        .connect(addr1)
        .editSurfer(surfer1ID, 0, addr1.address, "QmUpdatedProfileHash");
      const surfer = await alohaToken.getSurferByID(surfer1ID);
      expect(surfer.owner).to.equal(addr1.address);
      expect(surfer.offchainInfoHash).to.equal("QmUpdatedProfileHash");
    });

    it("Should reject edits by non-owner/non-surfer", async function () {
      await expect(
        alohaToken
          .connect(addr2)
          .editSurfer(surfer1ID, 0, addr3.address, "QmNope")
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Surf Sessions", function () {
    it("Should add a surf session and mint/burn correctly", async function () {
      const signers = [addr1, addr2];
      const sessionTime = 1000000000;
      const signatures = await Promise.all(signers.map(async (signer) => {
        const messageHash = ethers.solidityPackedKeccak256(["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"], [[surfer1ID,surfer2ID],[5, 3], surfer1ID, surfer2ID, sessionTime, "QmSessionInfoHash"]);
        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
      }));

      await alohaToken.connect(addr1).addSurfSessionWithSignatures([surfer1ID, surfer2ID], [5, 3], surfer1ID, surfer2ID, sessionTime, signatures, "QmSessionInfoHash");

      expect(await alohaToken.balanceOf(addr1.address)).to.equal(ethers.parseUnits("10", 18));
      expect(await alohaToken.balanceOf(addr2.address)).to.equal(ethers.parseUnits("0", 18)); // 3 tokens burned

      const sessions = await alohaToken.getSurfSessions();
      expect(sessions.length).to.equal(1);
      const sessionAdded = await alohaToken.getSurfSession(sessions[0]);
      expect(sessionAdded.sessionTime).to.equal(sessionTime);
      expect(sessionAdded.offchainInfoHash).to.equal("QmSessionInfoHash");
      expect(sessionAdded.waves).to.deep.equal([5, 3]);
      expect(sessionAdded.approvals.length).to.equal(2);

    });

    it("Should fail adding a duplicated session", async function () {
      const signers = [addr1, addr2];
      const sessionTime = 1000000000;
      const signatures = await Promise.all(signers.map(async (signer) => {
        const messageHash = ethers.solidityPackedKeccak256(["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"], [[surfer1ID,surfer2ID],[5, 3], surfer1ID, surfer2ID, sessionTime, "QmSessionInfoHash"]);
        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
      }));

      await alohaToken.connect(addr1).addSurfSessionWithSignatures([surfer1ID, surfer2ID], [5, 3], surfer1ID, surfer2ID, sessionTime, signatures, "QmSessionInfoHash");

      //increase time
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);

      await expect(
        alohaToken.connect(addr1).addSurfSessionWithSignatures([surfer1ID, surfer2ID], [5, 3], surfer1ID, surfer2ID, sessionTime, signatures, "QmSessionInfoHash")
      ).to.be.revertedWith("Session already exists");
      
    });

    it("Should fail to add a surf session if session time interval limit exceeded", async function () {
      const signers = [addr1, addr2];
      const firstSessionTime = 1;
      const secondSessionTime = 2;

      let signatures = await Promise.all(signers.map(async (signer) => {
        const messageHash = ethers.solidityPackedKeccak256(["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"], [[surfer1ID,surfer2ID],[5, 3], surfer1ID, surfer2ID, firstSessionTime, "QmSessionInfoHash"]);
        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
      }));

      await alohaToken.connect(addr1).addSurfSessionWithSignatures([surfer1ID, surfer2ID], [5, 3], surfer1ID, surfer2ID, firstSessionTime, signatures, "QmSessionInfoHash");


      signatures = await Promise.all(signers.map(async (signer) => {
        const messageHash = ethers.solidityPackedKeccak256(["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"], [[surfer1ID,surfer2ID],[5, 3], surfer1ID, surfer2ID, secondSessionTime, "QmSessionInfoHash"]);
        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
      }));

      await expect(
        alohaToken.connect(addr1).addSurfSessionWithSignatures([surfer1ID, surfer2ID], [5, 3], surfer1ID, surfer2ID, secondSessionTime, signatures, "QmSessionInfoHash")
      ).to.be.revertedWith("Session time interval limit exceeded");
    });
  });

  describe("Minting and Burning", function () {
    it("Should allow only owner to mint", async function () {
      await alohaToken.mint(addr1.address, 500);
      expect(await alohaToken.balanceOf(addr1.address)).to.equal(500);
      await expect(
        alohaToken.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWithCustomError(alohaToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow only owner to burn", async function () {
      await alohaToken.mint(addr1.address, 500);
      await alohaToken.burn(addr1.address, 200);
      expect(await alohaToken.balanceOf(addr1.address)).to.equal(300);
      await expect(
        alohaToken.connect(addr1).burn(addr2.address, 100)
      ).to.be.revertedWithCustomError(alohaToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to set minimum approvals", async function () {
      await alohaToken.setMinApprovals(5);
      expect(await alohaToken.minApprovals()).to.equal(5);
    });

    it("Should allow owner to set surfer add interval", async function () {
      await alohaToken.setSurferAddInterval(2 * 24 * 60 * 60); // 2 days
      expect(await alohaToken.surferAddTimeInterval()).to.equal(2 * 24 * 60 * 60);
    });

    it("Should allow owner to set session add interval", async function () {
      await alohaToken.setSessionAddTimeInterval(2 * 24 * 60 * 60); // 2 days
      expect(await alohaToken.sessionAddTimeInterval()).to.equal(2 * 24 * 60 * 60);
    });
  });

  describe("Token Transfer", function () {
    it("Should revert token transfers", async function () {
      await expect(
        alohaToken.transfer(addr1.address, 100)
      ).to.be.revertedWith("Token is non-transferable");

      await expect(
        alohaToken.transferFrom(addr1.address, addr2.address, 100)
      ).to.be.revertedWith("Token is non-transferable");

      await expect(
        alohaToken.connect(addr1).transfer(addr2.address, 50)
      ).to.be.revertedWith("Token is non-transferable");
    });
  });

  describe("Getters", function () {
    it("should return correct surfer list", async function () {
      const list = await alohaToken.getSurferList();
      expect(list).to.deep.equal([surfer1ID, surfer2ID, surfer3ID]);
    });

    it("should return correct surfer approvals info", async function () {
      const approvalStatus = await alohaToken.getSurferApproval(
        surfer1ID,
        surfer2ID
      );
      expect(approvalStatus).to.be.true;
    });

    it("should return correct surf sessions info", async function () {
      const signers = [addr1, addr2];
      const sessionTime = 1000000000;
      const signatures = await Promise.all(signers.map(async (signer) => {
        const messageHash = ethers.solidityPackedKeccak256(["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"], [[surfer1ID,surfer2ID],[5, 3], surfer1ID, surfer2ID, sessionTime, "QmSessionInfoHash"]);

        const signature = await signer.signMessage(ethers.getBytes(messageHash));
        return signature;
      }));

      await alohaToken.connect(addr1).addSurfSessionWithSignatures(
        [surfer1ID, surfer2ID],
        [5, 3],
        surfer1ID,
        surfer2ID,
        sessionTime,
        signatures,
        "QmSessionInfoHash"
      );

      const sessions = await alohaToken.getSurfSessions();
      expect(sessions.length).to.equal(1);
    });

  });

  describe("Edge Cases and Coverage", function () {
    it("Should revert approveSurfers when given empty array", async function () {
      await expect(
        alohaToken.connect(addr1).approveSurfers([])
      ).to.be.revertedWith("Not enough approvals");
    });

    it("Should revert addSurfer with empty alias or hash, or too soon", async function () {
      // empty alias
      await expect(
        alohaToken.connect(addr4).addSurfer("", "QmHash")
      ).to.be.revertedWith("Alias cannot be empty");
      // empty hash
      await expect(
        alohaToken.connect(addr4).addSurfer("Surfer4", "")
      ).to.be.revertedWith("offchainInfoHash cannot be empty");

      // first valid add
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      await alohaToken.connect(addr4).addSurfer("surfer4", "QmHash4");

      // too soon
      await expect(
        alohaToken.connect(addr3).addSurfer("Surfer5", "QmHash5")
      ).to.be.revertedWith("Only one surfer can be added per day");
    });

    it("Should add & finalize a surf session via addSurfSession + approveSurfSession", async function () {
      // prepare a 3-surfer session
      const sessionTime = (await ethers.provider.getBlock("latest")).timestamp - 1;
      await alohaToken.connect(addr1).addSurfSession(
        [surfer1ID, surfer2ID, surfer3ID], [2, 1, 1], surfer1ID,surfer2ID, sessionTime, 0, "QmSeshHash"
      );
      const sessionHash = ethers.solidityPackedKeccak256(
        ["bytes32[]","uint256[]","bytes32","bytes32","uint256","string"],
        [[surfer1ID,surfer2ID,surfer3ID],[2,1,1],surfer1ID,surfer2ID,sessionTime,"QmSeshHash"]
      );
      // The address that created the session already approved it
      await expect(
        alohaToken.connect(addr1).approveSurfSession(sessionHash, 0)
      ).revertedWith("Already approved");

      await alohaToken.connect(addr2).approveSurfSession(sessionHash, 1);

      // finalize by second surfer
      await expect(
        alohaToken.connect(addr3).approveSurfSession(sessionHash, 2)
      ).to.emit(alohaToken, "SurfSessionFinalized");
      // check minted tokens: 2*1e18 to surfer1, 1*1e18 to surfer2
      expect(await alohaToken.balanceOf(addr1.address)).to.equal(ethers.parseUnits("7",18));
      expect(await alohaToken.balanceOf(addr2.address)).to.equal("0");
    });

    it("Should revert approveSurfSession twice for same index", async function () {
      const sessionTime = (await ethers.provider.getBlock("latest")).timestamp - 1;
      // new session with only addr1 approving
      const bytes32null = ethers.encodeBytes32String("");
      await alohaToken.connect(addr1).addSurfSession(
        [surfer1ID,surfer2ID], [1,1], bytes32null, bytes32null, sessionTime, 0, "QmHashX"
      );
      // fast-forward
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);
      // approve by surfer2
      const hashX = ethers.solidityPackedKeccak256(
        ["bytes32[]", "uint256[]","bytes32","bytes32","uint256","string"], [[surfer1ID,surfer2ID],[1,1],bytes32null,bytes32null,sessionTime,"QmHashX"]
      );
      await alohaToken.connect(addr2).approveSurfSession(hashX,1);
      // second time should revert
      await expect(
        alohaToken.connect(addr2).approveSurfSession(hashX,1)
      ).to.be.revertedWith("Already approved");
    });

    it("Should return surfer struct via getSurfer and getSurfSession info", async function () {
      const info = await alohaToken.getSurfer(surfer1ID);
      expect(info.owner).to.equal(addr1.address);
      expect(info.offchainInfoHash).to.equal("QmProfileHash1");
      expect(info.surferAlias).to.equal("Surfer1");
      expect(info.surferApprovals.length).to.equal(1);
      expect(info.surferApprovals[0]).to.equal(surfer2ID);

      const sessions = await alohaToken.getSurfSessions();
      for (const h of sessions) {
        const sess = await alohaToken.getSurfSession(h);
        expect(sess.sessionTime).to.be.a("number");
        expect(sess.offchainInfoHash).to.not.be.empty;
      }
    });
  });

  describe("Surf Sessions (signature approvals)", function () {
    const waves = [3, 4];
    const infoHash = "QmSigHash";

    let sessionTime: number;
    let sessionHash: string;

    beforeEach(async function () {
      // build a session with one automatic approval (index 0 by addr1)
      sessionTime = (await ethers.provider.getBlock("latest")).timestamp - 1;
      await alohaToken.connect(addr1).addSurfSession(
        [surfer1ID,surfer2ID],
        waves,
        surfer1ID,surfer2ID, sessionTime,
        0,
        infoHash
      );
      sessionHash = ethers.solidityPackedKeccak256(
        ["bytes32[]","uint256[]","bytes32","bytes32","uint256","string"],
        [[surfer1ID,surfer2ID],waves, surfer1ID,surfer2ID, sessionTime, infoHash]
      );
    });

    it("Should approve & finalize via approveSurfSessionWithSignatures", async function () {
      const sig2 = await addr2.signMessage(ethers.getBytes(sessionHash));
      await expect(
        alohaToken.connect(addr1)
          .approveSurfSessionWithSignatures(
            sessionHash,
            [1],
            [sig2]
          )
      )
        .to.emit(alohaToken, "SurfSessionFinalized");
      // both surfers get minted wave tokens
      expect(await alohaToken.balanceOf(addr1.address))
        .to.equal(ethers.parseUnits("8", 18));
      expect(await alohaToken.balanceOf(addr2.address))
        .to.equal(ethers.parseUnits("1", 18));
    });

    it("Should revert on invalid signature", async function () {
      // signer addr1 signs for index 1 – should fail
      const badSig = await addr1.signMessage(ethers.getBytes(sessionHash));
      await expect(
        alohaToken.connect(addr1)
          .approveSurfSessionWithSignatures(
            sessionHash,
            [1],
            [badSig]
          )
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should revert when called by non-surfer", async function () {
      const sig2 = await addr2.signMessage(ethers.getBytes(sessionHash));
      await expect(
        alohaToken.connect(addr4)
          .approveSurfSessionWithSignatures(
            sessionHash,
            [1],
            [sig2]
          )
      ).to.be.revertedWith("Not a surfer");
    });
  });
});
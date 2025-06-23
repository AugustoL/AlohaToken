import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import env, { ethers } from "hardhat";
import { AlohaToken } from "../typechain-types";
import { PinataSDK } from "pinata";
const { vars } = require("hardhat/config");

export async function main() {
  
  const pinata = new PinataSDK({
    pinataJwt: vars.get("PINATA_JWT"),
    pinataGateway: vars.get("PINATA_GATEWAY")
  })

  const getId = (alias: string) =>
    ethers.solidityPackedKeccak256(["string"], [alias]);
  
  let alohaToken: AlohaToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addr3: HardhatEthersSigner;
  let addr4: HardhatEthersSigner;

  const augustoProfile = {
    id: getId("Viking"),
    name: "Augusto Lemble",
    alias: "Viking",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Shortboard", "Longboard"],
    surfboards: ["Shortboard 6'0 35L", "Midlength 6'10 44L"]
  };

  const gonzaProfile = {
    id: getId("GonzaHo"),
    name: "Gonzalo",
    alias: "GonzaHo",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Longboard"],
    surfboards: ["Longboard 9'0 55L"]
  };
  const ezeProfile = {
    id: getId("Ezes"),
    name: "Ezequiel",
    alias: "Ezes",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Shortboard", "Longboard"],
    surfboards: ["Shortboard 6'0 35L", "Longboard 8'0 48L"]
  };

  const augustoProfileIPFS = await pinata.upload.public.json(augustoProfile);
  const gonzaProfileIPFS = await pinata.upload.public.json(gonzaProfile);
  const ezeProfileIPFS = await pinata.upload.public.json(ezeProfile);

  [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  // Deploy the Aloha token
  const AlohaTokenFactory = await ethers.getContractFactory("AlohaToken");
  alohaToken = await AlohaTokenFactory.deploy(
    owner.address,
    1,               // minApprovals
    24 * 60 * 60,    // surferAddTimeInterval
    24 * 60 * 60,    // sessionAddTimeInterval
    [addr1.address, addr2.address, addr3.address],
    [augustoProfile.alias, gonzaProfile.alias, ezeProfile.alias],
    [augustoProfileIPFS.cid, gonzaProfileIPFS.cid, ezeProfileIPFS.cid],
  ) as unknown as AlohaToken;
  
  await alohaToken.waitForDeployment();
  const tokenAddress = await alohaToken.getAddress();
  
  console.log("Aloha token deployed to:", tokenAddress);

  await alohaToken.connect(addr1).approveSurfers([gonzaProfile.id]);
  await alohaToken.connect(addr2).approveSurfers([augustoProfile.id, ezeProfile.id]);

  const surfSessionData = {
    date: "2024-10-01",
    location: "Playa Grande, Mar del Plata",
    conditions: {
      wind: "North - Light",
      size: "1.5m",
      tide: "Low",
    },
    surfers: [augustoProfile.id, gonzaProfile.id, ezeProfile.id],
    waves: [15,1,7],
    duration: 120,
    sessionType: "Free Surf",
    bestSurfer: gonzaProfile.id,
    kookSurfer: getId("Ezes"),
  };
  const surfSession = await pinata.upload.public.json(surfSessionData);

  //get unix time of 10 of march
  const sessionTime = Math.floor((new Date("2024-10-01")).getTime() / 1000);
  const signatures = await Promise.all(
    [addr1, addr2, addr3].map(async (signer) => {
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"],
        [[augustoProfile.id, gonzaProfile.id, ezeProfile.id], [15,1,7], gonzaProfile.id, ezeProfile.id, sessionTime, surfSession.cid]);
      const signature = await signer.signMessage(ethers.getBytes(messageHash));
    return signature;
  }));

  await alohaToken.connect(addr1).addSurfSessionWithSignatures(
    [augustoProfile.id, gonzaProfile.id, ezeProfile.id],
    [15,1,7],
    gonzaProfile.id,
    ezeProfile.id,
    sessionTime,
    signatures,
    surfSession.cid
  );
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
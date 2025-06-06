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
  
  let alohaToken: AlohaToken;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let addr3: HardhatEthersSigner;
  let addr4: HardhatEthersSigner;
  const augustoAddress = "0x6e0255A0ECc222a891f3EE8Cb7Bfc33aaD9f6071"; 

  const augustoProfile = await pinata.upload.public.json({
    name: "Augusto Lemble",
    alias: "Viking",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Shortboard", "Longboard"],
  });

  const gonzaProfile = await pinata.upload.public.json({
    name: "Gonzalo",
    alias: "GonzaHo",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Longboard"],
  });
  const ezeProfile = await pinata.upload.public.json({
    name: "Ezequiel",
    alias: "Ezes",
    birthdate: "1991-01-01",
    stance: "Regular",
    country: "Argentina",
    city: "Mar del Plata",
    styles: ["Shortboard", "Longboard"],
  });

  [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  // Deploy the Aloha token
  const AlohaTokenFactory = await ethers.getContractFactory("AlohaToken");
  alohaToken = await AlohaTokenFactory.deploy(
    owner.address,
    [addr1.address, addr2.address, addr3.address],
    ["Viking", "GonzaHo", "Ezes"],
    [augustoProfile.cid, gonzaProfile.cid, ezeProfile.cid],
  ) as unknown as AlohaToken;
  
  await alohaToken.waitForDeployment();
  const tokenAddress = await alohaToken.getAddress();
  
  console.log("Aloha token deployed to:", tokenAddress);

  const surfSessionData = {
    date: "2023-10-01",
    location: "Playa Grande, Mar del Plata",
    conditions: {
      wind: "Light",
      swell: "Medium",
      tide: "Low",
    },
    surfers: [addr1.address, addr2.address, addr3.address],
    waves: [15,1,7],
    duration: 120,
    sessionType: "Free Surf",
    bestSurfer: addr2.address,
    kookSurfer: addr3.address,
  };
  const surfSession = await pinata.upload.public.json(surfSessionData);

  //get unix time of 10 of march
  const sessionTime = Math.floor((new Date("2024-10-01")).getTime() / 1000);
  const signatures = await Promise.all(
    [addr1, addr2, addr3].map(async (signer) => {
      const messageHash = ethers.solidityPackedKeccak256(
        ["address[]", "uint256[]", "address", "address", "uint256"],
        [[addr1.address, addr2.address,addr3.address], [15,1,7], addr2.address, addr3.address, sessionTime]);
      const signature = await signer.signMessage(ethers.getBytes(messageHash));
    return signature;
  }));

  await alohaToken.connect(addr1).addSurfSession(
    [addr1.address, addr2.address,addr3.address],
    [15,1,7],
    addr2.address,
    addr3.address,
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
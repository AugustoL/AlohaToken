import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { AlohaToken } from "../typechain-types";

export async function main() {

  const uploadToIPFS = async (data: any): Promise<string> => {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const file = new File([blob], "data.json", { type: "application/json" });
    const formData = new FormData();
    formData.append('file', file);

    const filebaseApiKey = process.env.FILEBASE_API_KEY;
    const res = await fetch('https://rpc.filebase.io/api/v0/add', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${filebaseApiKey}`,
      },
      body: formData,
    });
    if (!res.ok) throw new Error(`IPFS upload failed: ${res.statusText}`);
    const json = await res.json();
    return json.Hash;
  };

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

  const augustoProfileIPFS = await uploadToIPFS(augustoProfile);
  const gonzaProfileIPFS = await uploadToIPFS(gonzaProfile);
  const ezeProfileIPFS = await uploadToIPFS(ezeProfile);

  [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

  // Deploy the Aloha token
  const AlohaTokenFactory = await ethers.getContractFactory("AlohaToken");
  alohaToken = await AlohaTokenFactory.deploy(
    owner.address,
    1,               // minApprovals
    60,    // surferAddTimeInterval
    60,    // sessionAddTimeInterval
    [addr1.address, addr2.address, addr3.address],
    [augustoProfile.alias, gonzaProfile.alias, ezeProfile.alias],
    [augustoProfileIPFS, gonzaProfileIPFS, ezeProfileIPFS],
  ) as unknown as AlohaToken;
  
  await alohaToken.waitForDeployment();
  const tokenAddress = await alohaToken.getAddress();
  
  console.log("Aloha token deployed to:", tokenAddress);

  await alohaToken.connect(addr1).approveSurfers([gonzaProfile.id]);
  await alohaToken.connect(addr2).approveSurfers([augustoProfile.id, ezeProfile.id]);

  const surfSessionData = {
    surfers: [
      { id: augustoProfile.id, alias: augustoProfile.alias},
      { id: gonzaProfile.id, alias: gonzaProfile.alias},
      { id: ezeProfile.id, alias: ezeProfile.alias},
    ],
    waves: [15,1,7],
    bestSurfer: gonzaProfile.id,
    kookSurfer: ezeProfile.id,
    offchainInfo: {
      sessionType: "Free Surf",
      conditions: {
        wind: "North - Light",
        size: "1.5m",
        tide: "Low",
      },
      date: "2024-10-01",
      location: "Playa Grande, Mar del Plata",
      duration: 120,
    }
  };
  const surfSessionHash = await uploadToIPFS(surfSessionData);

  //get unix time of 10 of march
  const sessionTime = Math.floor((new Date("2024-10-01")).getTime() / 1000);
  const signatures = await Promise.all(
    [addr1, addr2, addr3].map(async (signer) => {
      const messageHash = ethers.solidityPackedKeccak256(
        ["bytes32[]", "uint256[]", "bytes32", "bytes32", "uint256", "string"],
        [[augustoProfile.id, gonzaProfile.id, ezeProfile.id], [15,1,7], gonzaProfile.id, ezeProfile.id, sessionTime, surfSessionHash]);
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
    surfSessionHash
  );
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
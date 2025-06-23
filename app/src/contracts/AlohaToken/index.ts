import contractJson from './contract.json';
import { MinimalSurfSessionInfo, SurferInfo, SurfSession, SurferInfoOffchain } from '../../types/types';
import { Abi } from 'viem';
import { pinataURL } from '../../utils/constants';
import { readContract, http, createConfig, writeContract, getAccount } from '@wagmi/core'
import { config } from '../../config';
import { PinataSDK } from 'pinata';

export const networkConfig = config;

export const alohaTokenConfig = {
  address: "0x5fbdb2315678afecb367f032d93f642f64180aa3" as `0x${string}`,
  abi: contractJson.abi as Abi,
};

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || '',
  pinataGateway: process.env.PINATA_GATEWAY || ''
})

export const fetchOffchainData = async (offchainHash: String) => {
  const dataFetch = await fetch(pinataURL+offchainHash);
  return await dataFetch.json();
};

export const uploadToIPFS = async (data: any): Promise<string> => {
  const result = await pinata.upload.public.json(data);
  return result.cid;
};


export const fetchSessionsHashes = async (): Promise<MinimalSurfSessionInfo[]> => {
  const result = await readContract(networkConfig, {
    ...alohaTokenConfig,
    functionName: "getSurfSessions"
  });
  return (result as string[]).map((sessionHash) => ({id: sessionHash}));
};

export const fetchSurfers = async (filter = {
  fetchBalance: false
}): Promise<SurferInfo[]> => {
  const result = await readContract(networkConfig, {
    ...alohaTokenConfig,
    functionName: "getSurfersList"
  });
  const surfersIDs = result || [];
  const surferList = await Promise.all((surfersIDs as string[]).map(async (surfer) => {
    return await fetchSurfer(surfer, {
      fetchBalance: filter.fetchBalance,
      fetchApprovals: false,
      fetchOffchainInfo: false
    });
  }));
  return surferList;
};

export const fetchSurfer = async (surferId, filter = {
  fetchBalance: false,
  fetchApprovals: false,
  fetchOffchainInfo: false
}): Promise<SurferInfo> => {
  let fetchSurferCall = await readContract(networkConfig, {
    ...alohaTokenConfig,
    functionName: "getSurfer",
    args: [surferId],
  });
  const surferInfo = {
    owner: fetchSurferCall[0] as `0x${string}`,
    surferAlias: fetchSurferCall[1] as string,
    surferApprovals: fetchSurferCall[2] as string[],
    offchainInfoHash: fetchSurferCall[3] as string
  };
  let approvals = [];
  if (filter.fetchApprovals) {
    approvals = await Promise.all(surferInfo.surferApprovals.map(async (approverID) => {
      return {
        alias: (await readContract(networkConfig, {
          ...alohaTokenConfig,
          functionName: "getSurfer",
          args: [approverID],
        }))[1] as string,
        id: approverID
      };
    }));
  }
  
  const offchainInfo = (filter.fetchOffchainInfo) ? await fetchOffchainData(surferInfo.offchainInfoHash) : null;
  return {
    alias: surferInfo.surferAlias,
    address: surferInfo.owner,
    balance: (filter.fetchBalance) ? String((await readContract(networkConfig, {
      ...alohaTokenConfig,
      functionName: "balanceOf",
      args: [surferInfo.owner],
    })) || '') : '',
    id: surferId,
    offchainInfoHash: surferInfo.offchainInfoHash,
    approvals: approvals|| [],
    offchainInfo
  };
};

export const fetchSurferByAddress = async (address: string, filter = {
  fetchBalance: false,
  fetchApprovals: false,
  fetchOffchainInfo: false
}): Promise<SurferInfo> => {
  const surferId = (await readContract(networkConfig, {
    ...alohaTokenConfig,
    functionName: "surferIDByAddress",
    args: [address],
  })) as string;
  if (!surferId) {
    throw new Error(`Surfer with address ${address} not found`);
  }
  return await fetchSurfer(surferId, filter);
};

export const fetchSessionInfo = async (sessionId): Promise<SurfSession> => {
  const surfSessionInfo = await readContract(networkConfig, {
    ...alohaTokenConfig,
    functionName: "getSurfSession",
    args: [sessionId],
  }) as {
    offchainInfoHash: string,
    approved: boolean,
    surfers: string[],
    waves: number[],
    bestWaveSurfer: string,
    kookSurfer: string,
    sessionTime: number,
    approvals: boolean[]
  };
  console.log("Surf Session Info Call:", surfSessionInfo);
  const offchainInfo = await fetchOffchainData(surfSessionInfo.offchainInfoHash);
  console.log("offchain Info Call:", offchainInfo);

  const surfers = await Promise.all(offchainInfo.surfers.map(async (surferId) => {
    return await fetchSurfer(surferId, {
      fetchBalance: false,
      fetchApprovals: false,
      fetchOffchainInfo: false
    });
  }));
  const surferApprovals = surfSessionInfo.approvals.map((approval, i) => {
    if (approval)
      return surfers[i];
  });
  return {
    id: sessionId,
    approved: surfSessionInfo.approved,
    surfers,
    waves: surfSessionInfo.waves,
    bestWaveSurfer: surfers.find((surfer) => surfer.id == surfSessionInfo.bestWaveSurfer),
    kookSurfer: surfers.find((surfer) => surfer.id == surfSessionInfo.kookSurfer),
    sessionTime: offchainInfo.sessionTime,
    approvals: surferApprovals,
    offchainInfoHash: surfSessionInfo.offchainInfoHash,
    offchainInfo: {
      date: offchainInfo.date,
      location: offchainInfo.location,
      conditions: offchainInfo.conditions,
      duration: offchainInfo.duration,
      sessionType: offchainInfo.sessionType
    }
  };
};

export const approveSurfers = async (surferIds: string[]): Promise<void> => {
  const { address: account } = getAccount(networkConfig);
  const result = await writeContract(networkConfig, {
    ...alohaTokenConfig,
    account,
    chain: config.chains[0],
    functionName: "approveSurfers",
    args: [surferIds],
  });
};

export const registerSurfer = async (
  surferName: string,
  surferAlias: string,
  country: string,
  city: string,
  birthdate: string,
  stance: string,
  surfStyle: string[],
  surfboards: string[]
): Promise<void> => {
  const { address: account } = getAccount(networkConfig);
  const SurferInfoOffchain: SurferInfoOffchain = {
    name: surferName,
    country,
    city,
    birthdate,
    stance,
    styles: surfStyle,
    surfboards
  };
  const offchainHash = await uploadToIPFS(SurferInfoOffchain);
  const result = await writeContract(networkConfig, {
    ...alohaTokenConfig,
    account,
    chain: config.chains[0],
    functionName: "registerSurfer",
    args: [surferAlias, offchainHash],
  });
};
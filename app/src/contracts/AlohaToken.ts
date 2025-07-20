import AlohaTokenJson from './AlohaToken.json';
import { MinimalSurfSessionInfo, SurferInfo, SurfSession, SurferInfoOffchain } from '../types/aloha';
import { Abi } from 'viem';
import { readContract, writeContract, getAccount, getPublicClient } from '@wagmi/core'
import { networkConfig } from '../utils/networkConfig';
import { fetchOffchainData, uploadToIPFS } from '../utils/ipfs';
import { generateSurfSessionHash } from '../utils/alohaToken';

export interface HistoryAction {
  id: string;
  type: 'session_added' | 'session_approved_by_surfer' | 'session_finalized' | 'surfer_approved' | 'approval_received' | 'surfer_added';
  timestamp: Date;
  actor: string; // The surfer who performed the action
  target?: string; // The target of the action (another surfer, session, etc.)
  details: string;
  txHash?: string;
  blockNumber: number;
  rawLog: any; // Raw log data for debugging
}

export const alohaTokenConfig = {
  address: "0x5fbdb2315678afecb367f032d93f642f64180aa3" as `0x${string}`,
  abi: AlohaTokenJson.abi as Abi,
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

  const surferApprovals = surfSessionInfo.approvals.map((approval, i) => {
    if (approval)
      return offchainInfo.surfers[i];
  }).filter((approval) => approval !== undefined);
  return {
    id: sessionId,
    approved: surfSessionInfo.approved,
    surfers: offchainInfo.surfers,
    waves: surfSessionInfo.waves,
    bestWaveSurfer: offchainInfo.surfers.find((surfer) => surfer.id == surfSessionInfo.bestWaveSurfer),
    kookSurfer: offchainInfo.surfers.find((surfer) => surfer.id == surfSessionInfo.kookSurfer),
    sessionTime: offchainInfo.sessionTime,
    approvals: surferApprovals,
    offchainInfoHash: surfSessionInfo.offchainInfoHash,
    offchainInfo: offchainInfo.offchainInfo
  };
};

export const approveSurfers = async (surferIds: string[]): Promise<void> => {
  const { address: account } = getAccount(networkConfig);
  const result = await writeContract(networkConfig, {
    ...alohaTokenConfig,
    account,
    chain: networkConfig.chains[0],
    functionName: "approveSurfers",
    args: [surferIds],
  });
};

export const approveSurfSession = async (surfSession: string, surferApprovalIndex: number): Promise<void> => {
  const { address: account } = getAccount(networkConfig);
  const result = await writeContract(networkConfig, {
    ...alohaTokenConfig,
    account,
    chain: networkConfig.chains[0],
    functionName: "approveSurfSession",
    args: [surfSession, surferApprovalIndex],
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
    chain: networkConfig.chains[0],
    functionName: "addSurfer",
    args: [surferAlias, offchainHash],
  });
};

export const addSurfSession = async (
  session: SurfSession,
  senderId: string // surferAccount.id from AppContext
): Promise<string> => {
  session.offchainInfoHash = await uploadToIPFS({
    surfers: session.surfers.map(surfer => ({ id: surfer.id, alias: surfer.alias })),
    waves: session.waves,
    bestSurfer: session.bestWaveSurfer.id,
    kookSurfer: session.kookSurfer.id,
    offchainInfo: session.offchainInfo
  });
  session.id = generateSurfSessionHash(
    session.surfers.map(surfer => surfer.id), // Array of bytes32 (hex strings)
    session.waves,                            // Array of uint256 (numbers or BigInt)
    session.bestWaveSurfer.id,                // bytes32 (hex string)
    session.kookSurfer.id,                    // bytes32 (hex string)
    session.sessionTime,                       // uint256 (number or BigInt)
    session.offchainInfoHash                   // string
  );
  const { address: account } = getAccount(networkConfig);
  console.log("Surf Session:", session.offchainInfoHash, session, senderId);
  await writeContract(networkConfig, {
    ...alohaTokenConfig,
    account,
    chain: networkConfig.chains[0],
    functionName: "addSurfSession",
    args: [
      session.surfers.map(surfer => surfer.id),
      session.waves,
      session.bestWaveSurfer.id,
      session.kookSurfer.id,
      session.sessionTime,
      session.offchainInfoHash
    ],
  });
  return session.id;
}

export const getSessionsCreatedBySurferAndNotFinalized = async (surferId: string): Promise<MinimalSurfSessionInfo[]> => {
  const sessionsCreated = await fetchContractHistory(surferId, 1000, [ "SurfSessionCreated" ]);
  const sessionsFinalized = await fetchContractHistory('0x0000000000000000000000000000000000000000', 1000, [ "SurfSessionFinalized" ]);

  console.log("Sessions Created:", sessionsCreated);
  console.log("Sessions Finalized:", sessionsFinalized);
  return [];
}
/**
 * Fetches and parses all events from the AlohaToken contract
 * @param targetUser - Address to filter events for (0x0 means all users)
 * @param blocksToSearch - Number of blocks to search in the past (default: 1000)
 * @returns Array of HistoryAction objects
 */
export const fetchContractHistory = async (
  targetUser: string = '0x0000000000000000000000000000000000000000',
  blocksToSearch: number = 1000,
  eventsFilter: string[] = [ "SurferAdded", "SurferApproved", "SurfSessionCreated", "SurfSessionApproved", "SurfSessionFinalized" ]
): Promise<HistoryAction[]> => {
  try {
    const publicClient = getPublicClient(networkConfig);
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock < blocksToSearch ? BigInt(1) : (currentBlock - BigInt(blocksToSearch));

    // Fetch all relevant logs using contract events
    const logs = await publicClient.getContractEvents({
      address: alohaTokenConfig.address,
      abi: alohaTokenConfig.abi,
      fromBlock: fromBlock,
      toBlock: currentBlock,
    });

    const historyActions: HistoryAction[] = [];

    for (const log of logs) {
      try {
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
        const timestamp = new Date(Number(block.timestamp) * 1000);

        // Parse each event type based on eventName
        let action: HistoryAction | null = null;
        
        if (eventsFilter.includes(log.eventName)) {
          switch (log.eventName) {
            case 'SurferAdded':
              action = await parseSurferAddedEvent(log, timestamp);
              break;
            case 'SurferApproved':
              action = await parseSurferApprovedEvent(log, timestamp);
              break;
            case 'SurfSessionCreated':
              action = await parseSurfSessionCreatedEvent(log, timestamp);
              break;
            case 'SurfSessionApproved':
              action = await parseSurfSessionApprovedEvent(log, timestamp);
              break;
            case 'SurfSessionFinalized':
              action = await parseSurfSessionFinalizedEvent(log, timestamp);
              break;
          }
        }
        
        if (action) {
          historyActions.push(action);
        }
      } catch (parseError) {
        console.warn('Failed to parse log:', log, parseError);
      }
    }

    // Filter by target user if specified
    if (targetUser !== '0x0000000000000000000000000000000000000000') {
      return historyActions.filter(action => 
        action.actor.toLowerCase() === targetUser.toLowerCase() || 
        action.target?.toLowerCase() === targetUser.toLowerCase()
      );
    }

    // Sort by timestamp (newest first)
    return historyActions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  } catch (error) {
    console.error('Error fetching contract history:', error);
    throw error;
  }
};

// Helper functions to parse specific event types
async function parseSurferAddedEvent(log: any, timestamp: Date): Promise<HistoryAction> {
  // Parse SurferAdded event: event SurferAdded(bytes32 indexed surferID);
  const surferID = log.args.surferID;
  
  try {
    // Fetch surfer details to get alias
    const surferInfo = await fetchSurfer(surferID);
    
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'surfer_added',
      timestamp,
      actor: surferInfo.alias,
      details: `Registered as a new surfer`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  } catch (error) {
    // Fallback if surfer info can't be fetched
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'surfer_added',
      timestamp,
      actor: surferID.slice(0, 10) + '...',
      details: `Registered as a new surfer`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  }
}

async function parseSurferApprovedEvent(log: any, timestamp: Date): Promise<HistoryAction> {
  // Parse SurferApproved event: event SurferApproved(bytes32 indexed fromID, bytes32 indexed toID);
  const fromID = log.args.fromID;
  const toID = log.args.toID;
  
  try {
    const fromSurfer = await fetchSurfer(fromID);
    const toSurfer = await fetchSurfer(toID);
    
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'surfer_approved',
      timestamp,
      actor: fromSurfer.alias,
      target: toSurfer.alias,
      details: `Approved new surfer: ${toSurfer.alias}`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  } catch (error) {
    // Fallback if surfer info can't be fetched
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'surfer_approved',
      timestamp,
      actor: fromID.slice(0, 10) + '...',
      target: toID.slice(0, 10) + '...',
      details: `Approved new surfer`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  }
}

async function parseSurfSessionCreatedEvent(log: any, timestamp: Date): Promise<HistoryAction> {
  // Parse SurfSessionCreated event: event SurfSessionCreated(bytes32 indexed sessionHash);
  const sessionHash = log.args.sessionHash;
  
  try {
    // Fetch session details
    const sessionInfo = await fetchSessionInfo(sessionHash);
    const creatorSurfer = sessionInfo.surfers[0]; // Assuming first surfer is creator
    
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_added',
      timestamp,
      actor: creatorSurfer.alias,
      target: sessionHash.slice(0, 10) + '...',
      details: `Created a new surf session with ${sessionInfo.surfers.length} surfers`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  } catch (error) {
    // Fallback if session info can't be fetched
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_added',
      timestamp,
      actor: 'Unknown',
      target: sessionHash.slice(0, 10) + '...',
      details: `Created a new surf session`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  }
}

async function parseSurfSessionApprovedEvent(log: any, timestamp: Date): Promise<HistoryAction> {
  // Parse SurfSessionApproved event: event SurfSessionApproved(bytes32 indexed sessionHash, bytes32 indexed surfer);
  const sessionHash = log.args.sessionHash;
  const surferID = log.args.surfer;
  
  try {
    const surferInfo = await fetchSurfer(surferID);
    
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_approved_by_surfer',
      timestamp,
      actor: surferInfo.alias,
      target: sessionHash.slice(0, 10) + '...',
      details: `Approved surf session`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  } catch (error) {
    // Fallback if surfer info can't be fetched
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_approved_by_surfer',
      timestamp,
      actor: surferID.slice(0, 10) + '...',
      target: sessionHash.slice(0, 10) + '...',
      details: `Approved surf session`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  }
}

async function parseSurfSessionFinalizedEvent(log: any, timestamp: Date): Promise<HistoryAction> {
  // Parse SurfSessionFinalized event: event SurfSessionFinalized(bytes32 indexed sessionHash);
  const sessionHash = log.args.sessionHash;
  
  try {
    // Fetch session details
    const sessionInfo = await fetchSessionInfo(sessionHash);
    
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_finalized',
      timestamp,
      actor: 'System',
      target: sessionHash.slice(0, 10) + '...',
      details: `Session finalized - tokens minted to ${sessionInfo.surfers.length} participants`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  } catch (error) {
    // Fallback if session info can't be fetched
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'session_finalized',
      timestamp,
      actor: 'System',
      target: sessionHash.slice(0, 10) + '...',
      details: `Session finalized - tokens minted to participants`,
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
      rawLog: log
    };
  }
}
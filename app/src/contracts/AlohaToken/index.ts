import web3 from '../../utils/web3';
import contractJson from './contract.json';

export const address = '0x5fbdb2315678afecb367f032d93f642f64180aa3'; // Replace with your alohaToken address

export const abi = contractJson.abi;

export const alohaToken = new web3.eth.Contract(abi, address);

export const fetchSessionsHashes = async () => {
  const sessionHashes = await alohaToken.methods.getSurfSessions().call();
  return sessionHashes;
};

export const fetchSurfers = async (filter = {
  fetchBalance: false
}) => {
  const surfersIDs = await alohaToken.methods.getSurfersList().call();
  const surferList = await Promise.all(surfersIDs.map(async (surfer) => {
    return await fetchSurfer(surfer, {
      fetchBalance: filter.fetchBalance
    });
  }));
  return surferList;
};


export const fetchSurfer = async (surferId, filter = {
  fetchBalance: false,
  fetchApprovals: false
}) => {
  let surferInfo = await alohaToken.methods.getSurfer(surferId).call();
  console.log("Surfer Info:", surferInfo);
  if (filter.fetchApprovals) {
    const approvals = await Promise.all(surferInfo.surferApprovals.map(async (approverID) => {
      return (await alohaToken.methods.getSurfer(approverID).call()).surferAlias;
    }));
    surferInfo.surferApprovals = approvals;
  }
  return {
    id: surferId,
    address: surferInfo.owner, 
    balance: (filter.fetchBalance) ? await alohaToken.methods.balanceOf(surferInfo.owner).call() : null, 
    alias: surferInfo.surferAlias,
    approvals: surferInfo.surferApprovals || [],
  };
};

export const fetchSessionInfo = async (sessionId) => {
  const surfSessionInfoHash = await alohaToken.methods.surfSessions(sessionId).call();
  console.log("Surf Session Info Hash:", surfSessionInfoHash);
  const surfSessionInfo = await fetch(`https://lavender-traditional-vole-938.mypinata.cloud/ipfs/${surfSessionInfoHash.offchainInfoHash}`);
  const surfSessionJson = await surfSessionInfo.json();
  return surfSessionJson;
};

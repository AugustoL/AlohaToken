import { keccak256, solidityPacked } from "ethers";

export const ALHfromWei = function(amount) {
  return amount / Math.pow(10, 18);
}

export const ALHtoWei = function(amount) {
  return amount * Math.pow(10, 18);
}

export function generateSurfSessionHash(
  sessionSurfers,    // Array of bytes32 (hex strings)
  waves,             // Array of uint256 (numbers or BigInt)
  bestWaveSurfer,    // bytes32 (hex string)
  kookSurfer,        // bytes32 (hex string)
  sessionTime,       // uint256 (number or BigInt)
  offchainInfoHash   // string
) {
  // Convert parameters to proper format for abi.encodePacked
  const encodedData = solidityPacked(
    ['bytes32[]', 'uint256[]', 'bytes32', 'bytes32', 'uint256', 'string'],
    [sessionSurfers, waves, bestWaveSurfer, kookSurfer, sessionTime, offchainInfoHash]
  );
  
  // Generate keccak256 hash
  const surfSessionHash = keccak256(encodedData);
  
  return surfSessionHash;
}
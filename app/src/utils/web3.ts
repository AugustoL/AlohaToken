import Web3 from 'web3';
import { defaultConfig } from 'web3modal-web3js/react';

let web3;

if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
        window.ethereum.enable(); // Request account access
    } catch (error) {
        console.error("User denied account access");
    }
} else if (window.web3) {
    web3 = new Web3(window.web3.currentProvider);
} else {
    console.log('error: No web3 provider detected. Falling back to localhost.');
}

export const walletConnectProjectId = '76804fd6127cc3b85f7d749c4e53700f';

export const chains = [
  // {
  //   chainId: 1,
  //   name: 'Ethereum',
  //   currency: 'ETH',
  //   explorerUrl: 'https://etherscan.io',
  //   rpcUrl: 'https://cloudflare-eth.com',
  // },
  // {
  //   chainId: 42161,
  //   name: 'Arbitrum',
  //   currency: 'ETH',
  //   explorerUrl: 'https://arbiscan.io',
  //   rpcUrl: 'https://arb1.arbitrum.io/rpc',
  // },
  {
    chainId: 31337,
    name: 'Localhost',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
];

export const web3Config = defaultConfig({
  metadata: {
    name: 'Web3Modal',
    description: 'Web3Modal Laboratory',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  defaultChainId: 31337,
  rpcUrl: 'https://cloudflare-eth.com',
});

export default web3;
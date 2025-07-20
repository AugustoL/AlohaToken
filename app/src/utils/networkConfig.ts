import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  hardhat
} from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const networkConfig = getDefaultConfig({
  appName: 'Aloha',
  projectId: 'alohaToken666',
  chains: [hardhat, mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});
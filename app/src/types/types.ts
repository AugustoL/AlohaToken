export interface MinimalSurferInfo { id: string; alias: string }

export interface SurferInfoOffchain {
  name: string;
  birthdate: string;
  country: string;
  city: string;
  stance: string;
  styles: string[];
  surfboards: string[];
}

export interface SurferInfo extends MinimalSurferInfo {
  alias: string;
  address: string;
  balance: string;
  offchainInfoHash: string;
  offchainInfo: SurferInfoOffchain;
  approvals: MinimalSurferInfo[];
}

export interface SurfSessionOffchain {
  date: string;
  location: string;
  conditions: {
    wind: string;
    size: string;
    tide: string;
  },
  duration: number; // in minutes
  sessionType: string;
}

export interface MinimalSurfSessionInfo { id: string; }

export interface SurfSession extends MinimalSurfSessionInfo {
  approved: boolean;
  surfers: MinimalSurferInfo[];
  waves: number[];
  bestWaveSurfer: MinimalSurferInfo;
  kookSurfer: MinimalSurferInfo;
  sessionTime: number; // unix timestamp
  approvals : MinimalSurferInfo[];
  offchainInfoHash: string;
  offchainInfo: SurfSessionOffchain
}
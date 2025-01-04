// src/types/morpho.ts
export interface Asset {
    id: string;
    address: string;
    decimals: number;
    name: string;
    priceUsd: number;
    symbol: string;
    tags: string[] | null;
    vault: any | null;
    yield?: {
      apr: number;
    } | null;
  }
  
  export interface MarketState {
    id: string;
    apyAtTarget: number;
    borrowApy: number;
    borrowAssets: number;
    borrowAssetsUsd: number;
    borrowShares: string;
    collateralAssets: string;
    fee: number;
    liquidityAssets: number;
    liquidityAssetsUsd: number;
    supplyApy: number;
    supplyAssets: number;
    supplyAssetsUsd: number;
    supplyShares: string;
    utilization: number;
    timestamp: number;
  }
  
  export interface Market {
    id: string;
    whitelisted: boolean;
    lltv: string;
    collateralAsset: Asset;
    loanAsset: Asset;
    state: MarketState;
    dailyApys: {
      borrowApy: number;
    };
    weeklyApys: {
      borrowApy: number;
    };
    monthlyApys: {
      borrowApy: number;
    };
    warnings: Array<{
      type: string;
      level: string;
    }>;
  }
import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Asset {
  symbol: string;
  priceUsd: number | null;
}

interface DailyApys {
  borrowApy: number;
  supplyApy: number;
}

interface MarketState {
  borrowAssetsUsd: number;
  supplyAssetsUsd: number;
  liquidityAssetsUsd: number;
}

interface Market {
  id: string;
  lltv: string;
  collateralAsset: Asset;
  loanAsset: Asset;
  state: MarketState;
  dailyApys: DailyApys;
}

interface VaultSelectorProps {
  vaults: Market[];
  selectedVault: string;
  onVaultChange: (value: string) => void;
}

const isEthCollateral = (symbol: string = '') => {
  const ethCollaterals = ['ETH', 'WETH', 'STETH', 'WSTETH', 'CBETH', 'RETH'];
  return ethCollaterals.some(eth => symbol.toUpperCase().includes(eth));
};

const formatLiquidity = (liquidityUsd: number = 0) => {
  return `$${(liquidityUsd / 1_000_000).toFixed(2)}M`;
};

export function VaultSelector({ vaults = [], selectedVault, onVaultChange }: VaultSelectorProps) {
  const filteredAndSortedVaults = useMemo(() => {
    if (!Array.isArray(vaults)) return [];
    
    return vaults
      .filter(vault => 
        vault && 
        vault.collateralAsset && 
        vault.collateralAsset.symbol && 
        isEthCollateral(vault.collateralAsset.symbol)
      )
      .sort((a, b) => 
        (b.state?.liquidityAssetsUsd || 0) - (a.state?.liquidityAssetsUsd || 0)
      );
  }, [vaults]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Vault</label>
      <Select value={selectedVault} onValueChange={onVaultChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vault" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto">
          {filteredAndSortedVaults.map(vault => (
            <SelectItem 
              key={vault.id} 
              value={vault.id}
              className="py-2"
            >
              <span className="font-medium">{vault.collateralAsset?.symbol || 'Unknown'}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-600">{vault.loanAsset?.symbol || 'Unknown'}</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-green-600">
                {(vault.dailyApys?.supplyApy * 100 || 0).toFixed(2)}%
              </span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-600">
                {formatLiquidity(vault.state?.liquidityAssetsUsd)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
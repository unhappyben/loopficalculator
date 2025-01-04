// src/components/LoopDashboard.tsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VaultSelector } from '@/components/ui/vault-selector';
import { AlertCircle } from 'lucide-react';
import { useMarkets } from '@/hooks/useMarkets';

export default function LoopDashboard() {
    const { markets = [], loading, error } = useMarkets();
    console.log('Raw markets:', markets);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [borrowAmount, setBorrowAmount] = useState('');
    const [selectedVault, setSelectedVault] = useState('');
    const [selectedStrategy, setSelectedStrategy] = useState('leverage-eth');
    const [leverageRatio, setLeverageRatio] = useState(1);

      // Calculate selected market
    const selectedMarket = markets.find(m => m.id === selectedVault);
  
    // Convert market data to vaults format
    const vaults = React.useMemo(() => {
      if (!markets.length) return [];
      
      return markets.map(market => ({
        id: market.id,
        name: `${market.collateralAsset?.symbol || ''} (${market.loanAsset?.symbol || ''})`,
        apy: (market.state?.supplyApy || 0),
        ltv: parseFloat(market.lltv || '0') / 1e18,
        collateralPrice: market.collateralAsset?.priceUsd || 0,
        borrowApy: (market.state?.borrowApy || 0)
      }));
    }, [markets]);
  
    const strategies = [
      {
        id: 'leverage-eth',
        name: 'Leveraged ETH',
        description: 'ETH staking with leverage',
        apy: 3.8,
        risk: 'Variable',
        isLeveraged: true
      },
      {
        id: 'ycrv',
        name: 'yCRV Vault',
        description: 'Curve ETH/stETH LP Strategy',
        apy: 4.5,
        risk: 'Low',
        isLeveraged: false
      },
      {
        id: 'pendle',
        name: 'Pendle ETH LP',
        description: 'Pendle Market Making',
        apy: 6.2,
        risk: 'Medium',
        isLeveraged: false
      }
    ];

    const calculateMaxBorrow = (collateralUsd: number) => {
        if (!collateralUsd) return 0;
        const selectedMarket = markets.find(m => m.id === selectedVault);
        if (!selectedMarket) return 0;
        const ltv = parseFloat(selectedMarket.lltv) / 1e18;
        return collateralUsd * ltv;
      };
    
      const calculateHealthFactor = (collateralUsd: number, borrowUsd: number) => {
        if (!borrowUsd || borrowUsd === 0) return Infinity;
        const selectedMarket = markets.find(m => m.id === selectedVault);
        if (!selectedMarket) return Infinity;
        const ltv = parseFloat(selectedMarket.lltv) / 1e18;
        const maxBorrow = collateralUsd * ltv;
        return (maxBorrow / borrowUsd).toFixed(2);
      };
    
      const calculateReturns = () => {
        const collateralUsd = parseFloat(collateralAmount) || 0;
        const borrowUsd = parseFloat(borrowAmount) || 0;
        
        const selectedMarket = markets.find(m => m.id === selectedVault);
        if (!selectedMarket) return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
          components: {
            baseApy: 0,
            strategyApy: 0,
            borrowCost: 0
          }
        };
    
        const selectedStrat = strategies.find(s => s.id === selectedStrategy);
        if (!selectedStrat) return {
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
          components: {
            baseApy: 0,
            strategyApy: 0,
            borrowCost: 0
          }
        };
        
        const supplyYieldAPY = (collateralUsd * selectedMarket.state.supplyApy);
        const borrowCostAPY = (borrowUsd * selectedMarket.state.borrowApy);
        const strategyYieldAPY = selectedStrat.isLeveraged
          ? (borrowUsd * selectedStrat.apy * leverageRatio) / 100
          : (borrowUsd * selectedStrat.apy) / 100;
        
        const netYieldPerYear = supplyYieldAPY - borrowCostAPY + strategyYieldAPY;
        
        return {
          daily: netYieldPerYear / 365,
          weekly: netYieldPerYear / 52,
          monthly: netYieldPerYear / 12,
          yearly: netYieldPerYear,
          components: {
            baseApy: selectedMarket.state.supplyApy * 100,
            strategyApy: selectedStrat.isLeveraged ? selectedStrat.apy * leverageRatio : selectedStrat.apy,
            borrowCost: selectedMarket.state.borrowApy * 100
          }
        };
      };
    
      const results = calculateReturns();
      const maxBorrow = calculateMaxBorrow(parseFloat(collateralAmount));
      const isOverBorrowed = parseFloat(borrowAmount) > maxBorrow;

      if (loading) {
        return (
          <div className="max-w-2xl mx-auto p-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="max-w-2xl mx-auto p-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-red-500">
                  Error loading markets: {error.message}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <div className="max-w-2xl mx-auto p-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Loop Fi Calculator</CardTitle>
              <p className="text-gray-600">Leverage Morpho Borrows with Loop Fi</p>
            </CardHeader>
    
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Vault Selection */}
                <VaultSelector
                vaults={markets} // Pass markets directly instead of transformed vaults
                selectedVault={selectedVault}
                onVaultChange={setSelectedVault}
                />
    
                {/* Strategy Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Strategy</label>
                  <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.apy}% Base APY)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
    
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {strategies.find(s => s.id === selectedStrategy)?.description}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      strategies.find(s => s.id === selectedStrategy)?.risk === 'Low'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {strategies.find(s => s.id === selectedStrategy)?.risk}
                    </span>
                  </div>
                </div>
    
                {/* Collateral Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Collateral (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <Input
                        type="number"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                        className="pl-6"
                        placeholder="0.00"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                        ≈ {selectedMarket ? (
                            `${((parseFloat(collateralAmount) || 0) / (selectedMarket.collateralAsset.priceUsd || 1)).toFixed(4)} ${selectedMarket.collateralAsset.symbol}`
                        ) : '0.0000'}
                        </div>
                    </div>
                    </div>

                    {/* Borrow Input */}
                    <div className="space-y-2">
                    <label className="text-sm font-medium">Borrow (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <Input
                        type="number"
                        value={borrowAmount}
                        onChange={(e) => setBorrowAmount(e.target.value)}
                        className={`pl-6 ${isOverBorrowed ? 'border-red-500' : ''}`}
                        placeholder="0.00"
                        />
                        <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">
                            ≈ {selectedMarket ? (
                            `${((parseFloat(borrowAmount) || 0) / (selectedMarket.loanAsset.priceUsd || 1)).toFixed(4)} ${selectedMarket.loanAsset.symbol}`
                            ) : '0.0000'}
                        </span>
                        {isOverBorrowed && (
                            <span className="text-red-500">Exceeds max borrow</span>
                        )}
                        </div>
                    </div>
                    </div>

                {/* Leverage Slider */}
            {strategies.find(s => s.id === selectedStrategy)?.isLeveraged && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Leverage</label>
                  <span className="text-sm text-blue-600">{leverageRatio}x</span>
                </div>
                <Slider
                  value={[leverageRatio]}
                  onValueChange={([value]) => setLeverageRatio(value)}
                  min={1}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1x</span>
                  <span>5x</span>
                </div>
                
                <div className={`mt-2 p-2 rounded text-sm ${
                  leverageRatio > 3 
                    ? 'bg-red-100 text-red-700'
                    : leverageRatio > 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {leverageRatio > 3 
                    ? '⚠️ High leverage increases liquidation risk significantly'
                    : leverageRatio > 2
                    ? '⚠️ Moderate leverage risk, monitor positions carefully'
                    : 'Low leverage position, relatively safe'}
                </div>
              </div>
            )}

            {/* Position Metrics */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Max Borrow</span>
                <span>${maxBorrow.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">LTV</span>
                <span>{(vaults.find(v => v.id === selectedVault)?.ltv * 100 || 0).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Health Factor</span>
                <span className={`${
                  parseFloat(calculateHealthFactor(parseFloat(collateralAmount), parseFloat(borrowAmount))) < 1.1
                    ? 'text-red-500'
                    : 'text-green-500'
                }`}>
                  {calculateHealthFactor(parseFloat(collateralAmount), parseFloat(borrowAmount))}
                </span>
              </div>
            </div>

            {/* Yield Components */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-medium">Yield Components</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supply APY</span>
                  <span className="text-green-600">+{results.components.baseApy.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Borrow APY</span>
                  <span className="text-red-600">-{results.components.borrowCost.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Strategy APY</span>
                  <span className="text-green-600">+{results.components.strategyApy.toFixed(2)}%</span>
                </div>
                <div className="pt-2 border-t flex justify-between font-semibold">
                  <span>Net APY</span>
                  <span className="text-blue-600">{results.yearly.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Estimated Returns */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-medium">Estimated Returns</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Daily</p>
                  <p className="text-xl">${results.daily.toFixed(4)}</p>
                  <p className="text-sm text-gray-500">+${(results.daily * 0.05).toFixed(4)} (dLP)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weekly</p>
                  <p className="text-xl">${results.weekly.toFixed(4)}</p>
                  <p className="text-sm text-gray-500">+${(results.weekly * 0.05).toFixed(4)} (dLP)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly</p>
                  <p className="text-xl">${results.monthly.toFixed(4)}</p>
                  <p className="text-sm text-gray-500">+${(results.monthly * 0.05).toFixed(4)} (dLP)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Yearly</p>
                  <p className="text-xl">${results.yearly.toFixed(4)}</p>
                  <p className="text-sm text-gray-500">+${(results.yearly * 0.05).toFixed(4)} (dLP)</p>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700">
                Lock 5% of your Total Looped Position Size in dLP to receive rebates on interest paid.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
    

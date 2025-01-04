import React from 'react';
import { useQuery, gql } from '@apollo/client';

const MARKETS_QUERY = gql`
  query GetMarkets($skip: Int, $first: Int) {
    markets(skip: $skip, first: $first) {
      items {
        id
        lltv
        collateralPrice
        loanAsset {
          symbol
          priceUsd
          decimals
        }
        collateralAsset {
          symbol
          priceUsd
          decimals
          yield {
            apr
          }
        }
        dailyApys {
          borrowApy
          supplyApy
        }
        state {
          supplyApy
          borrowApy
          supplyAssetsUsd
          borrowAssetsUsd
          liquidityAssetsUsd
        }
      }
    }
  }
`;

interface MarketAsset {
  symbol: string;
  priceUsd: number | null;
  decimals: number;
  yield?: {
    apr: number;
  } | null;
}

interface DailyApys {
  borrowApy: number;
  supplyApy: number;
}

interface MarketState {
  supplyApy: number;
  borrowApy: number;
  supplyAssetsUsd: number;
  borrowAssetsUsd: number;
  liquidityAssetsUsd: number;
}

interface Market {
  id: string;
  lltv: string;
  collateralPrice: string;
  loanAsset: MarketAsset;
  collateralAsset: MarketAsset;
  dailyApys: DailyApys;
  state: MarketState;
}

interface MarketsResponse {
  markets: {
    items: Market[];
  };
}

export function useMarkets() {
  const { data, loading, error } = useQuery<MarketsResponse>(MARKETS_QUERY, {
    variables: {
      first: 100,
      skip: 0
    },
    pollInterval: 30000,
  });

  const transformedMarkets = React.useMemo(() => {
    if (!data?.markets?.items) return [];

    return data.markets.items
      .filter(market => 
        market && 
        market.collateralAsset && 
        market.loanAsset && 
        market.state &&
        market.dailyApys
      )
      .map(market => ({
        id: market.id,
        collateralAsset: {
          symbol: market.collateralAsset.symbol,
          priceUsd: market.collateralAsset.priceUsd,
          decimals: market.collateralAsset.decimals,
          yield: market.collateralAsset.yield
        },
        loanAsset: {
          symbol: market.loanAsset.symbol,
          priceUsd: market.loanAsset.priceUsd,
          decimals: market.loanAsset.decimals
        },
        lltv: market.lltv,
        dailyApys: {
          borrowApy: market.dailyApys.borrowApy,
          supplyApy: market.dailyApys.supplyApy
        },
        state: {
          supplyApy: market.state.supplyApy,
          borrowApy: market.state.borrowApy,
          supplyAssetsUsd: market.state.supplyAssetsUsd,
          borrowAssetsUsd: market.state.borrowAssetsUsd,
          liquidityAssetsUsd: market.state.liquidityAssetsUsd
        }
      }));
  }, [data]);

  return {
    markets: transformedMarkets,
    loading,
    error
  };
}
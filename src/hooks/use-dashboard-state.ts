import { useState, useCallback, useMemo } from 'react';
import { Provider } from '@/shared/types';

interface UseDashboardStateProps {
  initialProviders?: Provider[];
}

export function useDashboardState({ initialProviders = [] }: UseDashboardStateProps = {}) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [allProviders, setAllProviders] = useState<Provider[]>(initialProviders);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showNearbyProviders, setShowNearbyProviders] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCache, setSearchCache] = useState<Map<string, Provider[]>>(new Map());

  // Memoized provider filtering
  const { agencies, serviceProviders } = useMemo(() => {
    const agencies = providers.filter(p => p.role === 'agency');
    const serviceProviders = providers.filter(p => p.role === 'provider');
    return { agencies, serviceProviders };
  }, [providers]);

  // Clear search and reset to all providers
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setProviders(allProviders);
    setShowNearbyProviders(false);
    setUserLocation(null);
  }, [allProviders]);

  // Update providers and maintain cache
  const updateProviders = useCallback((newProviders: Provider[]) => {
    setProviders(newProviders);
    setAllProviders(newProviders);
  }, []);

  // Add to search cache
  const addToCache = useCallback((key: string, results: Provider[]) => {
    setSearchCache(prev => new Map(prev).set(key.toLowerCase().trim(), results));
  }, []);

  // Get from search cache
  const getFromCache = useCallback((key: string) => {
    return searchCache.get(key.toLowerCase().trim());
  }, [searchCache]);

  return {
    // State
    providers,
    allProviders,
    searchTerm,
    isSmartSearching,
    favoriteProviderIds,
    viewMode,
    showNearbyProviders,
    isLoadingNearby,
    userLocation,
    searchCache,
    
    // Computed values
    agencies,
    serviceProviders,
    
    // Actions
    setProviders,
    setAllProviders,
    setSearchTerm,
    setIsSmartSearching,
    setFavoriteProviderIds,
    setViewMode,
    setShowNearbyProviders,
    setIsLoadingNearby,
    setUserLocation,
    clearSearch,
    updateProviders,
    addToCache,
    getFromCache,
  };
}

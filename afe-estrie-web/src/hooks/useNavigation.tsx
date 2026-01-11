import { useEffect, useMemo, useState, useCallback } from "react";
import type { NavNode } from "../content/types/navTypes";
import { getNavigation } from "../services/navigationRepo";

// Error types for better error handling
export interface NavigationError {
    type: 'NETWORK' | 'PARSE' | 'VALIDATION' | 'UNKNOWN';
    message: string;
    timestamp: Date;
    retryable: boolean;
}

// Configuration options
interface UseNavigationOptions {
    retryCount?: number;
    retryDelay?: number;
    enableCache?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

// Cache key for local storage
const CACHE_KEY = 'site_navigation_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalizeTree(nodes: NavNode[] = []): NavNode[] {
    return [...nodes]
        .filter(Boolean)
        .filter((n) => n.enabled !== false)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map((n, idx) => ({
            ...n,
            enabled: n.enabled !== false,
            order: idx + 1,
            children: normalizeTree(n.children ?? []),
        }));
}

// Validate navigation structure
function validateNavigation(nodes: NavNode[]): boolean {
    try {
        const validateNode = (node: NavNode, path: string[] = []): void => {
            if (!node.id) {
                throw new Error(`Node missing id at path: ${path.join('/')}`);
            }
            
            if (!node.label || typeof node.label !== 'string') {
                throw new Error(`Node ${node.id} has invalid label`);
            }
            
            // Check for circular references
            if (path.includes(node.id)) {
                throw new Error(`Circular reference detected at node: ${node.id}`);
            }
            
            const newPath = [...path, node.id];
            
            if (node.children) {
                if (!Array.isArray(node.children)) {
                    throw new Error(`Children of node ${node.id} is not an array`);
                }
                node.children.forEach(child => validateNode(child, newPath));
            }
        };
        
        nodes.forEach(node => validateNode(node));
        return true;
    } catch (error) {
        console.error('Navigation validation failed:', error);
        return false;
    }
}

// Get cached navigation if valid
function getCachedNavigation(): NavNode[] | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        if (now - timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        
        return data;
    } catch (error) {
        console.warn('Failed to read navigation cache:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

// Save navigation to cache
function saveToCache(data: NavNode[]): void {
    try {
        const cacheData = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Failed to save navigation to cache:', error);
    }
}

export function useNavigation(options: UseNavigationOptions = {}) {
    const {
        retryCount = 2,
        retryDelay = 1000,
        enableCache = true,
        autoRefresh = false,
        refreshInterval = 30000, // 30 seconds
    } = options;
    
    const [items, setItems] = useState<NavNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<NavigationError | null>(null);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Load initial data from cache if available
    useEffect(() => {
        if (enableCache) {
            const cached = getCachedNavigation();
            if (cached) {
                setItems(cached);
                setLoading(false);
                setLastUpdated(new Date());
            }
        }
    }, [enableCache]);

    const fetchNavigation = useCallback(async (isRetry = false) => {
        if (!isRetry) {
            setLoading(true);
            setError(null);
        }
        
        try {
            console.log(`Fetching navigation... ${isRetry ? `(Retry ${retryAttempt + 1})` : ''}`);
            
            const data = await getNavigation();
            
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid navigation data received');
            }
            
            // Validate data structure
            if (!validateNavigation(data)) {
                throw new Error('Navigation data validation failed');
            }
            
            const normalizedData = normalizeTree(data);
            
            // Save to cache if enabled
            if (enableCache) {
                saveToCache(normalizedData);
            }
            
            setItems(normalizedData);
            setLoading(false);
            setError(null);
            setRetryAttempt(0);
            setLastUpdated(new Date());
            
            console.log('Navigation loaded successfully:', normalizedData);
            
        } catch (err) {
            console.error('Failed to load navigation:', err);
            
            const navigationError: NavigationError = {
                type: err instanceof TypeError ? 'NETWORK' : 
                      err instanceof SyntaxError ? 'PARSE' : 
                      err instanceof Error && err.message.includes('validation') ? 'VALIDATION' : 'UNKNOWN',
                message: err instanceof Error ? err.message : 'Unknown error occurred',
                timestamp: new Date(),
                retryable: retryAttempt < retryCount,
            };
            
            setError(navigationError);
            
            // Attempt retry if retryable
            if (retryAttempt < retryCount && navigationError.retryable) {
                console.log(`Retrying navigation fetch in ${retryDelay}ms...`);
                
                setTimeout(() => {
                    setRetryAttempt(prev => prev + 1);
                    fetchNavigation(true);
                }, retryDelay);
                
            } else {
                setLoading(false);
                
                // If cache is enabled and we have cached data, show warning but keep cache
                if (enableCache && getCachedNavigation()) {
                    console.warn('Using cached navigation due to fetch error');
                }
            }
        }
    }, [retryAttempt, retryCount, retryDelay, enableCache]);

    // Initial fetch
    useEffect(() => {
        let isMounted = true;
        
        if (isMounted && (!enableCache || !getCachedNavigation())) {
            fetchNavigation();
        }
        
        return () => {
            isMounted = false;
        };
    }, [fetchNavigation, enableCache]);

    // Auto-refresh if enabled
    useEffect(() => {
        if (!autoRefresh) return;
        
        const intervalId = setInterval(() => {
            console.log('Auto-refreshing navigation...');
            fetchNavigation();
        }, refreshInterval);
        
        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshInterval, fetchNavigation]);

    // Manual retry function
    const retry = useCallback(() => {
        setRetryAttempt(0);
        fetchNavigation();
    }, [fetchNavigation]);

    // Clear cache function
    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        setItems([]);
        setLastUpdated(null);
        fetchNavigation();
    }, [fetchNavigation]);

    // Force refresh function (ignore cache)
    const forceRefresh = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        fetchNavigation();
    }, [fetchNavigation]);

    const sorted = useMemo(() => normalizeTree(items), [items]);

    // Calculate stale status
    const isStale = useMemo(() => {
        if (!lastUpdated) return true;
        return Date.now() - lastUpdated.getTime() > CACHE_TTL;
    }, [lastUpdated]);

    return {
        items: sorted,
        loading,
        error,
        retry,
        clearCache,
        forceRefresh,
        lastUpdated,
        isStale,
        retryCount: retryAttempt,
        maxRetries: retryCount,
    };
}

// Optional: Create a custom hook for accessing navigation with context
// This allows components to consume navigation data without prop drilling

import { createContext, useContext } from "react";

interface NavigationContextValue {
    items: NavNode[];
    loading: boolean;
    error: NavigationError | null;
    retry: () => void;
    clearCache: () => void;
    forceRefresh: () => void;
    lastUpdated: Date | null;
    isStale: boolean;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ 
    children,
    options 
}: { 
    children: React.ReactNode;
    options?: UseNavigationOptions;
}) {
    const navigation = useNavigation(options);
    
    return (
        <NavigationContext.Provider value={navigation}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigationContext() {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigationContext must be used within a NavigationProvider');
    }
    return context;
}
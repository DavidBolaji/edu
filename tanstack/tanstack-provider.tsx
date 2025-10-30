'use client';
import React, { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PropsWithChildren } from 'react';
import {
  PersistQueryClientProvider,
  persistQueryClient,
} from '@tanstack/react-query-persist-client';

// Initialize QueryClient with desired default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retry: 0,
    },
  },
});

// Custom persister with SSR safety checks
const createPersister = () => {
  const isServer = typeof window === 'undefined';

  return {
    persistClient: async (client: unknown) => {
      if (!isServer) {
        try {
          localStorage.setItem('react-query-cache', JSON.stringify(client));
        } catch (error) {
          console.error('Error persisting query cache:', error);
        }
      }
    },
    restoreClient: async () => {
      if (!isServer) {
        try {
          const cache = localStorage.getItem('react-query-cache');
          return cache ? JSON.parse(cache) : undefined;
        } catch (error) {
          console.error('Error restoring query cache:', error);
          return undefined;
        }
      }
      return undefined;
    },
    removeClient: async () => {
      if (!isServer) {
        try {
          localStorage.removeItem('react-query-cache');
        } catch (error) {
          console.error('Error removing query cache:', error);
        }
      }
    },
  };
};

export const TanstackProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [client] = useState(queryClient);
  const customPersister = createPersister();

  // Initialize persistence after component mounts
  useEffect(() => {
    persistQueryClient({
      queryClient: client,
      persister: customPersister,
    });
    setMounted(true);
  }, [client, customPersister]);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: customPersister }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
};

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  loadFirebaseConfig,
  initializeFirebase,
  isFirebaseInitialized,
  type FirebaseConfig,
} from '@/lib/firebase';
import { ConfigDialog } from '@/components/ConfigDialog';

interface FirebaseContextValue {
  isConfigured: boolean;
  showConfig: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  isConfigured: false,
  showConfig: () => {},
});

export function useFirebaseContext() {
  return useContext(FirebaseContext);
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Try to load saved config
    const config = loadFirebaseConfig();
    if (config) {
      try {
        initializeFirebase(config);
        setIsConfigured(true);
      } catch {
        // Config invalid, show dialog
        setShowConfigDialog(true);
      }
    } else {
      // No config, show dialog
      setShowConfigDialog(true);
    }
  }, []);

  const handleConfigured = () => {
    setIsConfigured(true);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <FirebaseContext.Provider
      value={{
        isConfigured,
        showConfig: () => setShowConfigDialog(true),
      }}
    >
      {children}
      <ConfigDialog
        open={showConfigDialog && !isConfigured}
        onOpenChange={setShowConfigDialog}
        onConfigured={handleConfigured}
      />
    </FirebaseContext.Provider>
  );
}

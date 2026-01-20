'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveFirebaseConfig, initializeFirebase, type FirebaseConfig } from '@/lib/firebase';

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: () => void;
}

export function ConfigDialog({ open, onOpenChange, onConfigured }: ConfigDialogProps) {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!config.apiKey || !config.projectId || !config.appId) {
        throw new Error('API Key, Project ID, and App ID are required');
      }

      // Auto-fill common fields
      const fullConfig: FirebaseConfig = {
        ...config,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      };

      // Try to initialize
      initializeFirebase(fullConfig);

      // Save config
      saveFirebaseConfig(fullConfig);

      onConfigured();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to configure Firebase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Firebase</DialogTitle>
          <DialogDescription>
            Enter your Firebase project credentials. Get these from your Firebase Console &gt;
            Project Settings &gt; Your apps &gt; Web app.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                API Key *
              </label>
              <Input
                id="apiKey"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="AIza..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="projectId" className="text-sm font-medium">
                Project ID *
              </label>
              <Input
                id="projectId"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="my-project-id"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="appId" className="text-sm font-medium">
                App ID *
              </label>
              <Input
                id="appId"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                placeholder="1:123:web:abc"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="messagingSenderId" className="text-sm font-medium">
                Messaging Sender ID
              </label>
              <Input
                id="messagingSenderId"
                value={config.messagingSenderId}
                onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                placeholder="123456789"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

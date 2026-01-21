'use client';

import { useState, useEffect } from 'react';
import { useFirebaseContext } from '../providers';
import { loadFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, type FirebaseConfig } from '@/lib/firebase';
import { loadSchedulerSettings, saveSchedulerSettings } from '@/lib/scheduler/reports';
import {
  loadLLMConfig,
  saveLLMConfig,
  clearLLMConfig,
  isLLMConfigured,
  testLLMConfig,
  PROVIDERS,
  type LLMConfig,
  type LLMProvider,
} from '@/lib/llm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, Database, Key, Trash2, Calendar, Cpu, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { isConfigured, showConfig } = useFirebaseContext();
  const [config, setConfig] = useState<FirebaseConfig | null>(null);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [schedulerFrequency, setSchedulerFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [schedulerDay, setSchedulerDay] = useState(0);

  // LLM configuration state
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('openai');
  const [llmModel, setLlmModel] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmConfigured, setLlmConfigured] = useState(false);
  const [llmTesting, setLlmTesting] = useState(false);
  const [llmTestError, setLlmTestError] = useState<string | null>(null);

  useEffect(() => {
    const savedConfig = loadFirebaseConfig();
    setConfig(savedConfig);

    // Load LLM config
    const savedLLMConfig = loadLLMConfig();
    if (savedLLMConfig) {
      setLlmProvider(savedLLMConfig.provider);
      setLlmModel(savedLLMConfig.model);
      setLlmApiKey(savedLLMConfig.apiKey);
      setLlmBaseUrl(savedLLMConfig.baseUrl || '');
      setLlmConfigured(true);
    } else {
      // Set default model for initial provider
      const defaultProvider = PROVIDERS.find(p => p.id === 'openai');
      if (defaultProvider?.models[0]) {
        setLlmModel(defaultProvider.models[0].id);
      }
    }

    // Load scheduler settings
    const scheduler = loadSchedulerSettings();
    setSchedulerEnabled(scheduler.enabled);
    setSchedulerFrequency(scheduler.frequency);
    setSchedulerDay(scheduler.dayOfWeek ?? 0);
  }, []);

  const handleSchedulerChange = (enabled: boolean) => {
    setSchedulerEnabled(enabled);
    saveSchedulerSettings({
      enabled,
      frequency: schedulerFrequency,
      dayOfWeek: schedulerDay,
    });
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly') => {
    setSchedulerFrequency(frequency);
    saveSchedulerSettings({
      enabled: schedulerEnabled,
      frequency,
      dayOfWeek: schedulerDay,
    });
  };

  const handleDayChange = (day: string) => {
    const dayNum = parseInt(day, 10);
    setSchedulerDay(dayNum);
    saveSchedulerSettings({
      enabled: schedulerEnabled,
      frequency: schedulerFrequency,
      dayOfWeek: dayNum,
    });
  };

  const handleProviderChange = (provider: LLMProvider) => {
    setLlmProvider(provider);
    setLlmConfigured(false);
    setLlmTestError(null);
    // Set default model for new provider
    const providerInfo = PROVIDERS.find(p => p.id === provider);
    if (providerInfo?.models[0]) {
      setLlmModel(providerInfo.models[0].id);
    }
    // Clear API key when switching providers
    setLlmApiKey('');
  };

  const handleSaveLLMConfig = async () => {
    const providerInfo = PROVIDERS.find(p => p.id === llmProvider);
    if (!providerInfo) return;

    // Validate required fields
    if (providerInfo.requiresApiKey && !llmApiKey) {
      setLlmTestError('API key is required');
      return;
    }
    if (!llmModel) {
      setLlmTestError('Please select a model');
      return;
    }

    setLlmTesting(true);
    setLlmTestError(null);

    const newConfig: LLMConfig = {
      provider: llmProvider,
      apiKey: llmApiKey,
      model: llmModel,
      baseUrl: llmBaseUrl || undefined,
    };

    // Test the configuration
    const result = await testLLMConfig(newConfig);

    if (result.success) {
      saveLLMConfig(newConfig);
      setLlmConfigured(true);
      setLlmTestError(null);
    } else {
      setLlmTestError(result.error || 'Failed to connect');
    }

    setLlmTesting(false);
  };

  const handleClearLLMConfig = () => {
    clearLLMConfig();
    setLlmConfigured(false);
    setLlmApiKey('');
    setLlmTestError(null);
  };

  const handleClearFirebase = () => {
    if (confirm('This will clear your Firebase configuration. You will need to reconfigure to use the dashboard.')) {
      clearFirebaseConfig();
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your ClaudeInsight dashboard</p>
      </div>

      {/* Firebase Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="text-base">Firebase Configuration</CardTitle>
            </div>
            {isConfigured ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <XCircle className="mr-1 h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Your Firebase project credentials for storing session data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Project ID</label>
                  <Input value={config.projectId} disabled className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">App ID</label>
                  <Input value={config.appId} disabled className="mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={showConfig}>
                  Update Configuration
                </Button>
                <Button variant="destructive" size="icon" onClick={handleClearFirebase}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={showConfig}>Configure Firebase</Button>
          )}
        </CardContent>
      </Card>

      {/* LLM Provider Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              <CardTitle className="text-base">AI Analysis Provider</CardTitle>
            </div>
            {llmConfigured ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Not Configured
              </Badge>
            )}
          </div>
          <CardDescription>
            Configure an LLM provider to analyze sessions and generate insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-sm font-medium">Provider</label>
            <Select
              value={llmProvider}
              onValueChange={(v) => handleProviderChange(v as LLMProvider)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium">Model</label>
            <Select value={llmModel} onValueChange={setLlmModel}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.find(p => p.id === llmProvider)?.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{model.name}</span>
                      {model.description && (
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key (if required) */}
          {PROVIDERS.find(p => p.id === llmProvider)?.requiresApiKey && (
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                value={llmApiKey}
                onChange={(e) => {
                  setLlmApiKey(e.target.value);
                  setLlmConfigured(false);
                }}
                placeholder={llmProvider === 'openai' ? 'sk-...' : llmProvider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key from{' '}
                <a
                  href={PROVIDERS.find(p => p.id === llmProvider)?.apiKeyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {PROVIDERS.find(p => p.id === llmProvider)?.name}
                </a>
              </p>
            </div>
          )}

          {/* Base URL (for Ollama) */}
          {llmProvider === 'ollama' && (
            <div>
              <label className="text-sm font-medium">Base URL (optional)</label>
              <Input
                value={llmBaseUrl}
                onChange={(e) => setLlmBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for default (localhost:11434)
              </p>
            </div>
          )}

          {/* Error message */}
          {llmTestError && (
            <p className="text-sm text-red-500">{llmTestError}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSaveLLMConfig} disabled={llmTesting}>
              {llmTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : llmConfigured ? (
                'Update Configuration'
              ) : (
                'Save & Test'
              )}
            </Button>
            {llmConfigured && (
              <Button variant="outline" onClick={handleClearLLMConfig}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Scheduler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle className="text-base">Export Reminders</CardTitle>
            </div>
            <Switch
              checked={schedulerEnabled}
              onCheckedChange={handleSchedulerChange}
            />
          </div>
          <CardDescription>
            Get reminded to export your insights on a schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select
                value={schedulerFrequency}
                onValueChange={(v) => handleFrequencyChange(v as 'daily' | 'weekly')}
                disabled={!schedulerEnabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {schedulerFrequency === 'weekly' && (
              <div>
                <label className="text-sm font-medium">Day of Week</label>
                <Select
                  value={schedulerDay.toString()}
                  onValueChange={handleDayChange}
                  disabled={!schedulerEnabled}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, you will see a reminder on the dashboard when an export is due.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* CLI Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CLI Setup</CardTitle>
          <CardDescription>
            Install and configure the CLI to sync your Claude Code sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <p className="text-muted-foreground"># Install the CLI</p>
            <p>cd claudeinsight/cli && pnpm install && pnpm build</p>
            <p className="mt-2 text-muted-foreground"># Initialize with your Firebase credentials</p>
            <p>node dist/index.js init</p>
            <p className="mt-2 text-muted-foreground"># Sync your sessions</p>
            <p>node dist/index.js sync</p>
          </div>

          <p className="text-sm text-muted-foreground">
            The CLI uses Firebase Admin SDK with service account credentials.
            Get these from Firebase Console → Project Settings → Service Accounts.
          </p>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About ClaudeInsight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ClaudeInsight transforms your Claude Code session history into structured,
            searchable insights.
          </p>
          <p>
            <strong>Your data, your infrastructure.</strong> All data is stored in your own
            Firebase project. Nothing is sent to ClaudeInsight servers.
          </p>
          <p>
            <a
              href="https://github.com/claudeinsight/claudeinsight"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on GitHub
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

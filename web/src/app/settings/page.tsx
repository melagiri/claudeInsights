'use client';

import { useState, useEffect } from 'react';
import { useFirebaseContext } from '../providers';
import { loadFirebaseConfig, saveFirebaseConfig, clearFirebaseConfig, type FirebaseConfig } from '@/lib/firebase';
import { loadSchedulerSettings, saveSchedulerSettings } from '@/lib/scheduler/reports';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, XCircle, Database, Key, Trash2, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const { isConfigured, showConfig } = useFirebaseContext();
  const [config, setConfig] = useState<FirebaseConfig | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [schedulerFrequency, setSchedulerFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [schedulerDay, setSchedulerDay] = useState(0);

  useEffect(() => {
    const savedConfig = loadFirebaseConfig();
    setConfig(savedConfig);

    // Load Gemini key from localStorage
    const savedGeminiKey = localStorage.getItem('claudeinsight_gemini_key');
    if (savedGeminiKey) {
      setGeminiKey(savedGeminiKey);
      setGeminiSaved(true);
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

  const handleSaveGeminiKey = () => {
    localStorage.setItem('claudeinsight_gemini_key', geminiKey);
    setGeminiSaved(true);
  };

  const handleClearGeminiKey = () => {
    localStorage.removeItem('claudeinsight_gemini_key');
    setGeminiKey('');
    setGeminiSaved(false);
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

      {/* Gemini API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle className="text-base">Gemini API (Optional)</CardTitle>
            </div>
            {geminiSaved && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Configured
              </Badge>
            )}
          </div>
          <CardDescription>
            Add your Gemini API key to enable AI-powered insight enhancement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                setGeminiSaved(false);
              }}
              placeholder="AIza..."
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveGeminiKey} disabled={!geminiKey}>
              Save API Key
            </Button>
            {geminiSaved && (
              <Button variant="outline" onClick={handleClearGeminiKey}>
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google AI Studio
            </a>
          </p>
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

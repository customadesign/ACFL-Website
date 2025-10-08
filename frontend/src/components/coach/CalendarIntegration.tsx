import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Calendar,
  Settings,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Clock,
  User
} from 'lucide-react';

interface CalendarConnection {
  connection_id: string;
  provider: string;
  calendar_name: string;
  is_sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string;
}

interface CalendarIntegrationProps {
  coachId: string;
  compact?: boolean;
}

interface ConnectionSettings {
  is_sync_enabled: boolean;
  sync_direction: 'to_external' | 'from_external' | 'both';
  auto_create_events: boolean;
  auto_update_events: boolean;
  include_client_details: boolean;
  event_title_template: string;
  event_description_template: string;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ coachId, compact = false }) => {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<string | null>(null);
  const [settings, setSettings] = useState<ConnectionSettings>({
    is_sync_enabled: true,
    sync_direction: 'both',
    auto_create_events: true,
    auto_update_events: true,
    include_client_details: false,
    event_title_template: 'ACT Coaching Session',
    event_description_template: 'Coaching session scheduled via ACT Coaching For Life'
  });

  useEffect(() => {
    loadConnections();
  }, [coachId]);

  const loadConnections = async () => {
    try {
      const response = await fetch(`/api/calendar-integration/connections/${coachId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      } else {
        throw new Error('Failed to load calendar connections');
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Failed to load calendar connections');
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async (provider: 'google' | 'outlook') => {
    try {
      setConnecting(provider);

      const response = await fetch(`/api/calendar-integration/connect/${provider}/${coachId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        throw new Error(`Failed to initiate ${provider} connection`);
      }
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
      toast.error(`Failed to connect ${provider} Calendar`);
      setConnecting(null);
    }
  };

  const disconnectCalendar = async (connectionId: string, provider: string) => {
    try {
      const response = await fetch(`/api/calendar-integration/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success(`${provider} Calendar disconnected`);
        loadConnections();
      } else {
        throw new Error('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  const testConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/calendar-integration/connections/${connectionId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(`Connection test failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Failed to test connection');
    }
  };

  const syncCalendar = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/calendar-integration/connections/${connectionId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation: 'full_sync' }),
      });

      if (response.ok) {
        toast.success('Sync queued successfully');
      } else {
        throw new Error('Failed to queue sync');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Failed to sync calendar');
    }
  };

  const loadConnectionSettings = async (connectionId: string) => {
    // In a real implementation, you'd fetch the settings from the API
    // For now, we'll use default settings
    setSettingsOpen(connectionId);
  };

  const saveSettings = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/calendar-integration/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setSettingsOpen(null);
        loadConnections();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    return new Date(lastSync).toLocaleString();
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔵';
      case 'outlook':
        return '🔷';
      default:
        return '📅';
    }
  };

  if (loading) {
    return (
      <div className={compact ? "space-y-2" : ""}>
        <div className={compact ? "animate-pulse space-y-2" : "flex items-center justify-center"}>
          <div className={compact ? "h-3 bg-gray-200 dark:bg-gray-700 rounded" : "flex items-center"}>
            {!compact && <RefreshCw className="w-6 h-6 animate-spin mr-2" />}
            {!compact && "Loading calendar connections..."}
          </div>
          {compact && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>}
          {compact && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>}
        </div>
      </div>
    );
  }

  // Compact mode rendering
  if (compact) {
    if (connections.length === 0) {
      return (
        <div className="text-center space-y-3">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
            No calendars connected
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => connectCalendar('google')}
              disabled={connecting === 'google'}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 h-auto min-w-[60px]"
            >
              {connecting === 'google' ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                '🔵'
              )}
              <span className="truncate">Google</span>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {connections.map((connection) => (
          <div
            key={connection.connection_id}
            className="flex items-center justify-between p-2 rounded border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm flex-shrink-0">
                {getProviderIcon(connection.provider)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium capitalize truncate">
                  {connection.provider}
                </p>
                <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                  {connection.is_sync_enabled ? 'Active' : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {getStatusBadge(connection.last_sync_status)}
            </div>
          </div>
        ))}

        {!connections.find(c => c.provider === 'google') && (
          <div className="text-center pt-2">
            <div className="flex gap-1 justify-center">
              <Button
                onClick={() => connectCalendar('google')}
                disabled={connecting === 'google'}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
              >
                {connecting === 'google' ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <>🔵 Add Google</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to automatically sync your coaching appointments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Calendars Connected</h3>
              <p className="text-gray-600 mb-4">
                Connect your calendar to automatically sync your coaching appointments.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => connectCalendar('google')}
                  disabled={connecting === 'google'}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {connecting === 'google' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    '🔵'
                  )}
                  Connect Google Calendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.connection_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getProviderIcon(connection.provider)}
                      </span>
                      <div>
                        <h4 className="font-medium capitalize">
                          {connection.provider} Calendar
                        </h4>
                        <p className="text-sm text-gray-600">
                          {connection.calendar_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(connection.last_sync_status)}
                      <Dialog
                        open={settingsOpen === connection.connection_id}
                        onOpenChange={(open) => !open && setSettingsOpen(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadConnectionSettings(connection.connection_id)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Calendar Sync Settings</DialogTitle>
                            <DialogDescription>
                              Configure how your appointments sync with {connection.provider} Calendar
                            </DialogDescription>
                          </DialogHeader>

                          <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="general">General</TabsTrigger>
                              <TabsTrigger value="privacy">Privacy</TabsTrigger>
                              <TabsTrigger value="templates">Templates</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="sync-enabled">Enable Sync</Label>
                                  <p className="text-sm text-gray-600">
                                    Automatically sync appointments with calendar
                                  </p>
                                </div>
                                <Switch
                                  id="sync-enabled"
                                  checked={settings.is_sync_enabled}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({ ...prev, is_sync_enabled: checked }))
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="auto-create">Auto-create Events</Label>
                                  <p className="text-sm text-gray-600">
                                    Automatically create calendar events for new appointments
                                  </p>
                                </div>
                                <Switch
                                  id="auto-create"
                                  checked={settings.auto_create_events}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({ ...prev, auto_create_events: checked }))
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="auto-update">Auto-update Events</Label>
                                  <p className="text-sm text-gray-600">
                                    Automatically update calendar events when appointments change
                                  </p>
                                </div>
                                <Switch
                                  id="auto-update"
                                  checked={settings.auto_update_events}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({ ...prev, auto_update_events: checked }))
                                  }
                                />
                              </div>
                            </TabsContent>

                            <TabsContent value="privacy" className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label htmlFor="include-client">Include Client Details</Label>
                                  <p className="text-sm text-gray-600">
                                    Show client names and contact info in calendar events
                                  </p>
                                </div>
                                <Switch
                                  id="include-client"
                                  checked={settings.include_client_details}
                                  onCheckedChange={(checked) =>
                                    setSettings(prev => ({ ...prev, include_client_details: checked }))
                                  }
                                />
                              </div>

                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-amber-800">Privacy Notice</h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                      When enabled, client names and email addresses will be visible in your external calendar.
                                      Consider your organization's privacy policies before enabling this feature.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="templates" className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="event-title">Event Title Template</Label>
                                <Input
                                  id="event-title"
                                  value={settings.event_title_template}
                                  onChange={(e) =>
                                    setSettings(prev => ({ ...prev, event_title_template: e.target.value }))
                                  }
                                  placeholder="ACT Coaching Session"
                                />
                                <p className="text-xs text-gray-600">
                                  Client name will be added if privacy setting is enabled
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="event-description">Event Description Template</Label>
                                <Textarea
                                  id="event-description"
                                  value={settings.event_description_template}
                                  onChange={(e) =>
                                    setSettings(prev => ({ ...prev, event_description_template: e.target.value }))
                                  }
                                  placeholder="Coaching session scheduled via ACT Coaching For Life"
                                  rows={3}
                                />
                                <p className="text-xs text-gray-600">
                                  Session notes will be appended if available
                                </p>
                              </div>
                            </TabsContent>
                          </Tabs>

                          <div className="flex gap-2 justify-end pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setSettingsOpen(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => saveSettings(connection.connection_id)}
                            >
                              Save Settings
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>Last sync: {formatLastSync(connection.last_sync_at)}</span>
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span className={connection.is_sync_enabled ? 'text-green-600' : 'text-gray-400'}>
                          {connection.is_sync_enabled ? 'Sync enabled' : 'Sync disabled'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(connection.connection_id)}
                      >
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncCalendar(connection.connection_id)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectCalendar(connection.connection_id, connection.provider)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {!connections.find(c => c.provider === 'google') && (
                <div className="border border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <h4 className="font-medium mb-2">Connect Google Calendar</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Sync your coaching appointments with Google Calendar
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => connectCalendar('google')}
                        disabled={connecting === 'google'}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {connecting === 'google' ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          '🔵'
                        )}
                        Connect Google Calendar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarIntegration;
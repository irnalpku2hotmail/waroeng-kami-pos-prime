
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Shield, Key, Bell, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SecuritySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    loginAlerts: true,
    sessionTimeout: 30
  });

  const handleSettingChange = (key: string, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    toast({
      title: 'Settings Updated',
      description: `Security setting has been updated successfully`
    });
  };

  const handleChangePassword = () => {
    toast({
      title: 'Password Change',
      description: 'Password change functionality would be implemented here'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive security notifications via email
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Login Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of new login attempts
              </p>
            </div>
            <Switch
              checked={settings.loginAlerts}
              onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              min={5}
              max={120}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Automatically log out after period of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground">
                Update your account password
              </p>
            </div>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Security Recommendations</h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• Use a strong, unique password</li>
                  <li>• Enable two-factor authentication</li>
                  <li>• Keep your email address updated</li>
                  <li>• Review active sessions regularly</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;

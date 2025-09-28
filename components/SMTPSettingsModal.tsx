'use client';

import { useState, useEffect } from 'react';
import { X, Save, Mail, Server, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProject } from '@/contexts/ProjectContext';

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

interface SMTPSettingsModalProps {
  onClose: () => void;
}

export default function SMTPSettingsModal({ onClose }: SMTPSettingsModalProps) {
  const { currentProject, updateProjectSMTPConfig } = useProject();
  const [settings, setSettings] = useState<SMTPSettings>({
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentProject) {
      loadProjectSMTPConfig();
    }
  }, [currentProject]);

  const loadProjectSMTPConfig = () => {
    if (!currentProject) return;
    
    // Load SMTP config from project document
    if (currentProject.smtpConfig) {
      setSettings({
        host: currentProject.smtpConfig.host || '',
        port: currentProject.smtpConfig.port || 587,
        secure: currentProject.smtpConfig.secure || false,
        username: currentProject.smtpConfig.username || '',
        password: currentProject.smtpConfig.password || ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!settings.host.trim()) {
      newErrors.host = 'SMTP host is required';
    }
    
    if (!settings.port || settings.port < 1 || settings.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }
    
    if (!settings.username.trim()) {
      newErrors.username = 'Username is required';
    } else {
      // Validate email format for username
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(settings.username)) {
        newErrors.username = 'Username must be a valid email address';
      }
    }
    
    if (!settings.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !currentProject) {
      return;
    }

    setLoading(true);
    try {
      // Save SMTP config directly to Firebase
      await updateProjectSMTPConfig(currentProject.id, settings);

      toast.success('SMTP settings saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMTP = async () => {
    if (!validateForm() || !currentProject) {
      toast.error('Please fill in all required fields before testing');
      return;
    }

    const testEmail = prompt('Enter your email address to receive a test email:');
    if (!testEmail) return;

    // Validate test email
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setTesting(true);
    try {
      // First save the current settings
      await updateProjectSMTPConfig(currentProject.id, settings);
      
      // Then test the SMTP configuration
      const response = await fetch(`/api/smtp-config/${currentProject.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: testEmail
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('SMTP test successful! Check your email for the test message.');
      } else {
        toast.error(`SMTP test failed: ${result.error}`);
        console.error('SMTP test error:', result);
      }
    } catch (error) {
      console.error('Error testing SMTP:', error);
      toast.error('Failed to test SMTP configuration');
    } finally {
      setTesting(false);
    }
  };



  const handleInputChange = (field: keyof SMTPSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">SMTP Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Server Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Server Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host *
                </label>
                <input
                  type="text"
                  value={settings.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.host ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.host && (
                  <p className="text-red-500 text-xs mt-1">{errors.host}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port *
                </label>
                <input
                  type="number"
                  value={settings.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 587)}
                  placeholder="587"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.port ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.port && (
                  <p className="text-red-500 text-xs mt-1">{errors.port}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={(e) => handleInputChange('secure', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Use SSL/TLS (secure connection)</span>
              </label>
            </div>
          </div>

          {/* Authentication */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Authentication
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address (Username) *
                </label>
                <input
                  type="email"
                  value={settings.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="your-email@yourdomain.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as both the authentication username and the sender email address
                </p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800 font-medium mb-1">💡 PrivateEmail Configuration:</p>
                  <p className="text-xs text-blue-700">
                    Host: <code className="bg-blue-100 px-1 rounded">mail.privateemail.com</code> | 
                    Port: <code className="bg-blue-100 px-1 rounded">587</code> (TLS) or <code className="bg-blue-100 px-1 rounded">465</code> (SSL) | 
                    Username: Your full email address
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Your app password"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            Settings are saved per project. Sender information is automatically generated from your project details.
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleTestSMTP}
              disabled={testing || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>{testing ? 'Testing...' : 'Test SMTP'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

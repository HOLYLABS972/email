'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProject } from '@/contexts/ProjectContext';
import { Mail, Settings, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import SMTPSettingsModal from './SMTPSettingsModal';

interface ProjectSettingsFormData {
  name: string;
  description: string;
}

export default function ProjectSettings() {
  const { currentProject, updateProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [showSMTPModal, setShowSMTPModal] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectSettingsFormData>({
    defaultValues: {
      name: currentProject?.name || '',
      description: currentProject?.description || '',
    }
  });

  useEffect(() => {
    if (currentProject) {
      loadSMTPConfig();
    }
  }, [currentProject]);

  const loadSMTPConfig = () => {
    if (!currentProject) return;
    
    // SMTP config is now stored directly in the project document
    setSmtpConfig(currentProject.smtpConfig || null);
  };

  const onSubmit = async (data: ProjectSettingsFormData) => {
    if (!currentProject) return;
    
    setLoading(true);
    try {
      await updateProject(currentProject.id, data);
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  if (!currentProject) {
    return null;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
        <p className="text-gray-600">Update your project information</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            {...register('name', { required: 'Project name is required' })}
            type="text"
            className="input-field mt-1"
            placeholder="Enter project name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="input-field mt-1"
            placeholder="Enter project description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Project'}
          </button>
        </div>
      </form>

      {/* SMTP Settings Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            SMTP Settings
          </h3>
          <p className="text-gray-600">Configure email sending settings for this project</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Configuration</h4>
              <p className="text-sm text-gray-600">
                {smtpConfig ? (
                  <>
                    Configured for <span className="font-medium">{smtpConfig.host}:{smtpConfig.port}</span>
                    <br />
                    <span className="text-green-600">✓ SMTP settings are configured</span>
                    <br />
                    <span className="text-xs text-gray-500">
                      From: {currentProject?.name || 'Project Name'} &lt;{smtpConfig.username}&gt;
                    </span>
                  </>
                ) : (
                  <span className="text-orange-600">⚠ No SMTP settings configured</span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSMTPModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>{smtpConfig ? 'Edit Settings' : 'Configure SMTP'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SMTP Settings Modal */}
      {showSMTPModal && (
        <SMTPSettingsModal
          onClose={() => {
            setShowSMTPModal(false);
            loadSMTPConfig(); // Refresh config after modal closes
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  projectId: string;
  name: string;
  type: 'email' | 'notification' | 'form';
  subject?: string;
  content: string;
  variables: string[];
  triggerRoute?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TestEmailFormData {
  email: string;
  variables: Record<string, string>;
}

interface TestEmailModalProps {
  template: Template;
  onClose: () => void;
  projectId?: string;
}

export default function TestEmailModal({ template, onClose, projectId }: TestEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<TestEmailFormData>({
    defaultValues: {
      email: '',
      variables: {}
    }
  });

  const watchedVariables = watch('variables');

  // Initialize form with template variables
  useState(() => {
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialVariables[variable] = '';
    });
    setValue('variables', initialVariables);
  });

  const onSubmit = async (data: TestEmailFormData) => {
    setLoading(true);
    try {
      // Replace variables in content and subject
      let processedContent = template.content;
      let processedSubject = template.subject || '';
      
      Object.entries(data.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value);
        processedSubject = processedSubject.replace(regex, value);
      });

      // Send test email via API
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.email,
          subject: processedSubject,
          content: processedContent,
          templateId: template.id,
          variables: data.variables,
          type: template.type,
          projectId: projectId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      toast.success('Test email sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    let previewContent = template.content;
    let previewSubject = template.subject || '';
    
    Object.entries(watchedVariables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewContent = previewContent.replace(regex, value || `{{${key}}}`);
      previewSubject = previewSubject.replace(regex, value || `{{${key}}}`);
    });

    return { content: previewContent, subject: previewSubject };
  };

  const generateTriggerUrl = () => {
    if (!template.triggerRoute) return null;
    
    const baseUrl = 'https://smtp.theholylabs.com';
    const urlParams = new URLSearchParams();
    
    // Add email parameter (required by SMTP service)
    const emailValue = watch('email');
    if (emailValue && emailValue.trim()) {
      urlParams.append('email', emailValue);
    }
    
    // Add all filled variables as query parameters
    Object.entries(watchedVariables || {}).forEach(([key, value]) => {
      if (value && value.trim()) {
        urlParams.append(key, value);
      }
    });
    
    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}${template.triggerRoute}?${queryString}` : `${baseUrl}${template.triggerRoute}`;
  };

  const preview = generatePreview();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Test Email - {template.name}</h3>
            {template.triggerRoute && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Dynamic Trigger URL:</p>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs block break-all">
                  {generateTriggerUrl()}
                </code>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !previewMode 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-2" />
            Configure
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              previewMode 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Send className="h-4 w-4 inline mr-2" />
            Preview
          </button>
        </div>

        {!previewMode ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Test Email Address
              </label>
              <input
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="input-field mt-1"
                placeholder="Enter test email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {template.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Variables
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.variables.map((variable) => (
                    <div key={variable}>
                      <label htmlFor={`variables.${variable}`} className="block text-sm text-gray-600">
                        {variable}
                      </label>
                      <input
                        {...register(`variables.${variable}`)}
                        type="text"
                        className="input-field mt-1"
                        placeholder={`Enter value for ${variable}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Email Subject:</h4>
              <p className="text-gray-900">{preview.subject || 'No subject'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Email Content Preview:</h4>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.content }}
              />
            </div>
            
            {template.triggerRoute && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Dynamic Trigger URL</h4>
                <p className="text-sm text-blue-700 mb-3">
                  This URL includes your filled variables and can be used to trigger the email:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 text-sm text-gray-800 break-all">
                    {generateTriggerUrl()}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(generateTriggerUrl() || '')}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="btn-primary"
              >
                Back to Configure
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

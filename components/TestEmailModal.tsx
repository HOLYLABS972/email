'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Mail, Send, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import SMTPSettingsModal from './SMTPSettingsModal';
import { useAuth } from '@/contexts/AuthContext';
import { generateOTPCode } from '@/lib/api';

interface Template {
  id: string;
  projectId: string;
  name: string;
  type: 'email' | 'notification' | 'form';
  subject?: string;
  content: string;
  variables: string[];
  triggerRoute?: string;
  attachments?: any[];
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
  projectName?: string;
}

export default function TestEmailModal({ template, onClose, projectId, projectName }: TestEmailModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<TestEmailFormData>({
    defaultValues: {
      email: '',
      variables: {}
    }
  });

  const watchedVariables = watch('variables');

  // Initialize form with template variables and auto-fill project data
  useState(() => {
    const initialVariables: Record<string, string> = {};
    const currentYear = new Date().getFullYear().toString();
    
    template.variables.forEach(variable => {
      // Auto-fill project data
      if (variable === 'company_name' && projectName) {
        initialVariables[variable] = projectName;
      } else if (variable === 'current_year') {
        initialVariables[variable] = currentYear;
      } else if (variable === 'user_name' || variable === 'recipient_name') {
        initialVariables[variable] = user?.displayName || 'Test User'; // Use Firebase user name
      } else if (variable === 'user_email' || variable === 'recipient_email' || variable === 'to_email') {
        initialVariables[variable] = user?.email || 'test@example.com'; // Use Firebase user email
      } else if (variable === 'otp_code') {
        initialVariables[variable] = ''; // Leave OTP field empty for user to fill
      } else if (variable === 'current_date') {
        initialVariables[variable] = new Date().toLocaleDateString();
      } else if (variable === 'current_time') {
        initialVariables[variable] = new Date().toLocaleTimeString();
      } else {
        initialVariables[variable] = '';
      }
    });
    setValue('variables', initialVariables);
  });

  const onSubmit = async (data: TestEmailFormData) => {
    if (!projectId) {
      toast.error('Project ID is required to send test emails');
      return;
    }
    
    // Check if all required template variables are filled
    const missingFields = [];
    template.variables.forEach(variable => {
      const value = data.variables[variable];
      if (!value || value.trim() === '') {
        missingFields.push(variable);
      }
    });
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    try {
      // For templates with trigger routes (like OTP), use the new API
      if (template.triggerRoute) {
        // Prepare variables with destination email and name
        const enhancedVariables = {
          ...data.variables,
          to_email: data.email,
          recipient_email: data.email,
          recipient_name: data.variables.user_name || data.variables.recipient_name || 'User'
        };

        // Use SMTP service directly like the trigger URL
        const smtpUrl = new URL('https://smtp.theholylabs.com/api/email/send');
        smtpUrl.searchParams.set('email', data.email);
        smtpUrl.searchParams.set('project_id', projectId || '');
        smtpUrl.searchParams.set('template_id', template.id);
        
        // Add variables as query parameters
        Object.entries(enhancedVariables).forEach(([key, value]) => {
          smtpUrl.searchParams.set(key, value);
        });

        // Add attachments if template has them
        if (template.attachments && template.attachments.length > 0) {
          const attachmentIds = template.attachments.map(att => att.id);
          smtpUrl.searchParams.set('attachments', JSON.stringify(attachmentIds));
        }

        const response = await fetch(smtpUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
        });

        // With no-cors mode, we can't read response body, but if request completes, assume success
        toast.success('Test email sent successfully!');
        onClose();
      } else {
        // For templates without trigger routes, use the regular API
        // Replace variables in content and subject
        let processedContent = template.content;
        let processedSubject = template.subject || '';
        
        Object.entries(data.variables).forEach(([key, value]) => {
          const regex = new RegExp(`{${key}}`, 'g');
          processedContent = processedContent.replace(regex, value);
          processedSubject = processedSubject.replace(regex, value);
        });

        // Prepare variables with destination email and name (exclude company_name and current_year as they're handled by backend)
        const filteredVariables = { ...data.variables };
        delete filteredVariables.company_name;
        delete filteredVariables.current_year;
        
        const enhancedVariables = {
          ...filteredVariables,
          to_email: data.email,
          recipient_email: data.email,
          recipient_name: data.variables.user_name || data.variables.recipient_name || 'User'
        };

        // Use SMTP service directly like the trigger URL
        const smtpUrl = new URL('https://smtp.theholylabs.com/api/email/send');
        smtpUrl.searchParams.set('email', data.email);
        smtpUrl.searchParams.set('project_id', projectId || '');
        smtpUrl.searchParams.set('template_id', template.id);
        
        // Add variables as query parameters
        Object.entries(enhancedVariables).forEach(([key, value]) => {
          smtpUrl.searchParams.set(key, value);
        });

        // Add attachments if template has them
        if (template.attachments && template.attachments.length > 0) {
          const attachmentIds = template.attachments.map(att => att.id);
          smtpUrl.searchParams.set('attachments', JSON.stringify(attachmentIds));
        }

        const response = await fetch(smtpUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
        });

        // With no-cors mode, we can't read response body, but if request completes, assume success
        toast.success('Test email sent successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test email';
      
      // Show SMTP settings modal if it's an authentication error
      if (errorMessage.includes('SMTP authentication failed')) {
        setShowSmtpSettings(true);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    let previewContent = template.content;
    let previewSubject = template.subject || '';
    
    Object.entries(watchedVariables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      previewContent = previewContent.replace(regex, value || `{${key}}`);
      previewSubject = previewSubject.replace(regex, value || `{${key}}`);
    });

    return { content: previewContent, subject: previewSubject };
  };

  const generateTriggerUrl = () => {
    // Use universal email sending route
    const baseUrl = 'https://smtp.theholylabs.com';
    const urlParams = new URLSearchParams();
    
    // Add email parameter (required by SMTP service)
    const emailValue = watch('email');
    console.log('Email value for URL generation:', emailValue); // Debug log
    if (emailValue && emailValue.trim()) {
      urlParams.append('email', emailValue);
    } else {
      console.warn('No email value found for URL generation');
      return null; // Don't generate URL without email
    }
    
    // Add project_id parameter (required by SMTP service)
    if (projectId) {
      urlParams.append('project_id', projectId);
    } else {
      console.warn('No project ID found for URL generation');
      return null; // Don't generate URL without project ID
    }
    
    // Add template_id parameter (required to find the correct template)
    if (template.id) {
      urlParams.append('template_id', template.id);
    }
    
    // Add essential variables as query parameters (company_name and current_year are handled by backend)
    const essentialVariables = ['user_name'];
    essentialVariables.forEach(key => {
      const value = watchedVariables?.[key];
      if (value && value.trim()) {
        urlParams.append(key, value);
      }
    });
    
    // Add OTP code to URL if user has typed something
    const otpValue = watchedVariables?.otp_code;
    if (otpValue && otpValue.trim()) {
      urlParams.append('otp_code', otpValue);
      console.log('Added OTP to URL:', otpValue);
    }
    
    const queryString = urlParams.toString();
    const fullUrl = queryString ? `${baseUrl}/api/email/send?${queryString}` : `${baseUrl}/api/email/send`;
    console.log('Generated trigger URL:', fullUrl); // Debug log
    return fullUrl;
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
                {generateTriggerUrl() ? (
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs block break-all">
                    {generateTriggerUrl()}
                  </code>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 px-2 py-1 rounded text-xs">
                    <span className="text-yellow-800">⚠️ Please fill in the email address to generate the trigger URL</span>
                  </div>
                )}
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
                  {template.variables.map((variable) => {
                    // Only show essential user inputs, hide auto-filled data
                    const isAutoFilled = variable === 'company_name' || variable === 'current_year';
                    const isHidden = isAutoFilled;
                    
                    return (
                      <div key={variable} className={isHidden ? 'hidden' : ''}>
                        <label htmlFor={`variables.${variable}`} className="block text-sm text-gray-600">
                          {variable === 'user_name' ? 'User Name' : 
                           variable === 'otp_code' ? 'OTP Code' : 
                           variable}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          {...register(`variables.${variable}`, { 
                            required: `${variable === 'user_name' ? 'User Name' : variable === 'otp_code' ? 'OTP Code' : variable} is required` 
                          })}
                          type="text"
                          className={`input-field mt-1 ${errors.variables?.[variable] ? 'border-red-500' : ''}`}
                          placeholder={
                            variable === 'user_name' ? 'Enter user name' :
                            variable === 'otp_code' ? 'Enter OTP code' :
                            `Enter value for ${variable}`
                          }
                        />
                        {errors.variables?.[variable] && (
                          <p className="mt-1 text-sm text-red-600">{errors.variables[variable]?.message}</p>
                        )}
                      </div>
                    );
                  })}
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
            
            {/* Attachments Preview */}
            {template.attachments && template.attachments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({template.attachments.length}):</h4>
                <div className="space-y-2">
                  {template.attachments.map((attachment, index) => (
                    <div key={attachment.id || index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'} • {attachment.content_type || 'Unknown type'}
                        </p>
                      </div>
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
      
      {/* SMTP Settings Modal */}
      {showSmtpSettings && (
        <SMTPSettingsModal onClose={() => setShowSmtpSettings(false)} />
      )}
    </div>
  );
}

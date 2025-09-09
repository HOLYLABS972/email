'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProject } from '@/contexts/ProjectContext';
import { X } from 'lucide-react';
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

interface EditTemplateFormData {
  name: string;
  subject?: string;
  content: string;
  variables: string;
}

interface EditTemplateModalProps {
  template: Template;
  onClose: () => void;
}

export default function EditTemplateModal({ template, onClose }: EditTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateTemplate } = useProject();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditTemplateFormData>({
    defaultValues: {
      name: template.name,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables.join(', ')
    }
  });

  const onSubmit = async (data: EditTemplateFormData) => {
    setLoading(true);
    try {
      const variables = data.variables ? data.variables.split(',').map(v => v.trim()).filter(v => v) : [];
      
      await updateTemplate(template.id, {
        name: data.name,
        subject: data.subject,
        content: data.content,
        variables,
      });
      
      toast.success('Template updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Template Name
            </label>
            <input
              {...register('name', { required: 'Template name is required' })}
              type="text"
              className="input-field mt-1"
              placeholder="Enter template name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          {template.type === 'email' && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Email Subject
              </label>
              <input
                {...register('subject')}
                type="text"
                className="input-field mt-1"
                placeholder="Enter email subject"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Template Content
            </label>
            <textarea
              {...register('content', { required: 'Content is required' })}
              rows={8}
              className="input-field mt-1"
              placeholder="Enter template content. Use {variable_name} for dynamic content."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="variables" className="block text-sm font-medium text-gray-700">
              Variables (comma-separated)
            </label>
            <input
              {...register('variables')}
              type="text"
              className="input-field mt-1"
              placeholder="name, email, message (comma-separated)"
            />
            <p className="mt-1 text-sm text-gray-500">
              List the variables used in your template content
            </p>
          </div>
          
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
              {loading ? 'Updating...' : 'Update Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

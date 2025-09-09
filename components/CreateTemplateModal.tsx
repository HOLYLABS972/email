'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProject } from '@/contexts/ProjectContext';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import AttachmentUpload from './AttachmentUpload';
import DraggableVariables from './DraggableVariables';
import DraggableContentArea from './DraggableContentArea';

interface CreateTemplateFormData {
  name: string;
  subject?: string;
  content: string;
  variables: string;
}

interface CreateTemplateModalProps {
  onClose: () => void;
}

export default function CreateTemplateModal({ onClose }: CreateTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [variables, setVariables] = useState<string[]>([]);
  const { currentProject, createTemplate } = useProject();
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CreateTemplateFormData>({
    defaultValues: {
      variables: ''
    }
  });

  const onSubmit = async (data: CreateTemplateFormData) => {
    if (!currentProject) {
      toast.error('No project selected');
      return;
    }

    setLoading(true);
    try {
      await createTemplate({
        projectId: currentProject.id,
        name: data.name,
        type: 'email', // Default to email type
        subject: data.subject,
        content: data.content,
        variables,
        attachments: attachments, // Include attachments
      });
      
      toast.success('Template created successfully!');
      reset();
      setVariables([]);
      setAttachments([]);
      onClose();
    } catch (error) {
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Template</h3>
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
          
          {/* Draggable Variables */}
          <DraggableVariables
            variables={variables}
            onVariablesChange={setVariables}
            onVariableDrag={(variable) => {
              // This will be handled by the content area
            }}
          />
          
          {/* Draggable Content Area */}
          <DraggableContentArea
            value={watch('content') || ''}
            onChange={(value) => setValue('content', value)}
            placeholder="Enter template content. Drag variables from above or type {variable_name} manually."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
          
          {/* Attachment Upload */}
          {currentProject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <AttachmentUpload
                projectId={currentProject.id}
                onAttachmentsChange={setAttachments}
                maxFiles={5}
                maxSize={10}
              />
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
              {loading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

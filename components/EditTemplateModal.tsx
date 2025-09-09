'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProject } from '@/contexts/ProjectContext';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import AttachmentUpload from './AttachmentUpload';
import DraggableVariables from './DraggableVariables';
import DraggableContentArea from './DraggableContentArea';

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
  const [attachments, setAttachments] = useState<any[]>(template.attachments || []);
  const [variables, setVariables] = useState<string[]>(template.variables || []);
  const { updateTemplate } = useProject();
  

  // Fetch attachment details if attachments are stored as IDs
  const fetchAttachmentDetails = async (attachmentIds: string[]) => {
    if (!attachmentIds || attachmentIds.length === 0) return [];
    
    try {
      const attachmentPromises = attachmentIds.map(async (id) => {
        const response = await fetch(`/api/attachments/${id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            return result.attachment;
          }
        }
        return null;
      });
      
      const attachmentDetails = await Promise.all(attachmentPromises);
      return attachmentDetails.filter(att => att !== null);
    } catch (error) {
      console.error('Error fetching attachment details:', error);
      return [];
    }
  };

  // Load attachment details when component mounts
  useEffect(() => {
    const loadAttachments = async () => {
      if (template.attachments && template.attachments.length > 0) {
        // Check if attachments are stored as IDs (strings) or full objects
        const firstAttachment = template.attachments[0];
        if (typeof firstAttachment === 'string') {
          // Attachments are stored as IDs, fetch details
          const attachmentDetails = await fetchAttachmentDetails(template.attachments as string[]);
          setAttachments(attachmentDetails);
        } else {
          // Attachments are already full objects
          setAttachments(template.attachments);
        }
      }
    };
    
    loadAttachments();
  }, [template.attachments]);

  // Update variables when template changes
  useEffect(() => {
    setVariables(template.variables || []);
  }, [template.variables]);
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<EditTemplateFormData>({
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
      await updateTemplate(template.id, {
        name: data.name,
        subject: data.subject,
        content: data.content,
        variables,
        attachments: attachments, // Include attachments
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments (Optional)
            </label>
            <AttachmentUpload
              projectId={template.projectId}
              onAttachmentsChange={setAttachments}
              maxFiles={5}
              maxSize={10}
              initialAttachments={template.attachments || []}
            />
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

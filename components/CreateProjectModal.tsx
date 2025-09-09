'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProject } from '@/contexts/ProjectContext';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateProjectFormData {
  name: string;
  description: string;
  email: string;
}

interface CreateProjectModalProps {
  onClose: () => void;
}

export default function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const { createProject } = useProject();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateProjectFormData>();

  const onSubmit = async (data: CreateProjectFormData) => {
    setLoading(true);
    try {
      console.log('Creating project:', data);
      await createProject(data.name, data.description, data.email);
      toast.success('Project created successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
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
              rows={3}
              className="input-field mt-1"
              placeholder="Enter project description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Project Email
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                {...register('email', { 
                  required: 'Project email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: 'Email prefix can only contain letters and numbers'
                  }
                })}
                type="text"
                className="input-field rounded-r-none"
                placeholder="mediagatetv"
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                @theholylabs.com
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be the email address used for sending emails from this project
            </p>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

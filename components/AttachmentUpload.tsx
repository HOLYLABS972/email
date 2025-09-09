'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

interface AttachmentUploadProps {
  projectId: string;
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  initialAttachments?: Attachment[]; // Existing attachments to display
}

export default function AttachmentUpload({ 
  projectId, 
  onAttachmentsChange, 
  maxFiles = 5, 
  maxSize = 10,
  initialAttachments = []
}: AttachmentUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update attachments when initialAttachments change
  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const handleFileSelect = async (files: FileList | null) => {
    console.log('File selection triggered, files:', files);
    if (!files || files.length === 0) {
      console.log('No files selected or empty file list');
      return;
    }

    console.log('Converting FileList to Array, count:', files.length);
    await processFiles(Array.from(files));
  };

  const processFiles = async (files: File[]) => {
    console.log('Processing files:', files.length, 'files');
    console.log('Files details:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Validate file count
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      console.log('Oversized files:', oversizedFiles.map(f => ({ name: f.name, size: f.size, maxSize: maxSize * 1024 * 1024 })));
      toast.error(`Files must be smaller than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newAttachments = [...attachments, ...result.attachments];
        setAttachments(newAttachments);
        onAttachmentsChange(newAttachments);
        toast.success(`${result.attachments.length} file(s) uploaded successfully`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (attachmentId: string) => {
    const newAttachments = attachments.filter(att => att.id !== attachmentId);
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploading || attachments.length >= maxFiles) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors ${
          uploading || attachments.length >= maxFiles 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
        }`}
        onClick={() => {
          if (uploading || attachments.length >= maxFiles) {
            return;
          }
          fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center space-y-2 text-gray-600 hover:text-gray-800">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <Upload className="h-8 w-8" />
          )}
          <span className="text-sm">
            {uploading 
              ? 'Uploading...' 
              : `Click to upload files (max ${maxFiles}, ${maxSize}MB each)`
            }
          </span>
          {!uploading && attachments.length < maxFiles && (
            <span className="text-xs text-gray-500">
              Drag and drop files here or click to browse
            </span>
          )}
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</h4>
            <button
              onClick={() => {
                if (confirm('Remove all attachments?')) {
                  setAttachments([]);
                  onAttachmentsChange([]);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 hover:underline"
            >
              Remove All
            </button>
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${attachment.filename}?`)) {
                      removeAttachment(attachment.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title={`Remove ${attachment.filename}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

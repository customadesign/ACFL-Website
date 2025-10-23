'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  label?: string;
  description?: string;
  error?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

export default function FileUpload({
  onFilesChange,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  maxFiles = 5,
  maxSizePerFile = 10, // 10MB default
  label = 'Upload Documents',
  description = 'Upload your certifications, licenses, or other relevant documents',
  error
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > maxSizePerFile * 1024 * 1024) {
        errors.push(`${file.name} is too large (max ${maxSizePerFile}MB)`);
        return;
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(fileExtension)) {
        errors.push(`${file.name} is not an accepted file type`);
        return;
      }

      // Check total files limit
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      });
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles.map(f => f.file));
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesChange(updatedFiles.map(f => f.file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : error
            ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {acceptedTypes.join(', ')} up to {maxSizePerFile}MB each
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Recommended Documents:</h4>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Professional coaching certifications</li>
          <li>• Educational transcripts or diplomas</li>
          <li>• Professional licenses (if applicable)</li>
          <li>• Resume or CV</li>
          <li>• Letters of recommendation</li>
        </ul>
      </div>
    </div>
  );
}
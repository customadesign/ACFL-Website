'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

export default function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const userType = 'unified';
  const [sendEmails, setSendEmails] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setSelectedFile(null);
    setSendEmails(true);
    setImportResult(null);
    setDragOver(false);
  };

  const handleClose = () => {
    if (!isImporting) {
      resetModal();
      onClose();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('Please select a CSV file');
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('Please select a CSV file');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/csv-import/template/unified`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_template.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const validateCSV = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/csv-import/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        if (result.valid) {
          alert(`✅ CSV is valid! Found ${result.validRows} valid rows ready to import.`);
        } else {
          const errorDetails = result.errors.map((err: any) => `Row ${err.row}: ${err.error}`).join('\n');
          alert(`❌ CSV contains ${result.invalidRows} errors:\n\n${errorDetails.substring(0, 500)}${result.errors.length > 3 ? '\n\n...and more errors' : ''}`);
          console.error('CSV Validation Errors:', result.errors);
        }
      } else {
        throw new Error(result.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Failed to validate CSV file');
    }
  };

  const importCSV = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);
      formData.append('sendEmails', sendEmails.toString());

      const token = localStorage.getItem('token');
      const API_URL = getApiUrl();
      console.log('Making import request with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/csv-import/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Import response status:', response.status);
      console.log('Import response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Import result:', result);

      // Check if this is actually an authentication error
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${result.error || 'Please login again'}`);
        }
        if (result.error) {
          throw new Error(result.error);
        }
      }

      setImportResult(result);

      if (result.successCount > 0 && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'Import failed',
        successCount: 0,
        errorCount: 1,
        errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Import Users from CSV
          </h3>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Type
            </label>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
              Mixed User Types (Unified CSV)
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Need a template?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
              Download a minimal CSV template with only required fields: role, email, first_name, last_name.
            </p>
            <button
              onClick={downloadTemplate}
              disabled={isImporting}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Download Template</span>
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV File
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      Change File
                    </button>
                    <button
                      onClick={validateCSV}
                      disabled={isImporting}
                      className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      Validate CSV
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="text-blue-600 hover:text-blue-500 disabled:opacity-50"
                    >
                      Click to upload
                    </button>
                    {' '}or drag and drop a CSV file
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Max file size: 10MB</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Email Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendEmails"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
              disabled={isImporting}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="sendEmails" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Send welcome emails with temporary passwords
            </label>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`p-4 rounded-md border ${
              importResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
                <h4 className={`ml-2 text-sm font-medium ${
                  importResult.success
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  Import Result
                </h4>
              </div>
              <div className={`mt-2 text-sm ${
                importResult.success
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                <p>{importResult.message}</p>
                <p className="mt-1">
                  Successful: {importResult.successCount} | Failed: {importResult.errorCount}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-xs">
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li className="text-xs">
                          ... and {importResult.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={importCSV}
            disabled={!selectedFile || isImporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Upload className="h-4 w-4" />
            <span>{isImporting ? 'Importing...' : 'Import Users'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
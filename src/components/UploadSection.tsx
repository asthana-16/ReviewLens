'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DashboardData } from '@/types';

interface UploadSectionProps {
  onUploadComplete: (data: DashboardData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function UploadSection({
  onUploadComplete,
  isLoading,
  setIsLoading,
}: UploadSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setSuccess(result.message);
      setSelectedFile(null);
      onUploadComplete(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver
            ? 'border-[#3b82f6] bg-[#3b82f6]/5'
            : 'border-[#e2e8f0] hover:border-[#94a3b8]'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFileSelect(file);
        }}
      >
        <Upload className="w-10 h-10 text-[#94a3b8] mx-auto mb-4" />
        <p className="text-[#1e293b] font-medium mb-1">
          Drag and drop your reviews.csv here
        </p>
        <p className="text-sm text-[#64748b] mb-4">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-[#1e293b] text-white text-sm rounded-lg hover:bg-[#334155] transition-colors"
        >
          Browse Files
        </button>
      </div>

      {/* Selected File */}
      {selectedFile && (
        <div className="mt-4 flex items-center justify-between bg-white border border-[#e2e8f0] rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#3b82f6]" />
            <div>
              <p className="text-sm font-medium text-[#1e293b]">{selectedFile.name}</p>
              <p className="text-xs text-[#64748b]">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading}
            className="px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Analyse Reviews
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#3b82f6] animate-spin" />
            <div>
              <p className="text-sm font-medium text-[#1e293b]">Analysing reviews with AI...</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                This may take a minute. Reviews are processed in batches of 5.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
    </div>
  );
}

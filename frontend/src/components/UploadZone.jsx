import React, { useState, useRef } from 'react';
import client from '../api/client';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const UploadZone = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Check extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setStatus('error');
      setErrorMessage('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setFileName(file.name);
    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await client.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus('success');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      // Reset back to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setFileName('');
      }, 3000);
    } catch (err) {
      console.error("Upload error", err);
      setStatus('error');
      setErrorMessage(
        err.response?.data?.file?.[0] || 
        'An error occurred while uploading or parsing the file. Please try again.'
      );
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
      />
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={status === 'idle' ? onButtonClick : undefined}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 min-h-[200px] ${
          dragActive 
            ? 'border-brand-400 bg-brand-500/5' 
            : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/30'
        } ${status !== 'idle' ? 'cursor-default' : ''}`}
      >
        {status === 'idle' && (
          <>
            <div className="w-12 h-12 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-center mb-4 text-slate-400 transition-transform duration-300 group-hover:scale-110">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-200">
              Drag & drop your file here, or <span className="text-brand-400 hover:text-brand-300">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">Supports PDF, DOCX, TXT up to 10MB</p>
          </>
        )}

        {status === 'uploading' && (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
            <p className="font-semibold text-slate-200">Processing Document...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] truncate">{fileName}</p>
            <p className="text-[10px] text-slate-500 mt-2">Extracting content & indexing search context</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-4 text-emerald-400">
            <CheckCircle2 className="w-12 h-12 mb-3" />
            <p className="font-semibold text-slate-200">Upload Successful!</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] truncate">{fileName}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-2 text-rose-500">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="font-semibold text-slate-200">Upload Failed</p>
            <p className="text-xs text-rose-300/80 mt-1 max-w-[320px] px-4">{errorMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStatus('idle');
              }}
              className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadZone;

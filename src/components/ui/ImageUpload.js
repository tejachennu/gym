"use client";

import React, { useState, useRef } from 'react';

const ImageUpload = ({ 
  onUpload, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, 
  preview = true,
  label = "Drag & drop an image here, or click to select",
  multiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(f => f.size <= maxSize);
    const newFilesArray = validFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));

    if (multiple) {
      setFiles(prev => [...prev, ...newFilesArray]);
    } else {
      setFiles(newFilesArray.slice(0, 1));
    }
    
    // Perform real Google Drive upload
    performUpload(newFilesArray);
  };

  const performUpload = async (filesToUpload) => {
    setUploading(true);
    setProgress(0);
    try {
      const uploadedFiles = [];
      const increment = 100 / filesToUpload.length;
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success && data.fileUrl) {
          uploadedFiles.push({
            fileId: data.fileId,
            fileUrl: data.fileUrl
          });
          setProgress(Math.round((i + 1) * increment));
        } else {
          throw new Error(data.error || 'Upload returned failure status');
        }
      }
      
      setFiles(filesToUpload.map((f, idx) => Object.assign(f, {
        preview: uploadedFiles[idx]?.fileUrl || f.preview
      })));
      
      if (onUpload) {
        if (multiple) {
          onUpload(uploadedFiles);
        } else {
          onUpload(uploadedFiles[0]?.fileUrl || '');
        }
      }
    } catch (err) {
      console.error('Drive file upload failed:', err);
      alert(`Google Drive Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const containerStyle = {
    border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: '16px',
    backgroundColor: isDragging ? 'var(--accent-surface)' : 'var(--card)',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  };

  const uploadIconStyle = {
    fontSize: '40px',
    color: isDragging ? '#E00008' : '#AAAAAA',
    marginBottom: '8px'
  };

  const previewGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '24px'
  };

  const previewItemStyle = {
    position: 'relative',
    width: '100px',
    height: '100px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #2a2a30'
  };

  const removeBtnStyle = {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  };

  const progressBarContainer = {
    width: '100%',
    height: '6px',
    backgroundColor: '#2a2a30',
    borderRadius: '3px',
    marginTop: '16px',
    overflow: 'hidden'
  };

  const progressBar = {
    height: '100%',
    backgroundColor: '#E00008',
    width: `${progress}%`,
    transition: 'width 0.2s ease'
  };

  return (
    <div>
      <div 
        style={containerStyle}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={uploadIconStyle}>⬆️</div>
        <p style={{ color: '#FFFFFF', fontWeight: '500' }}>{label}</p>
        <p style={{ color: '#AAAAAA', fontSize: '12px' }}>
          Supports: JPG, PNG, GIF (Max {maxSize / 1024 / 1024}MB)
        </p>
        <input 
          ref={fileInputRef}
          type="file" 
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </div>

      {uploading && (
        <div style={progressBarContainer}>
          <div style={progressBar} />
        </div>
      )}

      {preview && files.length > 0 && (
        <div style={previewGridStyle}>
          {files.map((file, index) => (
            <div key={index} style={previewItemStyle}>
              <img 
                src={file.preview} 
                alt="preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button 
                style={removeBtnStyle}
                onClick={(e) => { e.stopPropagation(); removeFile(index); }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

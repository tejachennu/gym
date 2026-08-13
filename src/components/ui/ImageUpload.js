"use client";

import React, { useState, useRef } from 'react';
import { Spinner } from '@/components/ui/Loading';

const ImageUpload = ({ 
  value,
  onUpload, 
  onUploading,
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, 
  preview = true,
  label = "Drag & drop an image here, or click to select",
  multiple = false,
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
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
    if (validFiles.length === 0) return;
    performUpload(validFiles.slice(0, 1));
  };

  const performUpload = async (filesToUpload) => {
    setUploading(true);
    if (onUploading) onUploading(true);
    setProgress(0);
    try {
      const file = filesToUpload[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.fileUrl) {
        setProgress(100);
        if (onUpload) {
          onUpload(data.fileUrl);
        }
      } else {
        throw new Error(data.error || 'Upload returned failure status');
      }
    } catch (err) {
      console.error('Google Drive Upload failed:', err);
    } finally {
      setUploading(false);
      if (onUploading) onUploading(false);
    }
  };

  const containerStyle = {
    border: `2px dashed ${isDragging ? 'var(--accent, #E00008)' : 'var(--border, #2a2a30)'}`,
    borderRadius: '12px',
    backgroundColor: isDragging ? 'var(--accent-surface, rgba(224, 0, 8, 0.05))' : 'var(--card, #121214)',
    padding: compact ? '12px 8px' : '30px 16px',
    height: compact ? '110px' : '180px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? '4px' : '8px',
    position: 'relative'
  };

  // Render inline preview directly inside the container slot
  if (value) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        height: compact ? '110px' : '180px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border, #2a2a30)'
      }}>
        <img 
          src={value} 
          alt="Uploaded preview" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onUpload) onUpload('');
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            backgroundColor: 'rgba(255, 23, 68, 0.9)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div 
      style={containerStyle}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: compact ? '24px' : '36px', marginBottom: compact ? '0' : '4px' }}>
        {uploading ? (
          <Spinner size={compact ? 16 : 24} thickness={2} color="var(--accent, #E00008)" />
        ) : (
          <span style={{ fontSize: compact ? '20px' : '32px', opacity: 0.8 }}>📤</span>
        )}
      </div>
      <p style={{ 
        color: '#FFFFFF', 
        fontWeight: '600', 
        fontSize: compact ? '0.72rem' : '0.82rem', 
        margin: 0,
        opacity: uploading ? 0.6 : 1
      }}>
        {uploading ? `Uploading (${progress}%)` : (compact ? 'Tap to upload' : label)}
      </p>
      
      {!uploading && !compact && (
        <p style={{ color: 'var(--text-secondary, #AAAAAA)', fontSize: '10px', margin: 0 }}>
          Max {maxSize / 1024 / 1024}MB
        </p>
      )}
      
      <input 
        ref={fileInputRef}
        type="file" 
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;

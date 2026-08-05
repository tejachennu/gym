"use client";

import React, { useState, useEffect } from 'react';

const ImageGallery = ({ images = [], columns = 3 }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, currentIndex]);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '16px',
    width: '100%'
  };

  const itemStyle = {
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
    aspectRatio: '1',
    cursor: 'pointer',
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease'
  };

  const overlayStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    padding: '20px 16px 16px',
    color: '#fff',
    opacity: 0,
    transition: 'opacity 0.3s ease'
  };

  const lightboxStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const navBtnStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    width: '50px',
    height: '50px',
    borderRadius: '25px',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    zIndex: 10000
  };

  return (
    <>
      <div style={gridStyle}>
        {images.map((img, idx) => (
          <div 
            key={idx} 
            style={itemStyle}
            onClick={() => openLightbox(idx)}
            onMouseEnter={e => {
              e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
              e.currentTarget.querySelector('.overlay').style.opacity = '1';
            }}
            onMouseLeave={e => {
              e.currentTarget.querySelector('img').style.transform = 'scale(1)';
              e.currentTarget.querySelector('.overlay').style.opacity = '0';
            }}
          >
            <img src={img.url} alt={img.caption || 'Gallery image'} style={imageStyle} />
            <div className="overlay" style={overlayStyle}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{img.caption}</div>
              <div style={{ fontSize: '12px', color: '#AAAAAA' }}>{img.date}</div>
            </div>
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <div style={lightboxStyle}>
          <button style={{...navBtnStyle, left: '20px'}} onClick={prevImage}>❮</button>
          <img 
            src={images[currentIndex].url} 
            style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }} 
            alt="Lightbox"
          />
          <button style={{...navBtnStyle, right: '20px'}} onClick={nextImage}>❯</button>
          
          <button 
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer' }}
            onClick={closeLightbox}
          >
            ×
          </button>
          <div style={{ position: 'absolute', bottom: '20px', color: '#fff', textAlign: 'center' }}>
            <h3>{images[currentIndex].caption}</h3>
            <p>{images[currentIndex].date}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;

"use client";

import React, { useState } from 'react';

const Tabs = ({ tabs = [], activeTab, onChange }) => {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key);
  const currentTab = activeTab !== undefined ? activeTab : internalActive;

  const handleTabClick = (key) => {
    if (activeTab === undefined) {
      setInternalActive(key);
    }
    if (onChange) {
      onChange(key);
    }
  };

  const containerStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerWrapperStyle = {
    display: 'flex',
    borderBottom: '1px solid #2a2a30',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 16px',
    color: isActive ? '#E00008' : '#AAAAAA',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    position: 'relative',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });

  const indicatorStyle = {
    position: 'absolute',
    bottom: '-1px',
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#E00008',
    borderRadius: '2px 2px 0 0',
    boxShadow: '0 -2px 10px rgba(224, 0, 8, 0.4)'
  };

  const contentStyle = {
    padding: '24px 0',
    color: '#FFFFFF'
  };

  const activeContent = tabs.find(t => t.key === currentTab)?.content;

  return (
    <div style={containerStyle}>
      <div style={headerWrapperStyle} className="hide-scrollbar">
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <div 
              key={tab.key}
              style={tabStyle(isActive)}
              onClick={() => handleTabClick(tab.key)}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={e => { if(!isActive) e.currentTarget.style.color = '#AAAAAA'; }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
              {isActive && <div style={indicatorStyle} />}
            </div>
          );
        })}
      </div>
      <div style={contentStyle}>
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;

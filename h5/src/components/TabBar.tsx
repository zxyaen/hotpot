import React from 'react';
import { Tab } from '../types';
import './TabBar.css';

interface Props {
  current: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { key: Tab; label: string; emoji: string; activeEmoji: string }[] = [
  { key: 'home', label: '计时', emoji: '⏱', activeEmoji: '⏱' },
  { key: 'foods', label: '食材', emoji: '🥩', activeEmoji: '🥩' },
  { key: 'room', label: '同桌', emoji: '🍜', activeEmoji: '🍜' },
  { key: 'history', label: '历史', emoji: '📋', activeEmoji: '📋' },
  { key: 'settings', label: '设置', emoji: '⚙️', activeEmoji: '⚙️' },
];

export default function TabBar({ current, onChange }: Props) {
  return (
    <div className="tabbar">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`tab-item ${current === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <span className="tab-icon">{current === tab.key ? tab.activeEmoji : tab.emoji}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

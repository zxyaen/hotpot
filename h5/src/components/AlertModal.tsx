import React from 'react';
import './AlertModal.css';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AlertModal({ emoji, title, subtitle, onClose, onConfirm }: Props) {
  return (
    <div className="alert-mask" onClick={onClose}>
      <div className="alert-box" onClick={e => e.stopPropagation()}>
        <div className="alert-emoji-big">{emoji}</div>
        <div className="alert-title">{title}</div>
        <div className="alert-subtitle">{subtitle}</div>
        <div className="alert-actions">
          <button className="alert-btn-confirm" onClick={onConfirm}>✓ 我已捞出</button>
        </div>
      </div>
    </div>
  );
}

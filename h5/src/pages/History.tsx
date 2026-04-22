import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, formatDuration } from '../utils/helpers';
import './History.css';

export default function History() {
  const { timerStore } = useApp();
  const history = timerStore.history;

  if (history.length === 0) {
    return (
      <div className="history-page">
        <div className="history-empty">
          <div className="history-empty-emoji">📋</div>
          <div className="history-empty-title">还没有记录</div>
          <div className="history-empty-desc">结束一次涮火锅后，记录会保存在这里</div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-list">
        {history.map(record => (
          <div key={record.id} className="history-card">
            <div className="history-card-header">
              <span className="history-date">{formatDate(record.date)}</span>
              <span className="history-pot">{record.potName}</span>
            </div>
            <div className="history-stats">
              <div className="history-stat">
                <span className="stat-num">{record.foodCount}</span>
                <span className="stat-label">食材数</span>
              </div>
              <div className="history-stat">
                <span className="stat-num">{record.durationMin}</span>
                <span className="stat-label">分钟</span>
              </div>
            </div>
            <div className="history-foods">
              {record.foods.map((f, i) => (
                <span key={i} className="history-food-tag">{f.foodEmoji} {f.foodName}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

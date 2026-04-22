import React, { useState } from 'react';
import './Settings.css';

export default function Settings() {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="settings-page">
      <div className="settings-list">
        {/* 关于 */}
        <div className="settings-item" onClick={() => setShowAbout(true)}>
          <span className="settings-item-icon">ℹ️</span>
          <div className="settings-item-content">
            <span className="settings-item-title">关于</span>
            <span className="settings-item-desc">版本信息与作者</span>
          </div>
          <span className="settings-arrow">›</span>
        </div>

        {/* 清除缓存 */}
        <div className="settings-item" onClick={() => {
          if (window.confirm('确认清除所有本地数据？')) {
            localStorage.clear();
            window.location.reload();
          }
        }}>
          <span className="settings-item-icon">🗑️</span>
          <div className="settings-item-content">
            <span className="settings-item-title">清除本地数据</span>
            <span className="settings-item-desc">清除计时记录、历史记录等</span>
          </div>
          <span className="settings-arrow">›</span>
        </div>
      </div>

      {/* 关于弹窗 */}
      {showAbout && (
        <div className="about-mask" onClick={() => setShowAbout(false)}>
          <div className="about-box" onClick={e => e.stopPropagation()}>
            <div className="about-emoji">🔥</div>
            <div className="about-title">熟了吗？v0.2.0</div>
            <div className="about-desc">让每一涮都恰到好处 🔥</div>
            <div className="about-author">作者：Hidioter</div>
            <button className="about-close" onClick={() => setShowAbout(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

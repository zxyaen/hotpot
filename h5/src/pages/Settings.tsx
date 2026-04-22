import React, { useState } from 'react';
import { Popup } from 'react-vant';
import './Settings.css';

const TIME_PREFS = [
  { key: 'min', name: '最短安全', desc: '刚熟，口感最嫩' },
  { key: 'recommended', name: '推荐时间', desc: '平衡最佳口感' },
  { key: 'max', name: '完全煮熟', desc: '入味更安全' },
];

export default function Settings() {
  const [showAbout, setShowAbout] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [timePref, setTimePref] = useState<'min' | 'recommended' | 'max'>('recommended');

  return (
    <div className="settings-page">
      {/* 提醒设置 */}
      <div className="settings-group-title">🔔 提醒设置</div>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row-label">声音提醒</span>
          <div
            className={`toggle ${sound ? 'on' : ''}`}
            onClick={() => setSound(v => !v)}
          ><div className="toggle-thumb" /></div>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">震动提醒</span>
          <div
            className={`toggle ${vibrate ? 'on' : ''}`}
            onClick={() => setVibrate(v => !v)}
          ><div className="toggle-thumb" /></div>
        </div>
      </div>

      {/* 时间偏好 */}
      <div className="settings-group-title">⏱ 时间偏好</div>
      <div className="pref-cards">
        {TIME_PREFS.map(p => (
          <div
            key={p.key}
            className={`pref-card ${timePref === p.key ? 'active' : ''}`}
            onClick={() => setTimePref(p.key as any)}
          >
            <span className="pref-name">{p.name}</span>
            <span className="pref-desc">{p.desc}</span>
            {timePref === p.key && <span className="pref-check">✓</span>}
          </div>
        ))}
      </div>

      {/* 关于 */}
      <div className="settings-group-title">📱 其他</div>
      <div className="settings-group">
        <div className="settings-row clickable" onClick={() => setShowAbout(true)}>
          <span className="settings-row-label">关于本应用</span>
          <span className="settings-arrow">›</span>
        </div>
        <div className="settings-row clickable" onClick={async () => {
          const { confirm } = await import('../utils/toast');
          const ok = await confirm('清除数据', '确认清除所有本地数据？');
          if (ok) { localStorage.clear(); window.location.reload(); }
        }}>
          <span className="settings-row-label danger-text">清除本地数据</span>
          <span className="settings-arrow">›</span>
        </div>
      </div>

      {/* 关于弹窗 */}
      <Popup visible={showAbout} onClose={() => setShowAbout(false)} round style={{ width: '80%' }}>
        <div className="about-box">
          <span className="about-emoji">🔥</span>
          <span className="about-title">熟了吗？v0.2.0</span>
          <span className="about-desc">让每一涮都恰到好处 🔥</span>
          <span className="about-author">作者：Hidioter</span>
          <button className="about-close-btn" onClick={() => setShowAbout(false)}>关闭</button>
        </div>
      </Popup>
    </div>
  );
}

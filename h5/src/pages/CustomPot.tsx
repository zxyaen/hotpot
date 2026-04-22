import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Pot } from '../types';
import { confirm, toast, toastSuccess } from '../utils/toast';
import './CustomPot.css';

const EMOJI_OPTIONS = ['🍲','🥘','🔥','🌶️','🍅','🍄','🥬','🧅','🫕','☯️','🌊','🌿','🍋','🫚','🧂','⭐','💛','❤️','🟠','🔴','🟡','🟢','🔵','🟣'];
const COLOR_OPTIONS = [
  '#FFF5E6','#FF6347','#C0392B','#8B0000','#D4A574',
  '#F5DEB3','#228B22','#4169E1','#FF8C00','#9B59B6',
  '#1ABC9C','#F39C12','#E74C3C','#2C3E50','#ECF0F1',
];

interface Props {
  editId?: string;
  onBack: () => void;
}

export default function CustomPot({ editId, onBack }: Props) {
  const { customDataStore } = useApp();
  const isEdit = !!editId;

  const [form, setForm] = useState({
    name: '',
    emoji: '🍲',
    color: '#FFF5E6',
    boilTemp: 100,
    timeFactor: '1.0',
    description: '',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  useEffect(() => {
    if (editId) {
      const pot = customDataStore.getPotById(editId);
      if (pot) {
        setForm({
          name: pot.name,
          emoji: pot.emoji,
          color: pot.color,
          boilTemp: pot.boilTemp,
          timeFactor: pot.timeFactor.toFixed(2),
          description: pot.description || '',
        });
      }
    }
  }, [editId, customDataStore]);

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) { toast('请填写锅底名称'); return; }
    const tf = parseFloat(form.timeFactor);
    if (isNaN(tf) || tf <= 0 || tf > 3) {
      toast('时间系数需在 0.1 ~ 3.0 之间');
      return;
    }
    const id = isEdit ? editId! : `cpot_${Date.now()}`;
    const pot: Pot = {
      id,
      name: form.name.trim(),
      emoji: form.emoji,
      color: form.color,
      boilTemp: Number(form.boilTemp),
      timeFactor: tf,
      description: form.description.trim(),
    };
    customDataStore.savePot(pot);
    toastSuccess(isEdit ? '保存成功' : '添加成功');
    setTimeout(onBack, 600);
  }

  async function handleDelete() {
    const ok = await confirm(`删除「${form.name}」锅底？`, '删除后无法恢复', {
      confirmText: '确认删除', confirmDanger: true,
    });
    if (ok) {
      customDataStore.deletePot(editId!);
      toast('已删除');
      setTimeout(onBack, 400);
    }
  }

  function handleConfirmCustomEmoji() {
    if (customEmoji.trim()) {
      setField('emoji', customEmoji.trim());
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
  }

  return (
    <div className="cp-page">
      {/* 顶部导航 */}
      <div className="cp-header">
        <button className="cp-back" onClick={onBack}>‹ 返回</button>
        <span className="cp-title">{isEdit ? '编辑锅底' : '新增锅底'}</span>
        <div className="cp-header-right">
          {isEdit && (
            <button className="cp-delete-btn" onClick={handleDelete}>删除</button>
          )}
        </div>
      </div>

      <div className="cp-body">
        {/* 预览卡片 */}
        <div className="cp-preview" style={{ background: form.color }}>
          <span className="cp-preview-emoji">{form.emoji}</span>
          <div className="cp-preview-info">
            <span className="cp-preview-name">{form.name || '锅底名称'}</span>
            <span className="cp-preview-desc">{form.description || '暂无描述'} · {form.boilTemp}°C</span>
          </div>
        </div>

        {/* Emoji */}
        <div className="cp-section">
          <div className="cp-label">锅底图标</div>
          <div className="cp-emoji-row">
            <span className="cp-cur-emoji" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowColorPicker(false); }}>
              {form.emoji} <span className="cp-change-hint">换图标</span>
            </span>
            <span className="cp-cur-color"
              style={{ background: form.color, border: '2px solid #E8E8E8' }}
              onClick={() => { setShowColorPicker(!showColorPicker); setShowEmojiPicker(false); }}
            >
              <span className="cp-change-hint" style={{ color: '#555' }}>换颜色</span>
            </span>
          </div>

          {showEmojiPicker && (
            <div className="cp-picker-box">
              <div className="cp-emoji-grid">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    className={`cp-emoji-item ${form.emoji === e ? 'active' : ''}`}
                    onClick={() => { setField('emoji', e); setShowEmojiPicker(false); }}
                  >{e}</button>
                ))}
              </div>
              <div className="cp-custom-emoji-row">
                <input
                  className="cp-input cp-input-sm"
                  placeholder="或输入 emoji / 文字"
                  value={customEmoji}
                  onChange={e => setCustomEmoji(e.target.value)}
                  maxLength={4}
                />
                <button className="cp-btn-sm" onClick={handleConfirmCustomEmoji}>确认</button>
              </div>
            </div>
          )}

          {showColorPicker && (
            <div className="cp-picker-box">
              <div className="cp-color-grid">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    className={`cp-color-item ${form.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => { setField('color', c); setShowColorPicker(false); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 名称 */}
        <div className="cp-section">
          <div className="cp-label">锅底名称 <span className="cp-required">*</span></div>
          <input
            className="cp-input"
            placeholder="例如：椰奶锅"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            maxLength={10}
          />
        </div>

        {/* 描述 */}
        <div className="cp-section">
          <div className="cp-label">简介（选填）</div>
          <input
            className="cp-input"
            placeholder="例如：香甜清淡，适合涮海鲜"
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            maxLength={20}
          />
        </div>

        {/* 沸腾温度 */}
        <div className="cp-section">
          <div className="cp-label">沸腾温度（°C）</div>
          <input
            className="cp-input cp-input-num"
            type="number"
            inputMode="numeric"
            value={form.boilTemp}
            onChange={e => setField('boilTemp', parseInt(e.target.value) || 100)}
          />
          <div className="cp-hint">清汤 100°C，油基锅底通常偏高</div>
        </div>

        {/* 时间系数 */}
        <div className="cp-section">
          <div className="cp-label">时间系数</div>
          <input
            className="cp-input cp-input-num"
            type="number"
            inputMode="decimal"
            step="0.05"
            value={form.timeFactor}
            onChange={e => setField('timeFactor', e.target.value)}
          />
          <div className="cp-hint">
            系数越小，实际涮煮时间越短。例如 0.9 表示比清汤快 10%。范围 0.1 ~ 3.0
          </div>

          {/* 系数参考 */}
          <div className="cp-factor-ref">
            {[
              { label: '清汤', val: '1.0' },
              { label: '番茄', val: '1.05' },
              { label: '麻辣', val: '0.95' },
              { label: '牛油', val: '0.9' },
            ].map(item => (
              <button
                key={item.val}
                className={`cp-factor-btn ${form.timeFactor === item.val ? 'active' : ''}`}
                onClick={() => setField('timeFactor', item.val)}
              >{item.label} {item.val}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部保存 */}
      <div className="cp-footer">
        <button className="cp-save-btn" onClick={handleSave}>
          {isEdit ? '保存修改' : '添加锅底'}
        </button>
      </div>
    </div>
  );
}

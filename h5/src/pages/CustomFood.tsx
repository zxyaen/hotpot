import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Food } from '../types';
import { confirm, toast, toastSuccess } from '../utils/toast';
import './CustomFood.css';

const EMOJI_OPTIONS = [
  '🥩','🐑','🐄','🦐','🐟','🦑','🦀','🥬','🍄','🥔','🌽','🍜',
  '🥟','🍖','🍗','🥚','🧄','🧅','🥦','🫑','🍆','🍅','🥕','🧆',
  '⚪','🟤','🟠','🟥','🟨','🟫','🌿','🍠','🫀','🦆','🧠','🥒',
  '🌶️','🫚','🧂','🫐','🍋','🥝','🍓','🍑','🥭','🍇','🍒','🍌',
];

const CATEGORIES = ['牛肉类','羊肉类','海鲜类','内脏类','丸滑类','豆制品','主食类','蔬菜类','菌菇类','自定义'];

interface Props {
  editId?: string;
  onBack: () => void;
}

export default function CustomFood({ editId, onBack }: Props) {
  const { customDataStore } = useApp();
  const isEdit = !!editId;

  const [form, setForm] = useState({
    name: '',
    emoji: '🥩',
    category: '自定义',
    cookTimeMin: 30,
    cookTimeRec: 60,
    cookTimeMax: 120,
    tips: '',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  useEffect(() => {
    if (editId) {
      const food = customDataStore.getFoodById(editId);
      if (food) {
        setForm({
          name: food.name,
          emoji: food.emoji,
          category: food.category,
          cookTimeMin: food.cookTime.min,
          cookTimeRec: food.cookTime.recommended,
          cookTimeMax: food.cookTime.max,
          tips: food.tips || '',
        });
      }
    }
  }, [editId, customDataStore]);

  function setField<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) { toast('请填写食材名称'); return; }
    if (form.cookTimeMin <= 0 || form.cookTimeRec <= 0 || form.cookTimeMax <= 0) {
      toast('涮煮时间需大于 0');
      return;
    }
    const id = isEdit ? editId! : `custom_${Date.now()}`;
    const food: Food = {
      id,
      name: form.name.trim(),
      emoji: form.emoji,
      category: form.category,
      cookTime: {
        min: Number(form.cookTimeMin),
        recommended: Number(form.cookTimeRec),
        max: Number(form.cookTimeMax),
      },
      tips: form.tips.trim(),
      popularity: 80,
    };
    customDataStore.saveFood(food);
    toastSuccess(isEdit ? '修改成功' : '添加成功');
    setTimeout(onBack, 600);
  }

  async function handleDelete() {
    const ok = await confirm(`删除「${form.name}」？`, '删除后无法恢复', {
      confirmText: '确认删除', confirmDanger: true,
    });
    if (ok) {
      customDataStore.deleteFood(editId!);
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
    <div className="cf-page">
      {/* 顶部导航 */}
      <div className="cf-header">
        <button className="cf-back" onClick={onBack}>‹ 返回</button>
        <span className="cf-title">{isEdit ? '编辑食材' : '新增食材'}</span>
        <div className="cf-header-right">
          {isEdit && (
            <button className="cf-delete-btn" onClick={handleDelete}>删除</button>
          )}
        </div>
      </div>

      <div className="cf-body">
        {/* Emoji 选择 */}
        <div className="cf-section">
          <div className="cf-label">食材图标</div>
          <div className="cf-emoji-preview" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <span className="cf-emoji-big">{form.emoji}</span>
            <span className="cf-emoji-hint">点击更换</span>
          </div>

          {showEmojiPicker && (
            <div className="cf-emoji-picker">
              <div className="cf-emoji-grid">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    className={`cf-emoji-item ${form.emoji === e ? 'active' : ''}`}
                    onClick={() => { setField('emoji', e); setShowEmojiPicker(false); }}
                  >{e}</button>
                ))}
              </div>
              <div className="cf-emoji-custom">
                <input
                  className="cf-input cf-input-sm"
                  placeholder="或直接输入 emoji / 文字"
                  value={customEmoji}
                  onChange={e => setCustomEmoji(e.target.value)}
                  maxLength={4}
                />
                <button className="cf-btn-sm" onClick={handleConfirmCustomEmoji}>确认</button>
              </div>
            </div>
          )}
        </div>

        {/* 食材名称 */}
        <div className="cf-section">
          <div className="cf-label">食材名称 <span className="cf-required">*</span></div>
          <input
            className="cf-input"
            placeholder="例如：牛肉卷"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            maxLength={10}
          />
        </div>

        {/* 分类 */}
        <div className="cf-section">
          <div className="cf-label">食材分类</div>
          <div className="cf-chip-row">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cf-chip ${form.category === cat ? 'active' : ''}`}
                onClick={() => setField('category', cat)}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* 涮煮时间 */}
        <div className="cf-section">
          <div className="cf-label">涮煮时间（秒）<span className="cf-required">*</span></div>
          <div className="cf-time-row">
            <div className="cf-time-item">
              <span className="cf-time-label">最短</span>
              <input
                className="cf-input cf-input-num"
                type="number"
                inputMode="numeric"
                value={form.cookTimeMin}
                onChange={e => setField('cookTimeMin', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="cf-time-sep">~</div>
            <div className="cf-time-item">
              <span className="cf-time-label">推荐</span>
              <input
                className="cf-input cf-input-num cf-input-rec"
                type="number"
                inputMode="numeric"
                value={form.cookTimeRec}
                onChange={e => setField('cookTimeRec', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="cf-time-sep">~</div>
            <div className="cf-time-item">
              <span className="cf-time-label">最长</span>
              <input
                className="cf-input cf-input-num"
                type="number"
                inputMode="numeric"
                value={form.cookTimeMax}
                onChange={e => setField('cookTimeMax', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="cf-hint">推荐时间将作为计时器的默认倒计时</div>
        </div>

        {/* 小贴士 */}
        <div className="cf-section">
          <div className="cf-label">小贴士（选填）</div>
          <textarea
            className="cf-textarea"
            placeholder="例如：变色即可捞出"
            value={form.tips}
            onChange={e => setField('tips', e.target.value)}
            rows={3}
            maxLength={50}
          />
        </div>
      </div>

      {/* 底部保存按钮 */}
      <div className="cf-footer">
        <button className="cf-save-btn" onClick={handleSave}>
          {isEdit ? '保存修改' : '添加食材'}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Popup } from 'react-vant';
import { getAllFoods, getCategories } from '../utils/builtinData';
import './FoodPicker.css';

interface Props {
  visible: boolean;
  onSelect: (foodId: string) => void;
  onClose: () => void;
}

export default function FoodPicker({ visible, onSelect, onClose }: Props) {
  const [category, setCategory] = useState('全部');
  const foods = getAllFoods();
  const categories = ['全部', ...getCategories()];
  const filtered = category === '全部' ? foods : foods.filter(f => f.category === category);

  return (
    <Popup
      position="bottom"
      visible={visible}
      onClose={onClose}
      round
      style={{ height: '55vh', display: 'flex', flexDirection: 'column' }}
    >
      <div className="food-picker">
        {/* 标题 + 关闭 */}
        <div className="fp-header">
          <span className="fp-title">选择食材</span>
          <span className="fp-close" onClick={onClose}>✕</span>
        </div>

        {/* 分类横滑（固定，不随列表滚动） */}
        <div className="fp-cats">
          <div className="fp-cat-row">
            {categories.map(cat => (
              <button
                key={cat}
                className={`fp-cat-tag ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* 食材网格（3列） */}
        <div className="fp-grid">
          {filtered.map(food => (
            <div key={food.id} className="fp-grid-item" onClick={() => onSelect(food.id)}>
              <span className="fp-grid-emoji">{food.emoji}</span>
              <span className="fp-grid-name">{food.name}</span>
              <span className="fp-grid-time">{food.cookTime.recommended}s</span>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  );
}

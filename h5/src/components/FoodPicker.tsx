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
      style={{ height: '50vh', display: 'flex', flexDirection: 'column' }}
    >
      <div className="food-picker">
        <div className="fp-header">
          <span className="fp-title">选择食材</span>
          <span className="fp-close" onClick={onClose}>✕</span>
        </div>

        {/* 分类横滑 */}
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

        {/* 食材列表 */}
        <div className="fp-list">
          {filtered.map(food => (
            <div key={food.id} className="fp-item" onClick={() => onSelect(food.id)}>
              <span className="fp-emoji">{food.emoji}</span>
              <div className="fp-detail">
                <span className="fp-name">{food.name}</span>
                <span className="fp-time">⏱ {food.cookTime.recommended}秒</span>
              </div>
              <span className="fp-add">+</span>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  );
}

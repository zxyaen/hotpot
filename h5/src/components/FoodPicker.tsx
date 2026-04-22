import React, { useState } from 'react';
import { getAllFoods, getCategories } from '../utils/builtinData';
import './FoodPicker.css';

interface Props {
  onSelect: (foodId: string) => void;
  onClose: () => void;
}

export default function FoodPicker({ onSelect, onClose }: Props) {
  const [category, setCategory] = useState('全部');
  const foods = getAllFoods();
  const categories = ['全部', ...getCategories()];
  const filtered = category === '全部' ? foods : foods.filter(f => f.category === category);

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box food-picker-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">选择食材</span>
          <span className="modal-close" onClick={onClose}>✕</span>
        </div>
        {/* 分类 */}
        <div className="cat-scroll">
          <div className="cat-row">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-tag ${category === cat ? 'cat-active' : ''}`}
                onClick={() => setCategory(cat)}
              >{cat}</button>
            ))}
          </div>
        </div>
        {/* 食材列表 */}
        <div className="food-list">
          {filtered.map(food => (
            <div key={food.id} className="food-item" onClick={() => onSelect(food.id)}>
              <span className="food-item-emoji">{food.emoji}</span>
              <div className="food-item-detail">
                <span className="food-item-name">{food.name}</span>
                <span className="food-item-time">⏱ {food.cookTime.recommended}秒</span>
              </div>
              <span className="food-add-btn">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

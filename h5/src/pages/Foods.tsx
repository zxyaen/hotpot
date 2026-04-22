import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAllFoods, getCategories } from '../utils/builtinData';
import { formatDuration } from '../utils/helpers';
import './Foods.css';

export default function Foods() {
  const { timerStore } = useApp();
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  const foods = getAllFoods();
  const categories = ['全部', ...getCategories()];

  const filtered = foods.filter(f => {
    const matchCat = category === '全部' || f.category === category;
    const matchSearch = !search || f.name.includes(search);
    return matchCat && matchSearch;
  });

  function handleAdd(foodId: string) {
    const timer = timerStore.addTimer(foodId);
    if (timer) {
      // 简单通知
      const food = foods.find(f => f.id === foodId);
      if (food) {
        const toast = document.createElement('div');
        toast.className = 'food-toast';
        toast.textContent = `${food.emoji} 已开始计时`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    }
  }

  return (
    <div className="foods-page">
      {/* 搜索 */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="搜索食材..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 分类 */}
      <div className="cats-scroll">
        <div className="cats-row">
          {categories.map(cat => (
            <button key={cat} className={`cat-chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 食材列表 */}
      <div className="foods-list">
        {filtered.map(food => (
          <div key={food.id} className="food-card">
            <div className="food-card-left">
              <span className="food-card-emoji">{food.emoji}</span>
              <div className="food-card-info">
                <span className="food-card-name">{food.name}</span>
                <span className="food-card-cat">{food.category}</span>
                <span className="food-card-tips">{food.tips}</span>
              </div>
            </div>
            <div className="food-card-right">
              <div className="food-time-row">
                <span className="food-time-label">推荐</span>
                <span className="food-time-value">{formatDuration(food.cookTime.recommended)}</span>
              </div>
              <button className="btn-start-timer" onClick={() => handleAdd(food.id)}>
                计时
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

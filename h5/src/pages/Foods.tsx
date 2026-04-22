import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAllFoods, getCategories } from '../utils/builtinData';
import { formatDuration } from '../utils/helpers';
import { toast } from '../utils/toast';
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
    const food = foods.find(f => f.id === foodId);
    if (timer && food) toast(`${food.emoji} ${food.name} 开始计时`);
  }

  return (
    <div className="foods-page">
      {/* 搜索框 */}
      <div className="foods-search">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder="搜索食材..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <span className="search-clear" onClick={() => setSearch('')}>✕</span>}
      </div>

      {/* 分类 */}
      <div className="foods-cats">
        <div className="foods-cat-row">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* 食材列表 */}
      <div className="foods-list">
        {filtered.map(food => (
          <div key={food.id} className="food-card">
            <span className="food-card-emoji">{food.emoji}</span>
            <div className="food-card-info">
              <span className="food-card-name">{food.name}</span>
              <span className="food-card-cat">{food.category}</span>
              <span className="food-card-tips">{food.tips}</span>
            </div>
            <div className="food-card-right">
              <span className="food-card-time">{formatDuration(food.cookTime.recommended)}</span>
              <button className="btn-time" onClick={() => handleAdd(food.id)}>计时</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="foods-empty">暂无相关食材</div>
        )}
      </div>
    </div>
  );
}

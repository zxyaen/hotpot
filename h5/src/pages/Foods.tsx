import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAllFoods, getCategories } from '../utils/builtinData';
import { formatDuration } from '../utils/helpers';
import { toast, alert } from '../utils/toast';
import './Foods.css';

export default function Foods() {
  const { timerStore } = useApp();
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');
  // 点击动画：记录刚添加的食材id
  const [addedId, setAddedId] = useState<string | null>(null);
  const foods = getAllFoods();
  const categories = ['全部', ...getCategories()];

  const filtered = foods.filter(f => {
    const matchCat = category === '全部' || f.category === category;
    const matchSearch = !search || f.name.includes(search);
    return matchCat && matchSearch;
  });

  async function handleAdd(foodId: string) {
    // 未选锅底时弹提示
    if (!timerStore.currentPotId) {
      await alert('请先选择锅底', '不同锅底会影响涮煮时间，请先在计时页选择锅底 🥘', {
        confirmText: '去选择',
        confirmDanger: false,
      });
      return;
    }
    const result = timerStore.addTimer(foodId);
    if (result === null) {
      toast('同时最多计时8个');
      return;
    }
    const food = foods.find(f => f.id === foodId);
    if (food) {
      toast(`${food.emoji} ${food.name} 下锅啦！`);
      // 触发动画
      setAddedId(foodId);
      setTimeout(() => setAddedId(null), 600);
    }
  }

  return (
    <div className="foods-page">
      {/* 固定顶部：搜索 + 分类 */}
      <div className="foods-sticky-top">
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
      </div>

      {/* 3列网格食材列表 */}
      <div className="foods-scroll-body">
        {filtered.map(food => (
          <div
            key={food.id}
            className={`food-card ${addedId === food.id ? 'food-card-added' : ''}`}
            onClick={() => handleAdd(food.id)}
          >
            <span className="food-card-emoji">{food.emoji}</span>
            <span className="food-card-name">{food.name}</span>
            <span className="food-card-time">{formatDuration(food.cookTime.recommended)}</span>
            {addedId === food.id && <span className="food-card-check">✓</span>}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="foods-empty">暂无相关食材</div>
        )}
      </div>
    </div>
  );
}

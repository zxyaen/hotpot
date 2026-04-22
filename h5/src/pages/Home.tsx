import React, { useState, useEffect } from 'react';
import { Popup } from 'react-vant';
import { useApp } from '../context/AppContext';
import { TimerItem } from '../types';
import { formatCountdown, formatDuration } from '../utils/helpers';
import { getPotById, getAllPots } from '../utils/builtinData';
import { confirm, toast, toastSuccess } from '../utils/toast';
import FoodPicker from '../components/FoodPicker';
import AlertModal from '../components/AlertModal';
import './Home.css';

export default function Home() {
  const { timerStore } = useApp();
  const [, forceUpdate] = useState(0);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [showPotPicker, setShowPotPicker] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [alertTimer, setAlertTimer] = useState<TimerItem | null>(null);

  useEffect(() => {
    const unsub1 = timerStore.subscribe(() => forceUpdate(n => n + 1));
    const unsub2 = timerStore.onTimerEnd((timer) => setAlertTimer(timer));
    return () => { unsub1(); unsub2(); };
  }, [timerStore]);

  const pot = timerStore.currentPotId ? getPotById(timerStore.currentPotId) : null;

  const timersView = timerStore.timers.map(t => {
    const remaining = timerStore.getRemaining(t);
    const total = t.duration;
    const elapsed = total - remaining;
    const progress = Math.min(100, Math.round((elapsed / total) * 100));
    const isOver = remaining <= 0 && t.status === 'running';
    const urgencyClass =
      isOver ? 'status-over' :
      t.status !== 'running' ? '' :
      remaining > total * 0.4 ? 'urgency-safe' : 'urgency-warn';
    return {
      ...t, remaining, remainingText: formatCountdown(remaining),
      progressPercent: progress,
      totalText: formatDuration(total),
      elapsedText: formatDuration(elapsed),
      isOver, urgencyClass,
      isSelected: selectedIds.includes(t.id),
      statusText:
        t.status === 'done' ? '已完成' :
        t.status === 'cancelled' ? '已取消' :
        isOver ? '到时了' :
        remaining > total * 0.4 ? '最佳口感' : '还差一点',
      statusClass:
        t.status === 'done' ? 'status-done' :
        t.status === 'cancelled' ? 'status-cancelled' :
        isOver ? 'status-over' : 'status-running',
    };
  });

  const runningTimers = timersView.filter(t => t.status === 'running' && !t.isOver);

  function handleCardTap(id: string, status: string, isOver: boolean) {
    if (!batchMode) return;
    if (status !== 'running' || isOver) return;
    setSelectedIds(prev => {
      const idx = prev.indexOf(id);
      return idx >= 0 ? prev.filter(x => x !== id) : [...prev, id];
    });
  }

  async function handleBatchCancel() {
    if (selectedIds.length === 0) return;
    const ok = await confirm('批量取消计时', `确定取消 ${selectedIds.length} 个正在计时的食材？`);
    if (ok) {
      selectedIds.forEach(id => timerStore.cancelTimer(id));
      toast(`已取消 ${selectedIds.length} 个`);
      setBatchMode(false);
      setSelectedIds([]);
    }
  }

  async function handleCancelTimer(id: string) {
    const ok = await confirm('取消计时', '确定要取消这个计时吗？');
    if (ok) timerStore.cancelTimer(id);
  }

  async function handleClearAll() {
    const ok = await confirm('结束本次涮火锅', '将保存到历史记录并清空当前列表');
    if (ok) {
      timerStore.clearAll();
      toastSuccess('已保存到历史');
      setBatchMode(false);
      setSelectedIds([]);
    }
  }

  return (
    <div className="home-page">
      {/* 锅底选择卡 */}
      <div className="pot-selector card" onClick={() => setShowPotPicker(true)}>
        <div className="pot-info">
          <span className="pot-emoji">{pot?.emoji || '🥘'}</span>
          <div className="pot-text">
            <div className="pot-name">{pot?.name || '选择锅底'}</div>
            <div className="pot-desc">
              {pot ? `${pot.description} · ${pot.boilTemp}°C` : '不同锅底温度不同，影响涮煮时间'}
            </div>
          </div>
        </div>
        <span className="arrow">›</span>
      </div>

      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-num">{timerStore.runningCount}</span>
          <span className="status-label">涮煮中</span>
        </div>
        <div className="status-divider" />
        <div className="status-item">
          <span className="status-num">{timerStore.timers.length}</span>
          <span className="status-label">总计时</span>
        </div>
      </div>

      {/* 批量工具栏 */}
      {batchMode && (
        <div className="batch-toolbar">
          <span className="batch-count">
            {selectedIds.length > 0 ? `已选 ${selectedIds.length} 个` : '点击卡片选择'}
          </span>
          <div className="batch-actions">
            <button className="batch-btn" onClick={() => {
              const runIds = runningTimers.map(t => t.id);
              setSelectedIds(selectedIds.length === runIds.length ? [] : runIds);
            }}>
              {selectedIds.length > 0 && selectedIds.length === runningTimers.length ? '取消全选' : '全选'}
            </button>
            <button
              className={`batch-btn batch-cancel-btn ${selectedIds.length === 0 ? 'disabled' : ''}`}
              onClick={handleBatchCancel}
            >取消计时</button>
          </div>
        </div>
      )}

      {/* 计时器列表 */}
      {timersView.length > 0 ? (
        <div className="timer-list">
          {timersView.map(item => (
            <div
              key={item.id}
              className={[
                'timer-card', item.statusClass, item.urgencyClass,
                batchMode && item.status === 'running' && !item.isOver ? 'batch-selectable' : '',
                item.isSelected ? 'batch-selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleCardTap(item.id, item.status, item.isOver)}
            >
              {/* 多选勾选 */}
              {batchMode && item.status === 'running' && !item.isOver && (
                <div className="select-check">
                  <div className={`check-circle ${item.isSelected ? 'checked' : ''}`}>
                    {item.isSelected && <span>✓</span>}
                  </div>
                </div>
              )}

              {/* 顶部区域 */}
              <div className="timer-top">
                <div className="timer-food">
                  <span className="food-emoji">{item.foodEmoji}</span>
                  <div className="food-info">
                    <span className="food-name">{item.foodName}</span>
                    <span className={`status-tag ${item.statusClass} ${item.urgencyClass}`}>
                      {item.statusText}
                    </span>
                  </div>
                </div>
                {item.status === 'running' && !item.isOver ? (
                  <div className={`timer-countdown ${item.urgencyClass}`}>{item.remainingText}</div>
                ) : item.isOver ? (
                  <div className="timer-countdown status-over blink">🔔</div>
                ) : (
                  <div className="timer-countdown status-done">✓</div>
                )}
              </div>

              {/* 进度条 */}
              {item.status === 'running' && (
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${item.urgencyClass} ${item.isOver ? 'status-over' : ''}`}
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              )}

              {/* 时间元信息 */}
              <div className="timer-meta">
                {item.status === 'running' && !item.isOver ? (
                  <span className="meta-text">推荐 {item.totalText} · 已入锅 {item.elapsedText}</span>
                ) : item.isOver ? (
                  <span className="meta-over">🔔 到时了！快捞出来~</span>
                ) : (
                  <span className="meta-text">总时长 {item.totalText}</span>
                )}
              </div>

              {/* 操作按钮 */}
              {!batchMode && (
                <div className="timer-actions">
                  {item.status === 'running' && !item.isOver ? (
                    <button className="btn-mini btn-cancel" onClick={e => { e.stopPropagation(); handleCancelTimer(item.id); }}>
                      取消
                    </button>
                  ) : item.isOver ? (
                    <button className="btn-mini btn-confirm" onClick={e => { e.stopPropagation(); timerStore.completeTimer(item.id); }}>
                      ✓ 我已捞出
                    </button>
                  ) : (
                    <button className="btn-mini btn-remove" onClick={e => { e.stopPropagation(); timerStore.removeTimer(item.id); }}>
                      移除
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-emoji">🔥</div>
          <div className="empty-title">准备开涮了吗？</div>
          <div className="empty-desc">下完菜后点击下方按钮开始计时</div>
        </div>
      )}

      {/* 底部操作区（固定在 tabbar 上方） */}
      <div className="bottom-actions">
        {batchMode ? (
          <button className="btn-batch-exit" onClick={() => { setBatchMode(false); setSelectedIds([]); }}>
            完成
          </button>
        ) : (
          <>
            <button className="btn-add-food" onClick={() => setShowFoodPicker(true)}>
              <span className="btn-add-icon">🍲</span>
              <span className="btn-add-text">下菜开始计时</span>
            </button>
            {timerStore.timers.length > 0 && (
              <div className="bottom-secondary">
                <button className="link" onClick={() => timerStore.clearFinished()}>清除已完成</button>
                {timerStore.runningCount > 0 && (
                  <button className="link batch-link" onClick={() => { setBatchMode(true); setSelectedIds([]); }}>
                    批量取消
                  </button>
                )}
                <button className="link danger" onClick={handleClearAll}>结束本次</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 食材选择 Popup */}
      <FoodPicker visible={showFoodPicker} onSelect={foodId => timerStore.addTimer(foodId)} onClose={() => setShowFoodPicker(false)} />

      {/* 锅底选择 Popup */}
      <Popup position="bottom" visible={showPotPicker} onClose={() => setShowPotPicker(false)} round style={{ height: '55vh' }}>
        <PotList onClose={() => setShowPotPicker(false)} />
      </Popup>

      {/* 到时提醒弹窗 */}
      {alertTimer && (
        <AlertModal
          emoji={alertTimer.foodEmoji}
          title={`${alertTimer.foodName} 好啦！`}
          subtitle="🔔 快捞出来吧，别糊啦~"
          onClose={() => setAlertTimer(null)}
          onConfirm={() => { timerStore.completeTimer(alertTimer.id); setAlertTimer(null); }}
        />
      )}
    </div>
  );
}

function PotList({ onClose }: { onClose: () => void }) {
  const { timerStore } = useApp();
  const pots = getAllPots();
  return (
    <div className="pot-picker-inner">
      <div className="popup-header">
        <span className="popup-title">选择锅底</span>
        <span className="popup-close" onClick={onClose}>✕</span>
      </div>
      <div className="pot-list">
        {pots.map(p => (
          <div
            key={p.id}
            className={`pot-item ${timerStore.currentPotId === p.id ? 'active' : ''}`}
            onClick={() => { timerStore.setPot(p.id); onClose(); }}
          >
            <span className="pot-item-emoji">{p.emoji}</span>
            <div className="pot-item-info">
              <span className="pot-item-name">{p.name}</span>
              <span className="pot-item-desc">{p.description} · {p.boilTemp}°C</span>
            </div>
            {timerStore.currentPotId === p.id && <span className="pot-check">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

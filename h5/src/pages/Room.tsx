import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RoomTimer } from '../types';
import { formatCountdown } from '../utils/helpers';
import { getAllFoods, getCategories, getPotById, adjustTimeByPot, getAllPots } from '../utils/builtinData';
import AlertModal from '../components/AlertModal';
import './Room.css';

const AVATARS = ['🍲', '🔥', '🥩', '🦐', '🥬', '🍄', '🫕', '🤤'];

export default function Room() {
  const { roomStore, tick } = useApp();
  const [nickname, setNickname] = useState(() => localStorage.getItem('room_nickname') || '');
  const [avatar, setAvatar] = useState(() => localStorage.getItem('room_avatar') || '🍲');
  const [joinCode, setJoinCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showPotModal, setShowPotModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [alertTimer, setAlertTimer] = useState<RoomTimer | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [wsUrl, setWsUrl] = useState(() => roomStore.getWsUrl());

  useEffect(() => {
    const unsub = roomStore.onTimerEnd((timer) => setAlertTimer(timer as any));
    return unsub;
  }, [roomStore]);

  const isInRoom = roomStore.isInRoom;
  const room = roomStore.currentRoom;
  const pot = room?.potId ? getPotById(room.potId) : null;

  // 计时列表视图
  const timersView = roomStore.roomTimers.map(t => {
    const remaining = roomStore.getRemaining(t);
    const total = t.duration;
    const elapsed = total - remaining;
    const progress = Math.min(100, Math.round((elapsed / total) * 100));
    const isOwn = t.ownerId === roomStore.you?.id;
    const isOver = remaining <= 0 && t.status === 'running';
    const urgencyClass =
      isOver ? 'status-over' :
      t.status !== 'running' ? '' :
      remaining > total * 0.4 ? 'urgency-safe' : 'urgency-warn';
    return {
      ...t, remaining, remainingText: formatCountdown(remaining),
      progressPercent: progress, isOwn, isOver, urgencyClass,
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

  async function handleCreate() {
    if (!nickname.trim()) { alert('请输入昵称'); return; }
    setConnecting(true);
    localStorage.setItem('room_nickname', nickname);
    localStorage.setItem('room_avatar', avatar);
    try {
      await roomStore.createRoom(nickname.trim(), avatar);
    } catch (e: any) {
      alert(e.message || '创建失败');
    } finally { setConnecting(false); }
  }

  async function handleJoin() {
    if (!nickname.trim()) { alert('请输入昵称'); return; }
    if (joinCode.length < 4) { alert('请输入4位房间码'); return; }
    setConnecting(true);
    localStorage.setItem('room_nickname', nickname);
    localStorage.setItem('room_avatar', avatar);
    try {
      await roomStore.joinRoom(joinCode.trim(), nickname.trim(), avatar);
    } catch (e: any) {
      alert(e.message || '加入失败');
    } finally { setConnecting(false); }
  }

  function handleLeave() {
    if (window.confirm('确认离开当前房间？')) {
      roomStore.leaveRoom();
    }
  }

  function handleAddFood(foodId: string) {
    const food = getAllFoods().find(f => f.id === foodId);
    if (!food) return;
    const potId = roomStore.currentRoom?.potId || null;
    const duration = adjustTimeByPot(food.cookTime.recommended, potId);
    roomStore.addTimer(food.id, food.name, food.emoji, duration);
  }

  // 大厅视图
  if (!isInRoom) {
    return (
      <div className="room-page">
        {/* Hero */}
        <div className="lobby-hero">
          <span className="hero-icon">🍜</span>
          <span className="hero-title">多人同桌同步</span>
          <span className="hero-subtitle">同桌朋友都能看到同一锅的{'\n'}所有食材计时，一起吃最完美！</span>
        </div>

        {/* 我的信息 */}
        <div className="section-card info-card">
          <div className="section-card-head">
            <div className="card-icon-wrap card-icon-me">👤</div>
            <div>
              <span className="section-card-title">我的信息</span>
              <span className="section-card-desc">选个头像，设置昵称</span>
            </div>
          </div>
          <div className="avatar-row">
            {AVATARS.map(em => (
              <button key={em} className={`avatar-item ${avatar === em ? 'avatar-active' : ''}`} onClick={() => setAvatar(em)}>{em}</button>
            ))}
          </div>
          <input
            className="room-input"
            placeholder="输入昵称（最多8字）"
            maxLength={8}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
        </div>

        {/* 创建房间 */}
        <div className="section-card create-card">
          <div className="section-card-head">
            <div className="card-icon-wrap card-icon-create">🔥</div>
            <div>
              <span className="section-card-title">开一个新锅</span>
              <span className="section-card-desc">创建房间，邀请同桌加入</span>
            </div>
          </div>
          <button className="btn-create" disabled={connecting} onClick={handleCreate}>
            {connecting ? '连接中...' : '🔥 创建房间'}
          </button>
        </div>

        {/* 加入房间 */}
        <div className="section-card join-card">
          <div className="section-card-head">
            <div className="card-icon-wrap card-icon-join">🚀</div>
            <div>
              <span className="section-card-title">加入已有的锅</span>
              <span className="section-card-desc">输入4位房间码加入</span>
            </div>
          </div>
          <div className="join-input-row">
            <input
              className="room-input input-code"
              placeholder="输入4位房间码"
              maxLength={4}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
            />
            <button className="btn-join" disabled={connecting} onClick={handleJoin}>
              {connecting ? '...' : '加入'}
            </button>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="section-card feature-card">
          <span className="feature-title">✨ 同步功能介绍</span>
          {[
            ['01', '实时同步：', '任何人添加食材、计时结束，同桌所有设备同步更新'],
            ['02', '共享看板：', '统一视图，谁下的什么料一目了然，不会搞混'],
            ['03', '所有人提醒：', '时间到时桌上所有设备同时响，抢着捞才好玩'],
            ['04', '无需登录：', '临时房间，吃完自动解散，保护隐私'],
          ].map(([num, label, text]) => (
            <div key={num} className="feature-item">
              <span className="feature-num">{num}</span>
              <span className="feature-text"><strong>{label}</strong>{text}</span>
            </div>
          ))}
        </div>

        {/* 服务器设置 */}
        <div className="settings-toggle" onClick={() => setShowSettings(!showSettings)}>
          <span>⚙️ 服务器设置</span>
          <span>{showSettings ? '▲' : '▼'}</span>
        </div>
        {showSettings && (
          <div className="section-card settings-card">
            <span className="section-card-title">WebSocket 服务器地址</span>
            <input
              className="room-input"
              placeholder="wss://your-server/ws"
              value={wsUrl}
              onChange={e => setWsUrl(e.target.value)}
            />
            <button className="btn-ghost-sm" onClick={() => { roomStore.setWsUrl(wsUrl); setShowSettings(false); }}>保存</button>
          </div>
        )}
      </div>
    );
  }

  // 房间视图
  return (
    <div className="room-wrap">
      {/* 顶部 */}
      <div className="room-header">
        <div className="room-code-block">
          <span className="room-label">房间码</span>
          <span className="room-code" onClick={() => { navigator.clipboard?.writeText(room!.code); }}>
            {room?.code} 📋
          </span>
        </div>
        <div className="room-pot-block">
          <span className="room-pot-emoji">{pot?.emoji || '🍲'}</span>
          <span className="room-pot-name">{pot?.name || '未选择'}</span>
          {roomStore.isHost && (
            <span className="pot-change" onClick={() => setShowPotModal(true)}>换</span>
          )}
        </div>
        <div className={`ws-dot ${roomStore.wsState}`}></div>
      </div>

      {/* 成员 */}
      <div className="members-row">
        {roomStore.members.map(m => (
          <div key={m.id} className={`member-item ${m.online ? '' : 'member-offline'}`}>
            <span className="member-avatar">{m.avatar}</span>
            <span className="member-name">{m.nickname}{m.isHost ? '👑' : ''}</span>
            <div className={`member-dot ${m.online ? 'online' : 'offline'}`}></div>
          </div>
        ))}
      </div>

      {/* 计时区 */}
      <div className="timer-section">
        <div className="timer-section-header">
          <span className="section-title">🍢 进行中 ({timersView.filter(t => t.status === 'running').length})</span>
          <button className="btn-add-food-room" onClick={() => setShowFoodModal(true)}>+ 加食材</button>
        </div>

        {timersView.length === 0 ? (
          <div className="empty-tip">还没有食材在涮，点击「加食材」开始</div>
        ) : (
          timersView.map(item => (
            <div key={item.id} className={`room-timer-card ${item.statusClass} ${item.urgencyClass} ${item.isOwn ? 'timer-own' : ''}`}>
              <div className="room-timer-progress" style={{ width: `${item.progressPercent}%` }}></div>
              <div className="room-timer-body">
                <div className="room-timer-left">
                  <span className="room-timer-emoji">{item.foodEmoji}</span>
                  <div className="room-timer-info">
                    <span className="room-timer-name">{item.foodName}</span>
                    <span className="room-timer-owner">{item.ownerAvatar} {item.ownerNickname}</span>
                  </div>
                </div>
                <div className="room-timer-right">
                  <span className={`room-timer-time ${item.isOver ? 'time-over' : ''}`}>{item.remainingText}</span>
                  <div className={`room-status-tag ${item.urgencyClass} ${item.statusClass}`}>{item.statusText}</div>
                </div>
              </div>
              {item.status === 'running' && (roomStore.isHost || item.isOwn) && (
                <div className="room-timer-actions">
                  <button className="action-btn action-done" onClick={() => roomStore.updateTimer(item.id, 'done')}>✓ 捞起</button>
                  <button className="action-btn action-cancel" onClick={() => { if (window.confirm('确认取消？')) roomStore.updateTimer(item.id, 'cancelled'); }}>✕ 取消</button>
                </div>
              )}
              {item.status !== 'running' && (roomStore.isHost || item.isOwn) && (
                <div className="room-timer-actions">
                  <button className="action-btn action-remove" onClick={() => roomStore.removeTimer(item.id)}>🗑 移除</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="leave-row">
        <button className="btn-leave" onClick={handleLeave}>离开房间</button>
      </div>

      {/* 食材弹窗 */}
      {showFoodModal && (
        <div className="modal-mask-dark" onClick={() => setShowFoodModal(false)}>
          <div className="food-modal-box" onClick={e => e.stopPropagation()}>
            <div className="food-modal-header">
              <span className="food-modal-title">选择食材</span>
              <span className="food-modal-close" onClick={() => setShowFoodModal(false)}>✕</span>
            </div>
            <div className="food-modal-cats">
              {['全部', ...getCategories()].map(cat => (
                <button key={cat} className={`food-cat-tag ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
              ))}
            </div>
            <div className="food-modal-list">
              {getAllFoods().filter(f => selectedCategory === '全部' || f.category === selectedCategory).map(food => (
                <div key={food.id} className="food-modal-item" onClick={() => { handleAddFood(food.id); }}>
                  <span className="food-modal-emoji">{food.emoji}</span>
                  <div className="food-modal-detail">
                    <span className="food-modal-name">{food.name}</span>
                    <span className="food-modal-time">⏱ {food.cookTime.recommended}秒</span>
                  </div>
                  <span className="food-modal-add">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 锅底弹窗（房主） */}
      {showPotModal && (
        <div className="modal-mask-dark" onClick={() => setShowPotModal(false)}>
          <div className="pot-modal-box" onClick={e => e.stopPropagation()}>
            <div className="food-modal-header">
              <span className="food-modal-title">选择锅底</span>
              <span className="food-modal-close" onClick={() => setShowPotModal(false)}>✕</span>
            </div>
            <div className="pot-modal-list">
              {getAllPots().map(p => (
                <div key={p.id} className={`pot-modal-item ${room?.potId === p.id ? 'active' : ''}`} onClick={() => { roomStore.setPot(p.id); setShowPotModal(false); }}>
                  <span className="pot-modal-emoji">{p.emoji}</span>
                  <div className="pot-modal-info">
                    <span className="pot-modal-name">{p.name}</span>
                    <span className="pot-modal-desc">{p.description}</span>
                  </div>
                  {room?.potId === p.id && <span style={{ color: '#2ecc71', fontSize: 20 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 到时提醒 */}
      {alertTimer && (
        <AlertModal
          emoji={alertTimer.foodEmoji}
          title={`${alertTimer.foodName} 好了！`}
          subtitle={`${alertTimer.ownerAvatar} ${alertTimer.ownerNickname} 的 — 快捞出来吧！`}
          onClose={() => setAlertTimer(null)}
          onConfirm={() => { roomStore.updateTimer(alertTimer.id, 'done'); setAlertTimer(null); }}
        />
      )}
    </div>
  );
}

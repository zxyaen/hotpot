import React, { useState, useEffect } from 'react';
import { Popup } from 'react-vant';
import { useApp } from '../context/AppContext';
import { RoomTimer } from '../types';
import { formatCountdown } from '../utils/helpers';
import { getAllFoods, getCategories, getPotById, adjustTimeByPot, getAllPots } from '../utils/builtinData';
import { confirm, toast, toastSuccess, toastLoading, closeToast } from '../utils/toast';
import AlertModal from '../components/AlertModal';
import './Room.css';

const AVATARS = ['🍲', '🔥', '🥩', '🦐', '🥬', '🍄', '🫕', '🤤'];

export default function Room() {
  const { roomStore } = useApp();
  const [, forceUpdate] = useState(0);
  const [nickname, setNickname] = useState(() => localStorage.getItem('room_nickname') || '');
  // 头像同时存本地，初始取存储值
  const [avatar, setAvatar] = useState(() => localStorage.getItem('room_avatar') || '🍲');
  const [joinCode, setJoinCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showPotModal, setShowPotModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [alertTimer, setAlertTimer] = useState<RoomTimer | null>(null);

  useEffect(() => {
    const unsub1 = roomStore.subscribe(() => forceUpdate(n => n + 1));
    const unsub2 = roomStore.onTimerEnd((timer) => setAlertTimer(timer as any));
    return () => { unsub1(); unsub2(); };
  }, [roomStore]);

  const isInRoom = roomStore.isInRoom;
  const room = roomStore.currentRoom;
  const pot = room?.potId ? getPotById(room.potId) : null;

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
        remaining > total * 0.4 ? '慢慢来' : '快好了',
      statusClass:
        t.status === 'done' ? 'status-done' :
        t.status === 'cancelled' ? 'status-cancelled' :
        isOver ? 'status-over' : 'status-running',
    };
  });

  // 选择头像时同步保存
  function handleSelectAvatar(em: string) {
    setAvatar(em);
    localStorage.setItem('room_avatar', em);
  }

  async function handleCreate() {
    if (!nickname.trim()) { toast('请输入昵称'); return; }
    setConnecting(true);
    toastLoading('创建中...');
    localStorage.setItem('room_nickname', nickname);
    localStorage.setItem('room_avatar', avatar);
    try {
      await roomStore.createRoom(nickname.trim(), avatar);
      closeToast();
    } catch (e: any) {
      closeToast();
      toast(e.message || '创建失败，请检查网络');
    } finally {
      setConnecting(false);
    }
  }

  async function handleJoin() {
    if (!nickname.trim()) { toast('请输入昵称'); return; }
    if (joinCode.length < 4) { toast('请输入完整的4位房间码'); return; }
    setConnecting(true);
    toastLoading('加入中...');
    localStorage.setItem('room_nickname', nickname);
    localStorage.setItem('room_avatar', avatar);
    try {
      await roomStore.joinRoom(joinCode.trim(), nickname.trim(), avatar);
      closeToast();
    } catch (e: any) {
      closeToast();
      toast(e.message || '加入失败，请检查房间码');
    } finally {
      setConnecting(false);
    }
  }

  async function handleLeave() {
    const ok = await confirm('离开房间', '确认离开当前房间？');
    if (ok) roomStore.leaveRoom();
  }

  function handleAddFood(foodId: string) {
    const food = getAllFoods().find(f => f.id === foodId);
    if (!food) return;
    const potId = roomStore.currentRoom?.potId || null;
    const duration = adjustTimeByPot(food.cookTime.recommended, potId);
    roomStore.addTimer(food.id, food.name, food.emoji, duration);
    toast(`${food.emoji} 已开始计时`);
  }

  async function handleCancelTimer(id: string) {
    const ok = await confirm('取消计时', '确认取消这个计时？');
    if (ok) roomStore.updateTimer(id, 'cancelled');
  }

  function handleCopyCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(room!.code);
    }
    toastSuccess('房间码已复制');
  }

  // ═══ 大厅视图 ═══
  if (!isInRoom) {
    return (
      <div className="room-lobby">
        {/* 我的信息 */}
        <div className="lobby-card">
          <div className="lobby-card-head">
            {/* 选中的头像大图展示 */}
            <div className="lobby-avatar-preview">{avatar}</div>
            <div>
              <div className="lobby-card-title">我的信息</div>
              <div className="lobby-card-desc">选个头像，设置昵称</div>
            </div>
          </div>
          <div className="avatar-row">
            {AVATARS.map(em => (
              <button
                key={em}
                className={`avatar-btn ${avatar === em ? 'active' : ''}`}
                onClick={() => handleSelectAvatar(em)}
              >{em}</button>
            ))}
          </div>
          <input
            className="lobby-input"
            placeholder="输入昵称（最多8字）"
            maxLength={8}
            value={nickname}
            onChange={e => setNickname(e.target.value)}
          />
        </div>

        {/* 创建房间 */}
        <div className="lobby-card create-card">
          <div className="lobby-card-head">
            <div className="lobby-card-icon">🔥</div>
            <div>
              <div className="lobby-card-title">开一个新锅</div>
              <div className="lobby-card-desc">创建房间，邀请同桌加入</div>
            </div>
          </div>
          <button className="btn-create" disabled={connecting} onClick={handleCreate}>
            {connecting ? '连接中...' : '🔥 创建房间'}
          </button>
        </div>

        {/* 加入房间 */}
        <div className="lobby-card">
          <div className="lobby-card-head">
            <div className="lobby-card-icon">🚀</div>
            <div>
              <div className="lobby-card-title">加入已有的锅</div>
              <div className="lobby-card-desc">输入4位房间码加入</div>
            </div>
          </div>
          <div className="join-row">
            <input
              className="lobby-input code-input"
              placeholder="_ _ _ _"
              maxLength={4}
              value={joinCode}
              inputMode="numeric"
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
            />
            <button className="btn-join" disabled={connecting} onClick={handleJoin}>
              {connecting ? '...' : '加入'}
            </button>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="lobby-card feature-card">
          <div className="feature-title">✨ 同步功能介绍</div>
          {[
            ['01', '实时同步', '任何人添加食材、计时结束，同桌所有手机同步更新'],
            ['02', '共享看板', '统一视图，谁下的什么料一目了然，不会搞混'],
            ['03', '所有人提醒', '时间到时桌上所有手机同时响，抢着捞才好玩'],
            ['04', '无需登录', '临时房间，吃完自动解散，保护隐私'],
          ].map(([num, label, text]) => (
            <div key={num} className="feature-item">
              <span className="feature-num">{num}</span>
              <span className="feature-text"><strong>{label}：</strong>{text}</span>
            </div>
          ))}
        </div>

        {/* 服务器设置已隐藏，不对用户开放 */}
      </div>
    );
  }

  // ═══ 房间视图 ═══
  return (
    <div className="room-view">
      {/* 房间状态头 */}
      <div className="room-header">
        <div className="room-code-block" onClick={handleCopyCode}>
          <span className="room-label">房间码</span>
          <span className="room-code">{room?.code} 📋</span>
        </div>
        <div className="room-pot-block">
          <span className="rph-pot-emoji">{pot?.emoji || '🍲'}</span>
          <span className="rph-pot-name">{pot?.name || '未选锅底'}</span>
          {roomStore.isHost && (
            <span className="pot-change-btn" onClick={() => setShowPotModal(true)}>换</span>
          )}
        </div>
        <div className={`ws-dot ${roomStore.wsState}`} title={roomStore.wsState} />
      </div>

      {/* 成员栏 */}
      <div className="members-row">
        {roomStore.members.map(m => (
          <div key={m.id} className={`member-item ${m.online ? '' : 'offline'}`}>
            <span className="member-avatar">{m.avatar}</span>
            <span className="member-name">{m.isHost ? '👑' : ''}{m.nickname}</span>
            <div className={`member-dot ${m.online ? 'online' : 'offline'}`} />
          </div>
        ))}
      </div>

      {/* 计时器列表 */}
      <div className="room-timer-section">
        <div className="rts-header">
          <span className="rts-title">🍢 进行中 ({timersView.filter(t => t.status === 'running').length})</span>
          <button className="btn-add-room" onClick={() => setShowFoodModal(true)}>+ 加食材</button>
        </div>

        {timersView.length === 0 ? (
          <div className="room-empty">还没有食材在涮，点击「加食材」开始</div>
        ) : (
          timersView.map(item => (
            <div
              key={item.id}
              className={[
                'room-timer-card', item.statusClass, item.urgencyClass,
                item.isOwn ? 'timer-own' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="rtc-bg-progress" style={{ width: `${item.progressPercent}%` }} />
              <div className="rtc-body">
                <div className="rtc-left">
                  <span className="rtc-emoji">{item.foodEmoji}</span>
                  <div className="rtc-info">
                    <span className="rtc-name">{item.foodName}</span>
                    <span className="rtc-owner">{item.ownerAvatar} {item.ownerNickname}</span>
                  </div>
                </div>
                <div className="rtc-right">
                  <span className={`rtc-time ${item.isOver ? 'time-over' : ''}`}>{item.remainingText}</span>
                  <span className={`rtc-status ${item.urgencyClass} ${item.statusClass}`}>{item.statusText}</span>
                </div>
              </div>
              {item.status === 'running' && (roomStore.isHost || item.isOwn) && (
                <div className="rtc-actions">
                  <button className="rtc-btn done" onClick={() => roomStore.updateTimer(item.id, 'done')}>✓ 捞起</button>
                  <button className="rtc-btn cancel" onClick={() => handleCancelTimer(item.id)}>✕ 取消</button>
                </div>
              )}
              {item.status !== 'running' && (roomStore.isHost || item.isOwn) && (
                <div className="rtc-actions">
                  <button className="rtc-btn remove" onClick={() => roomStore.removeTimer(item.id)}>🗑 移除</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="leave-row">
        <button className="btn-leave" onClick={handleLeave}>离开房间</button>
      </div>

      {/* 食材选择 Popup */}
      <Popup
        position="bottom"
        visible={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        round
        style={{ height: '50vh', display: 'flex', flexDirection: 'column', background: '#1f0800' }}
      >
        <div className="dark-food-picker">
          <div className="dfp-header">
            <span className="dfp-title">选择食材</span>
            <span className="dfp-close" onClick={() => setShowFoodModal(false)}>✕</span>
          </div>
          <div className="dfp-cats">
            <div className="dfp-cat-row">
              {['全部', ...getCategories()].map(cat => (
                <button
                  key={cat}
                  className={`dfp-cat-tag ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >{cat}</button>
              ))}
            </div>
          </div>
          <div className="dfp-list">
            {getAllFoods()
              .filter(f => selectedCategory === '全部' || f.category === selectedCategory)
              .map(food => (
                <div key={food.id} className="dfp-item" onClick={() => handleAddFood(food.id)}>
                  <span className="dfp-emoji">{food.emoji}</span>
                  <div className="dfp-detail">
                    <span className="dfp-name">{food.name}</span>
                    <span className="dfp-time">⏱ {food.cookTime.recommended}秒</span>
                  </div>
                  <span className="dfp-add">+</span>
                </div>
              ))}
          </div>
        </div>
      </Popup>

      {/* 锅底选择 Popup（仅房主） */}
      <Popup
        position="bottom"
        visible={showPotModal}
        onClose={() => setShowPotModal(false)}
        round
        style={{ height: '50vh', display: 'flex', flexDirection: 'column', background: '#1f0800' }}
      >
        <div className="dark-food-picker">
          <div className="dfp-header">
            <span className="dfp-title">选择锅底</span>
            <span className="dfp-close" onClick={() => setShowPotModal(false)}>✕</span>
          </div>
          <div className="dfp-list">
            {getAllPots().map(p => (
              <div
                key={p.id}
                className={`dfp-item ${room?.potId === p.id ? 'dfp-active' : ''}`}
                onClick={() => { roomStore.setPot(p.id); setShowPotModal(false); }}
              >
                <span className="dfp-emoji">{p.emoji}</span>
                <div className="dfp-detail">
                  <span className="dfp-name">{p.name}</span>
                  <span className="dfp-time">{p.description}</span>
                </div>
                {room?.potId === p.id && <span style={{ color: '#2ecc71', fontSize: 18 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      </Popup>

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

/**
 * AppContext - 全局状态管理
 * 将 TimerStore 和 RoomStore 注入 React Context
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { TimerStore } from '../stores/TimerStore';
import { RoomStore } from '../stores/RoomStore';
import { Tab } from '../types';

interface AppContextValue {
  timerStore: TimerStore;
  roomStore: RoomStore;
  tick: number;           // 每秒自增，触发组件重渲
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// 全局单例
const timerStoreInstance = new TimerStore();
const roomStoreInstance = new RoomStore();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const timerStore = timerStoreInstance;
  const roomStore = roomStoreInstance;

  useEffect(() => {
    // 订阅两个 store 的变更，触发全局重渲
    const unsub1 = timerStore.subscribe(() => setTick(t => t + 1));
    const unsub2 = roomStore.subscribe(() => setTick(t => t + 1));
    return () => { unsub1(); unsub2(); };
  }, [timerStore, roomStore]);

  return (
    <AppContext.Provider value={{ timerStore, roomStore, tick, currentTab, setCurrentTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

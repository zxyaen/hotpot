/**
 * AppContext - 全局状态管理
 * 将 TimerStore、RoomStore、CustomDataStore 注入 React Context
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { TimerStore } from '../stores/TimerStore';
import { RoomStore } from '../stores/RoomStore';
import { CustomDataStore } from '../stores/CustomDataStore';
import { setCustomStore } from '../utils/builtinData';
import { Tab } from '../types';

type TimePref = 'min' | 'recommended' | 'max';

interface AppContextValue {
  timerStore: TimerStore;
  roomStore: RoomStore;
  customDataStore: CustomDataStore;
  tick: number;
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  timePref: TimePref;
  setTimePref: (pref: TimePref) => void;
  subPage: SubPage | null;
  openSubPage: (page: SubPage) => void;
  closeSubPage: () => void;
}

export type SubPage =
  | { type: 'custom-food'; editId?: string }
  | { type: 'custom-pot'; editId?: string };

const AppContext = createContext<AppContextValue | null>(null);

// 全局单例
const timerStoreInstance = new TimerStore();
const roomStoreInstance = new RoomStore();
const customDataStoreInstance = new CustomDataStore();
// 注册自定义数据到 builtinData，让 getAllFoods/getAllPots 能获取到自定义条目
setCustomStore(customDataStoreInstance);
// 清除旧版本遗留的自定义wsUrl，避免连接到错误地址
try { localStorage.removeItem('hotpot_ws_url'); } catch {}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [subPage, setSubPage] = useState<SubPage | null>(null);
  const [timePref, setTimePrefState] = useState<TimePref>(() => {
    try {
      return (localStorage.getItem('hotpot_time_pref') as TimePref) || 'recommended';
    } catch { return 'recommended'; }
  });
  const timerStore = timerStoreInstance;
  const roomStore = roomStoreInstance;
  const customDataStore = customDataStoreInstance;

  function setTimePref(pref: TimePref) {
    setTimePrefState(pref);
    try { localStorage.setItem('hotpot_time_pref', pref); } catch {}
  }

  useEffect(() => {
    const unsub1 = timerStore.subscribe(() => setTick(t => t + 1));
    const unsub2 = roomStore.subscribe(() => setTick(t => t + 1));
    const unsub3 = customDataStore.subscribe(() => setTick(t => t + 1));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [timerStore, roomStore, customDataStore]);

  function openSubPage(page: SubPage) { setSubPage(page); }
  function closeSubPage() { setSubPage(null); }

  return (
    <AppContext.Provider value={{
      timerStore, roomStore, customDataStore,
      tick, currentTab, setCurrentTab,
      timePref, setTimePref,
      subPage, openSubPage, closeSubPage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

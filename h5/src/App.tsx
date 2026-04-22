import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Foods from './pages/Foods';
import Room from './pages/Room';
import History from './pages/History';
import Settings from './pages/Settings';
// react-vant 样式
import 'react-vant/lib/index.css';
import './App.css';

const PAGE_TITLES: Record<string, string> = {
  home: '🔥 熟了吗？',
  foods: '🥩 食材库',
  room: '🍜 同桌火锅',
  history: '📋 历史记录',
  settings: '⚙️ 设置',
};

function AppInner() {
  const { currentTab, setCurrentTab, timerStore } = useApp();

  return (
    <div className="app-root">
      {/* 固定顶部 Header */}
      <header className="app-header">
        <span className="app-header-title">{PAGE_TITLES[currentTab]}</span>
        {currentTab === 'home' && timerStore.runningCount > 0 && (
          <span className="header-badge">{timerStore.runningCount}</span>
        )}
      </header>

      {/* 可滚动内容区 */}
      <main className="app-main">
        <div style={{ display: currentTab === 'home' ? 'block' : 'none' }}><Home /></div>
        <div style={{ display: currentTab === 'foods' ? 'block' : 'none' }}><Foods /></div>
        <div style={{ display: currentTab === 'room' ? 'block' : 'none' }}><Room /></div>
        <div style={{ display: currentTab === 'history' ? 'block' : 'none' }}><History /></div>
        <div style={{ display: currentTab === 'settings' ? 'block' : 'none' }}><Settings /></div>
      </main>

      {/* 固定底部 TabBar */}
      <TabBar current={currentTab} onChange={setCurrentTab} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;

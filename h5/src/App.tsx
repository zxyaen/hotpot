import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Foods from './pages/Foods';
import Room from './pages/Room';
import History from './pages/History';
import Settings from './pages/Settings';
import CustomFood from './pages/CustomFood';
import CustomPot from './pages/CustomPot';
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

const SUB_TITLES: Record<string, string> = {
  'custom-food': '🥩 自定义食材',
  'custom-pot':  '🍲 自定义锅底',
};

function AppInner() {
  const { currentTab, setCurrentTab, timerStore, subPage, closeSubPage } = useApp();

  // 渲染子页面（全屏覆盖，不显示 Header/TabBar）
  if (subPage) {
    return (
      <div className="app-root">
        <header className="app-header">
          <span className="app-header-title">{SUB_TITLES[subPage.type] || ''}</span>
        </header>
        <main className="app-main">
          {subPage.type === 'custom-food' && (
            <CustomFood editId={subPage.editId} onBack={closeSubPage} />
          )}
          {subPage.type === 'custom-pot' && (
            <CustomPot editId={subPage.editId} onBack={closeSubPage} />
          )}
        </main>
      </div>
    );
  }

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
        <div style={{ display: currentTab === 'home'     ? 'block' : 'none' }}><Home /></div>
        <div style={{ display: currentTab === 'foods'    ? 'block' : 'none' }}><Foods /></div>
        <div style={{ display: currentTab === 'room'     ? 'block' : 'none' }}><Room /></div>
        <div style={{ display: currentTab === 'history'  ? 'block' : 'none' }}><History /></div>
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

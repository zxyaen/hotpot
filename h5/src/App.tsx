import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TabBar from './components/TabBar';
import Home from './pages/Home';
import Foods from './pages/Foods';
import Room from './pages/Room';
import History from './pages/History';
import Settings from './pages/Settings';
import './App.css';

function AppInner() {
  const { currentTab, setCurrentTab } = useApp();

  return (
    <div className="app">
      {/* 顶部标题栏 */}
      <div className="app-header">
        <span className="app-header-title">
          {currentTab === 'home' && '🔥 熟了吗？'}
          {currentTab === 'foods' && '🥩 食材库'}
          {currentTab === 'room' && '🍜 同桌火锅'}
          {currentTab === 'history' && '📋 历史记录'}
          {currentTab === 'settings' && '⚙️ 设置'}
        </span>
      </div>

      {/* 页面内容 */}
      <div className="app-content">
        {currentTab === 'home' && <Home />}
        {currentTab === 'foods' && <Foods />}
        {currentTab === 'room' && <Room />}
        {currentTab === 'history' && <History />}
        {currentTab === 'settings' && <Settings />}
      </div>

      {/* 底部导航 */}
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

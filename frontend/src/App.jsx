import React, { useState } from 'react';
import SettingsPage from './components/SettingsPage';
import LearningCard from './components/LearningCard';
import './App.css';

function App() {
  const [settings, setSettings] = useState(null);
  const [progressInfo, setProgressInfo] = useState(null);

  const handleStart = (settings) => {
    setSettings(settings);
  };

  const handleBackToSettings = () => {
    setSettings(null);
    setProgressInfo(null);
  };

  if (!settings) {
    return (
      <div className="App">
        <SettingsPage onStart={handleStart} />
      </div>
    );
  }

  return (
    <div className="App">
      {/* 返回设置按钮 - 左上角 */}
      <button 
        className="back-to-settings-btn"
        onClick={handleBackToSettings}
        title="返回设置"
      >
        ←
      </button>
      
      {/* 进度显示 - 右下角 */}
      {progressInfo && (
        <div className="progress-display">
          {progressInfo.current} / {progressInfo.total}
        </div>
      )}
      
      <LearningCard 
        settings={settings}
        onBackToSettings={handleBackToSettings}
        onProgressChange={setProgressInfo}
      />
    </div>
  );
}

export default App;


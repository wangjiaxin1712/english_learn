import React, { useState, useEffect } from 'react';
import SettingsPage from './components/SettingsPage';
import LearningCard from './components/LearningCard';
import TempPracticeModal from './components/TempPracticeModal';
import './App.css';

function App() {
  const [settings, setSettings] = useState(null);
  const [progressInfo, setProgressInfo] = useState(null);
  const [showTempPracticeModal, setShowTempPracticeModal] = useState(false);
  const [isTempPracticeWindow, setIsTempPracticeWindow] = useState(false);
  
  // 检查URL参数，判断是否从新窗口打开临时练习
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tempPractice') === '1') {
      const id = urlParams.get('id');
      if (id) {
        const dataStr = sessionStorage.getItem(`tempPractice_${id}`);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            if (data.sentences && data.sentences.length > 0) {
              setIsTempPracticeWindow(true);
              setSettings({
                difficulties: ['custom'],
                playMode: 'sequential',
                customSentences: data.sentences
              });
              // 清除URL参数
              window.history.replaceState({}, '', window.location.pathname);
              // 清除sessionStorage（可选，也可以保留以便刷新）
              // sessionStorage.removeItem(`tempPractice_${id}`);
            }
          } catch (e) {
            console.error('解析临时练习数据失败:', e);
          }
        }
      }
    }
  }, []);

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
      {/* 按钮容器 - 左上角 */}
      <div className="top-left-buttons">
        {/* 如果不是临时练习窗口，显示返回设置按钮 */}
        {!isTempPracticeWindow && (
          <button 
            className="back-to-settings-btn"
            onClick={handleBackToSettings}
            title="返回设置"
          >
            ←
          </button>
        )}
        
        {/* 如果不是临时练习窗口，显示临时练习按钮 */}
        {!isTempPracticeWindow && (
          <button 
            className="temp-practice-btn"
            onClick={() => setShowTempPracticeModal(true)}
            title="临时练习"
          >
            临时练习
          </button>
        )}
        
        {/* 如果是临时练习窗口，显示关闭按钮 */}
        {isTempPracticeWindow && (
          <button 
            className="back-to-settings-btn"
            onClick={() => window.close()}
            title="关闭窗口"
          >
            ×
          </button>
        )}
      </div>
      
      {/* 进度显示 - 右下角 */}
      {progressInfo && (
        <div className="progress-display">
          {progressInfo.current} / {progressInfo.total}
        </div>
      )}
      
      {/* 临时练习弹窗 */}
      {showTempPracticeModal && (
        <TempPracticeModal
          onClose={() => setShowTempPracticeModal(false)}
          onStart={() => setShowTempPracticeModal(false)}
        />
      )}
      
      <LearningCard 
        settings={settings}
        onBackToSettings={isTempPracticeWindow ? () => window.close() : handleBackToSettings}
        onProgressChange={setProgressInfo}
      />
    </div>
  );
}

export default App;


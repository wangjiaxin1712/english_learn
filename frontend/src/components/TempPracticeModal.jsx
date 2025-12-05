import React, { useState } from 'react';
import './TempPracticeModal.css';

const TempPracticeModal = ({ onClose, onStart }) => {
  const [chinese, setChinese] = useState('');
  const [english, setEnglish] = useState('');

  const handleSubmit = () => {
    if (!chinese.trim() || !english.trim()) {
      alert('请输入中文和英文');
      return;
    }

    // 创建句子数据
    const sentence = {
      id: 1,
      chinese: chinese.trim(),
      english: english.trim(),
      difficulty: 'custom'
    };

    // 将数据存储到sessionStorage，使用唯一标识
    const timestamp = Date.now();
    const data = {
      sentences: [sentence],
      timestamp: timestamp
    };
    sessionStorage.setItem(`tempPractice_${timestamp}`, JSON.stringify(data));
    
    // 使用新窗口打开练习页面，通过URL参数传递标识
    const currentUrl = window.location.origin + window.location.pathname;
    const newWindow = window.open(
      `${currentUrl}?tempPractice=1&id=${timestamp}`,
      '_blank',
      'width=1200,height=800'
    );
    
    if (newWindow) {
      newWindow.focus();
    }

    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">临时练习</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label>中文：</label>
            <input
              type="text"
              className="modal-input"
              value={chinese}
              onChange={(e) => setChinese(e.target.value)}
              placeholder="输入中文句子..."
              autoFocus
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div className="input-group">
            <label>英文：</label>
            <input
              type="text"
              className="modal-input"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="输入英文翻译..."
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>
            取消
          </button>
          <button className="modal-submit-btn" onClick={handleSubmit}>
            开始练习
          </button>
        </div>
        
        <div className="modal-hint">
          提示：按 Ctrl+Enter 快速提交
        </div>
      </div>
    </div>
  );
};

export default TempPracticeModal;


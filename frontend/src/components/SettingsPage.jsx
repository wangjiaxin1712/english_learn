import React, { useState } from 'react';
import { uploadExcel } from '../services/api';
import './SettingsPage.css';

const SettingsPage = ({ onStart }) => {
  const [difficulties, setDifficulties] = useState({
    cet4: false,
    cet6: false,
    ielts: false,
    custom: false
  });
  const [playMode, setPlayMode] = useState('random'); // 'random' or 'sequential'
  const [customFile, setCustomFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customSentences, setCustomSentences] = useState(null);

  const handleDifficultyChange = (difficulty) => {
    // 如果是选择自定义，取消其他选项
    if (difficulty === 'custom') {
      setDifficulties({
        cet4: false,
        cet6: false,
        ielts: false,
        custom: !difficulties.custom
      });
      if (!difficulties.custom) {
        setCustomFile(null);
        setCustomSentences(null);
      }
    } else {
      // 如果选择其他选项，取消自定义
      setDifficulties(prev => ({
        ...prev,
        [difficulty]: !prev[difficulty],
        custom: false
      }));
      setCustomFile(null);
      setCustomSentences(null);
    }
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(difficulties).every(v => v);
    setDifficulties({
      cet4: !allSelected,
      cet6: !allSelected,
      ielts: !allSelected,
      custom: false
    });
    setCustomFile(null);
    setCustomSentences(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传Excel文件（.xlsx或.xls格式）');
      return;
    }
    
    setCustomFile(file);
    setUploading(true);
    
    try {
      const result = await uploadExcel(file);
      setCustomSentences(result.sentences);
      alert(`成功解析 ${result.total} 条句子！`);
    } catch (error) {
      alert(`解析文件失败: ${error.message}`);
      setCustomFile(null);
      setCustomSentences(null);
    } finally {
      setUploading(false);
    }
  };

  const handleStart = () => {
    // 如果选择了自定义
    if (difficulties.custom) {
      if (!customSentences || customSentences.length === 0) {
        alert('请先上传Excel文件');
        return;
      }
      
      onStart({
        difficulties: ['custom'],
        playMode: playMode,
        customSentences: customSentences
      });
      return;
    }
    
    // 原有的逻辑
    const selectedDifficulties = Object.entries(difficulties)
      .filter(([key, selected]) => selected && key !== 'custom')
      .map(([key, _]) => key);
    
    if (selectedDifficulties.length === 0) {
      alert('请至少选择一个难度级别或上传自定义文件');
      return;
    }

    onStart({
      difficulties: selectedDifficulties,
      playMode: playMode
    });
  };

  const standardDifficulties = ['cet4', 'cet6', 'ielts'];
  const allSelected = standardDifficulties.every(key => difficulties[key]);
  const someSelected = standardDifficulties.some(key => difficulties[key]) || 
                       (difficulties.custom && customSentences);

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h1 className="settings-title">英语学习设置</h1>
        
        <div className="settings-section">
          <h2 className="section-title">选择难度级别</h2>
          <div className="difficulty-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="checkbox-input"
              />
              <span className="checkbox-text">全选</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={difficulties.cet4}
                onChange={() => handleDifficultyChange('cet4')}
                className="checkbox-input"
              />
              <span className="checkbox-text">CET-4 (四级)</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={difficulties.cet6}
                onChange={() => handleDifficultyChange('cet6')}
                className="checkbox-input"
              />
              <span className="checkbox-text">CET-6 (六级)</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={difficulties.ielts}
                onChange={() => handleDifficultyChange('ielts')}
                className="checkbox-input"
              />
              <span className="checkbox-text">IELTS (雅思)</span>
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={difficulties.custom}
                onChange={() => handleDifficultyChange('custom')}
                className="checkbox-input"
              />
              <span className="checkbox-text">用户自定义</span>
            </label>
          </div>
          
          {/* 自定义文件上传区域 */}
          {difficulties.custom && (
            <div className="custom-upload-section">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={uploading}
                />
                <span className="file-upload-button">
                  {uploading ? '解析中...' : (customFile ? customFile.name : '选择Excel文件')}
                </span>
              </label>
              {customSentences && (
                <div className="file-info">
                  已加载 {customSentences.length} 条句子
                </div>
              )}
              <div className="file-format-hint">
                格式：第一列=中文，第二列=英文
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h2 className="section-title">播放方式</h2>
          <div className="play-mode-options">
            <label className="radio-label">
              <input
                type="radio"
                name="playMode"
                value="random"
                checked={playMode === 'random'}
                onChange={(e) => setPlayMode(e.target.value)}
                className="radio-input"
              />
              <span className="radio-text">随机播放</span>
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="playMode"
                value="sequential"
                checked={playMode === 'sequential'}
                onChange={(e) => setPlayMode(e.target.value)}
                className="radio-input"
              />
              <span className="radio-text">顺序播放</span>
            </label>
          </div>
        </div>

        <button 
          className="start-button"
          onClick={handleStart}
          disabled={!someSelected || (difficulties.custom && !customSentences)}
        >
          开始学习
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;


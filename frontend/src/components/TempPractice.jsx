import React, { useState } from 'react';
import LearningCard from './LearningCard';
import './TempPractice.css';

const TempPractice = ({ onClose }) => {
  const [sentences, setSentences] = useState([]);
  const [chinese, setChinese] = useState('');
  const [english, setEnglish] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [progressInfo, setProgressInfo] = useState(null);

  const handleAddSentence = () => {
    if (!chinese.trim() || !english.trim()) {
      alert('请输入中文和英文');
      return;
    }

    const newSentence = {
      id: sentences.length + 1,
      chinese: chinese.trim(),
      english: english.trim(),
      difficulty: 'custom'
    };

    setSentences([...sentences, newSentence]);
    setChinese('');
    setEnglish('');
  };

  const handleDeleteSentence = (id) => {
    setSentences(sentences.filter(s => s.id !== id));
  };

  const handleStartPractice = () => {
    if (sentences.length === 0) {
      alert('请至少添加一条句子');
      return;
    }
    setIsPracticing(true);
  };

  const handleBackToEdit = () => {
    setIsPracticing(false);
    setProgressInfo(null);
  };

  if (isPracticing) {
    return (
      <div className="temp-practice-container">
        <LearningCard
          settings={{
            difficulties: ['custom'],
            playMode: 'sequential',
            customSentences: sentences
          }}
          onBackToSettings={handleBackToEdit}
          onProgressChange={setProgressInfo}
        />
      </div>
    );
  }

  return (
    <div className="temp-practice-page">
      <div className="temp-practice-card">
        <div className="temp-practice-header">
          <h1 className="temp-practice-title">临时练习</h1>
          <button className="close-btn" onClick={onClose} title="关闭">
            ×
          </button>
        </div>

        <div className="add-sentence-section">
          <h2 className="section-title">添加练习句子</h2>
          <div className="input-group">
            <label>中文：</label>
            <input
              type="text"
              className="sentence-input"
              value={chinese}
              onChange={(e) => setChinese(e.target.value)}
              placeholder="输入中文句子..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddSentence();
                }
              }}
            />
          </div>
          <div className="input-group">
            <label>英文：</label>
            <input
              type="text"
              className="sentence-input"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              placeholder="输入英文翻译..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddSentence();
                }
              }}
            />
          </div>
          <button className="add-btn" onClick={handleAddSentence}>
            添加句子
          </button>
        </div>

        <div className="sentences-list-section">
          <h2 className="section-title">
            已添加句子 ({sentences.length})
          </h2>
          {sentences.length === 0 ? (
            <div className="empty-list">暂无句子，请先添加</div>
          ) : (
            <div className="sentences-list">
              {sentences.map((sentence) => (
                <div key={sentence.id} className="sentence-item">
                  <div className="sentence-content">
                    <div className="sentence-chinese">{sentence.chinese}</div>
                    <div className="sentence-english">{sentence.english}</div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteSentence(sentence.id)}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {sentences.length > 0 && (
          <button className="start-practice-btn" onClick={handleStartPractice}>
            开始练习 ({sentences.length} 条)
          </button>
        )}
      </div>
    </div>
  );
};

export default TempPractice;


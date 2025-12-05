import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomSentence, getSentencesList, checkAnswer } from '../services/api';
import './LearningCard.css';

const LearningCard = ({ settings, onBackToSettings, onProgressChange }) => {
  const [sentence, setSentence] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answerChars, setAnswerChars] = useState([]); // 用户输入的字符数组
  const [charPositions, setCharPositions] = useState([]); // 字符位置信息（包括间隔）
  const [isPlaying, setIsPlaying] = useState(false); // 语音播放状态
  const [history, setHistory] = useState([]); // 历史记录（存储句子ID）
  const [historyIndex, setHistoryIndex] = useState(-1); // 当前在历史记录中的位置
  const [sentenceList, setSentenceList] = useState([]); // 顺序播放时的句子列表
  const [currentIndex, setCurrentIndex] = useState(0); // 顺序播放时的当前索引
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0); // 当前聚焦的输入位置
  const inputRef = useRef(null);
  const synthRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // 初始化语音合成
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      // 定期检查状态（Chrome有时不会触发事件）
      const checkInterval = setInterval(() => {
        if (synthRef.current) {
          setIsPlaying(synthRef.current.speaking);
        }
      }, 100);
      
      return () => {
        clearInterval(checkInterval);
      };
    }
  }, []);

  // 初始化：如果是顺序播放，先加载句子列表
  useEffect(() => {
    if (!settings) return;
    
    // 如果使用自定义数据
    if (settings.customSentences) {
      const sentences = settings.customSentences;
      setSentenceList(sentences);
      
      if (settings.playMode === 'sequential') {
        setCurrentIndex(0);
        if (sentences.length > 0) {
          loadSentence(sentences[0]);
          setHistory([sentences[0].id]);
          setHistoryIndex(0);
          if (onProgressChange) {
            onProgressChange({
              current: 1,
              total: sentences.length
            });
          }
        }
      } else {
        // 随机播放
        const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
        loadSentence(randomSentence);
        setHistory([randomSentence.id]);
        setHistoryIndex(0);
        if (onProgressChange) {
          onProgressChange(null);
        }
      }
    } else if (settings.playMode === 'sequential') {
      const loadSentenceList = async () => {
        try {
          const response = await getSentencesList(settings.difficulties);
          setSentenceList(response.sentences);
          setCurrentIndex(0);
          // 加载第一个句子
          if (response.sentences.length > 0) {
            await loadSentence(response.sentences[0]);
            setHistory([response.sentences[0].id]);
            setHistoryIndex(0);
            // 更新进度信息
            if (onProgressChange) {
              onProgressChange({
                current: 1,
                total: response.sentences.length
              });
            }
          }
        } catch (error) {
          console.error('加载句子列表失败:', error);
          alert('加载句子列表失败，请稍后重试');
        }
      };
      loadSentenceList();
    } else if (settings) {
      // 随机播放模式
      loadNewSentence();
      // 随机播放模式不显示进度
      if (onProgressChange) {
        onProgressChange(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    // 当显示新句子时，自动朗读英文（延迟一下确保页面已渲染）
    if (sentence && sentence.english) {
      // 延迟播放，确保浏览器准备好
      const timer = setTimeout(() => {
        speakText(sentence.english);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sentence]);

  const speakText = (text, retryCount = 0) => {
    if (!synthRef.current || !text) return;
    
    try {
      // 停止之前的朗读
      synthRef.current.cancel();
      
      // 等待一下确保之前的语音已停止
      setTimeout(() => {
        if (!synthRef.current) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // 稍微慢一点，便于学习
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // 错误处理
        utterance.onerror = (event) => {
          console.error('语音播放错误:', event.error);
          setIsPlaying(false);
          
          // 如果是网络错误或未准备好，重试一次
          if (retryCount < 2 && (event.error === 'network' || event.error === 'synthesis-unavailable')) {
            setTimeout(() => {
              speakText(text, retryCount + 1);
            }, 500);
          }
        };
        
        // 播放开始
        utterance.onstart = () => {
          setIsPlaying(true);
        };
        
        // 播放结束
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        // 播放暂停
        utterance.onpause = () => {
          setIsPlaying(false);
        };
        
        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
      }, 100);
    } catch (error) {
      console.error('语音播放异常:', error);
      setIsPlaying(false);
      
      // 重试一次
      if (retryCount < 1) {
        setTimeout(() => {
          speakText(text, retryCount + 1);
        }, 500);
      }
    }
  };
  
  // 手动播放按钮（用于解决Chrome自动播放限制）
  const handlePlayClick = () => {
    if (sentence && sentence.english) {
      speakText(sentence.english);
    } else if (result && result.correct_answer) {
      speakText(result.correct_answer);
    }
  };

  // 解析正确答案，生成字符位置数组（包括单词间隔）
  const parseAnswerStructure = (text) => {
    if (!text) return [];
    
    const positions = [];
    const words = text.split(/(\s+|[.,!?;:'"()-])/).filter(w => w.length > 0);
    let charIndex = 0;
    let currentWordLength = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // 如果是空格
      if (/^\s+$/.test(word)) {
        // 如果前面有单词，先添加单词间隔
        if (currentWordLength > 0) {
          const spacing = currentWordLength > 8 ? 3 : currentWordLength > 5 ? 2 : 1;
          for (let j = 0; j < spacing; j++) {
            positions.push({
              type: 'spacing',
              char: ' ',
              index: -1
            });
          }
          currentWordLength = 0;
        }
        // 添加空格本身
        positions.push({
          type: 'space',
          char: ' ',
          index: -1
        });
      }
      // 如果是标点符号（直接显示，不需要填写）
      else if (/^[.,!?;:'"()-]+$/.test(word)) {
        // 如果前面有单词，先添加单词间隔
        if (currentWordLength > 0) {
          const spacing = currentWordLength > 8 ? 3 : currentWordLength > 5 ? 2 : 1;
          for (let j = 0; j < spacing; j++) {
            positions.push({
              type: 'spacing',
              char: ' ',
              index: -1
            });
          }
          currentWordLength = 0;
        }
        // 添加标点符号的每个字符（不需要index，直接显示）
        for (const char of word) {
          positions.push({
            type: 'punctuation',
            char: char,
            index: -1  // 标点符号不需要填写
          });
        }
      }
      // 如果是单词（字母）
      else {
        // 如果前面有单词，先添加单词间隔
        if (currentWordLength > 0) {
          const spacing = currentWordLength > 8 ? 3 : currentWordLength > 5 ? 2 : 1;
          for (let j = 0; j < spacing; j++) {
            positions.push({
              type: 'spacing',
              char: ' ',
              index: -1
            });
          }
        }
        // 添加单词的每个字母
        for (const char of word) {
          positions.push({
            type: 'letter',
            char: char,
            index: charIndex++
          });
        }
        currentWordLength = word.length;
      }
    }
    
    // 处理最后一个单词的间隔
    if (currentWordLength > 0) {
      const spacing = currentWordLength > 8 ? 3 : currentWordLength > 5 ? 2 : 1;
      for (let j = 0; j < spacing; j++) {
        positions.push({
          type: 'spacing',
          char: ' ',
          index: -1
        });
      }
    }
    
    return positions;
  };

  // 加载指定句子
  const loadSentence = useCallback(async (sentenceData) => {
    try {
      setLoading(true);
      setResult(null);
      setUserAnswer('');
      setAnswerChars([]);
      setSentence(sentenceData);
      
      // 解析正确答案结构
      if (sentenceData.english) {
        const positions = parseAnswerStructure(sentenceData.english);
        setCharPositions(positions);
        // 初始化答案字符数组（包括字母和数字，不包括标点符号）
        const letterCount = positions.filter(p => p.type === 'letter').length;
        setAnswerChars(new Array(letterCount).fill(''));
        setCurrentFocusIndex(0); // 重置聚焦位置
      }
      
      // 加载完成后自动聚焦输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('加载句子失败:', error);
      alert('加载句子失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNewSentence = useCallback(async () => {
    if (!settings) return;
    
    try {
      let data;
      
      // 如果使用自定义数据
      if (settings.customSentences) {
        if (settings.playMode === 'sequential') {
          if (sentenceList.length === 0) {
            alert('没有可用的句子');
            return;
          }
          const nextIndex = (currentIndex + 1) % sentenceList.length;
          data = sentenceList[nextIndex];
          setCurrentIndex(nextIndex);
          if (onProgressChange) {
            onProgressChange({
              current: nextIndex + 1,
              total: sentenceList.length
            });
          }
        } else {
          // 随机播放
          data = settings.customSentences[Math.floor(Math.random() * settings.customSentences.length)];
        }
      } else if (settings.playMode === 'sequential') {
        // 顺序播放：取下一个句子
        if (sentenceList.length === 0) {
          alert('没有可用的句子');
          return;
        }
        const nextIndex = (currentIndex + 1) % sentenceList.length;
        data = sentenceList[nextIndex];
        setCurrentIndex(nextIndex);
        // 更新进度信息
        if (onProgressChange) {
          onProgressChange({
            current: nextIndex + 1,
            total: sentenceList.length
          });
        }
      } else {
        // 随机播放
        data = await getRandomSentence(settings.difficulties);
      }
      
      await loadSentence(data);
      
      // 更新历史记录
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1); // 移除当前位置之后的历史
        newHistory.push(data.id);
        const newIndex = newHistory.length - 1;
        setHistoryIndex(newIndex);
        return newHistory;
      });
    } catch (error) {
      console.error('加载句子失败:', error);
      alert('加载句子失败，请稍后重试');
    }
  }, [settings, loadSentence, historyIndex, sentenceList, currentIndex, onProgressChange]);

  // 加载上一题
  const loadPreviousSentence = useCallback(async () => {
    if (historyIndex > 0) {
      const previousId = history[historyIndex - 1];
      try {
        let data;
        
        // 如果是自定义数据，从sentenceList中查找
        if (settings && settings.customSentences) {
          data = sentenceList.find(s => s.id === previousId);
          if (!data) {
            alert('找不到上一题');
            return;
          }
        } else {
          // 从API获取
          const response = await fetch(`/api/sentence/${previousId}`);
          if (!response.ok) {
            throw new Error('获取句子失败');
          }
          data = await response.json();
        }
        
        await loadSentence(data);
        setHistoryIndex(prev => prev - 1);
        
        // 如果是顺序播放，更新当前索引和进度
        if (settings && settings.playMode === 'sequential' && sentenceList.length > 0) {
          const index = sentenceList.findIndex(s => s.id === data.id);
          if (index >= 0) {
            setCurrentIndex(index);
            if (onProgressChange) {
              onProgressChange({
                current: index + 1,
                total: sentenceList.length
              });
            }
          }
        }
      } catch (error) {
        console.error('加载上一题失败:', error);
        alert('加载上一题失败，请稍后重试');
      }
    }
  }, [history, historyIndex, loadSentence, settings, sentenceList, onProgressChange]);

  const handleSubmit = async () => {
    // 从字符数组构建答案字符串（按顺序，只包括字母）
    // 需要重新构建完整答案，包括标点符号
    const letterPositions = charPositions.filter(p => p.type === 'letter');
    let submittedAnswer = '';
    
    // 按照原始顺序重建答案，包括标点符号
    for (const pos of charPositions) {
      if (pos.type === 'letter') {
        const inputIndex = letterPositions.findIndex(p => p === pos);
        if (inputIndex >= 0 && answerChars[inputIndex]) {
          submittedAnswer += answerChars[inputIndex];
        }
      } else if (pos.type === 'punctuation') {
        submittedAnswer += pos.char;
      } else if (pos.type === 'space') {
        submittedAnswer += ' ';
      }
    }
    
    submittedAnswer = submittedAnswer.trim();
    
    if (!submittedAnswer) {
      alert('请输入答案');
      return;
    }

    try {
      setLoading(true);
      
      // 如果是自定义数据，直接在前端检查答案
      if (settings && settings.customSentences) {
        const correctAnswer = sentence.english.trim();
        // 答案检查：忽略大小写，规范化空格
        const normalizedUser = submittedAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
        const normalizedCorrect = correctAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
        const isCorrect = normalizedUser === normalizedCorrect;
        
        const checkResult = {
          is_correct: isCorrect,
          correct_answer: correctAnswer,
          user_answer: submittedAnswer
        };
        
        setResult(checkResult);
        
        // 显示结果后重新朗读正确答案
        if (correctAnswer) {
          setTimeout(() => {
            speakText(correctAnswer);
          }, 800);
        }
      } else {
        // 使用API检查答案
        const checkResult = await checkAnswer(sentence.id, submittedAnswer);
        setResult(checkResult);
        
        // 显示结果后重新朗读正确答案（延迟确保结果已显示）
        if (checkResult.correct_answer) {
          setTimeout(() => {
            speakText(checkResult.correct_answer);
            // 播放完成后，输入框已经禁用，不需要聚焦
          }, 800);
        }
      }
    } catch (error) {
      console.error('检查答案失败:', error);
      alert('检查答案失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理用户输入
  const handleInputChange = (e) => {
    const value = e.target.value;
    // 只保留字母和数字（不包括标点符号），转换为小写
    const filtered = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    if (filtered.length === 0) {
      // 如果输入为空，清空当前聚焦位置
      const newChars = [...answerChars];
      newChars[currentFocusIndex] = '';
      setAnswerChars(newChars);
      setUserAnswer(newChars.join(''));
      return;
    }
    
    // 获取最后一个输入的字符
    const lastChar = filtered[filtered.length - 1];
    const newChars = [...answerChars];
    
    // 在当前聚焦位置填入字符
    if (currentFocusIndex < newChars.length) {
      newChars[currentFocusIndex] = lastChar;
      
      // 自动移动到下一个空位置
      let nextIndex = currentFocusIndex + 1;
      while (nextIndex < newChars.length && newChars[nextIndex] !== '') {
        nextIndex++;
      }
      if (nextIndex < newChars.length) {
        setCurrentFocusIndex(nextIndex);
      } else {
        // 如果后面都填满了，移动到最后一个位置
        setCurrentFocusIndex(newChars.length - 1);
      }
    }
    
    setAnswerChars(newChars);
    setUserAnswer(newChars.join(''));
  };
  
  // 处理字符单元格点击
  const handleCharCellClick = (inputIndex) => {
    if (result || loading) return;
    setCurrentFocusIndex(inputIndex);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // 处理键盘方向键
  const handleKeyDown = (e) => {
    if (result || loading) return;
    
    const letterPositions = charPositions.filter(p => p.type === 'letter');
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIndex = Math.max(0, currentFocusIndex - 1);
      setCurrentFocusIndex(newIndex);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newIndex = Math.min(letterPositions.length - 1, currentFocusIndex + 1);
      setCurrentFocusIndex(newIndex);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const newChars = [...answerChars];
      if (newChars[currentFocusIndex]) {
        // 如果当前位置有字符，删除它
        newChars[currentFocusIndex] = '';
      } else if (currentFocusIndex > 0) {
        // 如果当前位置为空，删除前一个位置的字符并移动光标
        newChars[currentFocusIndex - 1] = '';
        setCurrentFocusIndex(currentFocusIndex - 1);
      }
      setAnswerChars(newChars);
      setUserAnswer(newChars.join(''));
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const newChars = [...answerChars];
      newChars[currentFocusIndex] = '';
      setAnswerChars(newChars);
      setUserAnswer(newChars.join(''));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      if (result) {
        // 如果有结果显示，按Enter键进入下一题
        handleNext();
      } else {
        // 否则提交答案
        handleSubmit();
      }
    }
  };

  // 全局键盘事件监听
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl+' 播放声音
      if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        if (result && result.correct_answer) {
          speakText(result.correct_answer);
        } else if (sentence && sentence.english) {
          speakText(sentence.english);
        }
        return;
      }
      
      // Enter键：如果有结果显示，进入下一题；否则由input的onKeyPress处理
      if (e.key === 'Enter' && !loading && result) {
        e.preventDefault();
        loadNewSentence();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [result, sentence, loading, loadNewSentence]);

  const handleNext = () => {
    loadNewSentence();
  };

  // 获取正确答案的字符数组（按顺序，只包括字母）
  const getCorrectAnswerChars = () => {
    if (!sentence || !sentence.english) return [];
    const letterPositions = charPositions.filter(p => p.type === 'letter');
    return letterPositions.map(p => p.char.toLowerCase());
  };

  if (loading && !sentence) {
    return (
      <div className="learning-card">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!sentence || !settings) {
    return null;
  }

  return (
    <div className="learning-card">
      <div className="chinese-text">
        {sentence.chinese}
      </div>
      
      <div className="input-section">
        {/* 隐藏的输入框用于接收输入 */}
        <input
          ref={inputRef}
          type="text"
          className="hidden-input"
          value={userAnswer}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyDown}
          disabled={loading || result}
          autoFocus
        />
        
        {/* 显示下划线和用户输入 */}
        <div className="answer-display" onClick={() => {
          if (!result && inputRef.current) {
            inputRef.current.focus();
          }
        }}>
          {charPositions.map((pos, idx) => {
            if (pos.type === 'spacing' || pos.type === 'space') {
              return <span key={idx} className="spacing">{pos.char}</span>;
            }
            
            // 标点符号直接显示，不需要填写
            if (pos.type === 'punctuation') {
              return (
                <span key={idx} className="punctuation-char">
                  {pos.char}
                </span>
              );
            }
            
            // 字母和数字需要填写
            // 找到这个字符在可输入字符数组中的索引（包括字母和数字）
            const letterPositions = charPositions.filter(p => p.type === 'letter');
            const inputIndex = letterPositions.findIndex(p => p === pos);
            
            const userChar = inputIndex >= 0 ? (answerChars[inputIndex] || '') : '';
            const correctChar = pos.char.toLowerCase();
            const isCorrect = result ? (userChar === correctChar) : null;
            const showChar = userChar || (result ? correctChar : '');
            const isFocused = !result && inputIndex === currentFocusIndex;
            
            return (
              <span
                key={idx}
                className={`char-cell ${
                  result 
                    ? (isCorrect ? 'correct' : 'incorrect')
                    : userChar ? 'filled' : 'empty'
                } ${isFocused ? 'focused' : ''}`}
                onClick={() => handleCharCellClick(inputIndex)}
                style={{ cursor: result ? 'default' : 'pointer' }}
              >
                {showChar || '_'}
              </span>
            );
          })}
        </div>
        
        {!result && (
          <div className="button-group">
            <button 
              className="prev-btn" 
              onClick={loadPreviousSentence}
              disabled={loading || historyIndex <= 0}
            >
              上一题
            </button>
            <button 
              className="play-text-btn" 
              onClick={handlePlayClick}
              disabled={isPlaying || !sentence?.english}
            >
              播放
            </button>
            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={loading || answerChars.every(c => !c)}
            >
              提交
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="result-section">
          <div className={`result-message ${result.is_correct ? 'correct' : 'incorrect'}`}>
            {result.is_correct ? '✓ 正确！' : '✗ 错误'}
          </div>
          {!result.is_correct && (
            <div className="correct-answer">
              正确答案：{result.correct_answer}
            </div>
          )}
          <div className="button-group">
            <button 
              className="prev-btn" 
              onClick={loadPreviousSentence}
              disabled={loading || historyIndex <= 0}
            >
              上一题
            </button>
            <button 
              className="play-text-btn" 
              onClick={() => {
                if (result?.correct_answer) {
                  speakText(result.correct_answer);
                } else if (sentence?.english) {
                  speakText(sentence.english);
                }
              }}
              disabled={isPlaying}
            >
              播放
            </button>
            <button className="next-btn" onClick={handleNext}>
              下一题
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningCard;



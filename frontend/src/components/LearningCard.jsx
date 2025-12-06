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
  const [lockedChars, setLockedChars] = useState([]); // 已锁定的正确字符位置（布尔数组）
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
        setLockedChars(new Array(letterCount).fill(false)); // 初始化锁定状态
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
      
      // 获取正确答案
      let correctAnswer = '';
      if (settings && settings.customSentences) {
        correctAnswer = sentence.english.trim();
      } else {
        // 使用API检查答案
        const checkResult = await checkAnswer(sentence.id, submittedAnswer);
        correctAnswer = checkResult.correct_answer || sentence.english.trim();
      }
      
      // 检查答案是否正确（先不锁定，只显示结果）
      // 按单词比较，检查是否全部正确
      const letterPositions = charPositions.filter(p => p.type === 'letter');
      
      // 将字符位置按单词分组
      const words = [];
      let currentWord = [];
      
      for (let i = 0; i < charPositions.length; i++) {
        const pos = charPositions[i];
        if (pos.type === 'letter') {
          const charIdx = letterPositions.findIndex(p => p === pos);
          currentWord.push({
            posIndex: i,
            charIndex: charIdx,
            correctChar: pos.char
          });
        } else if (pos.type === 'spacing' || pos.type === 'space' || pos.type === 'punctuation') {
          // 遇到分隔符，结束当前单词
          if (currentWord.length > 0) {
            words.push([...currentWord]);
            currentWord = [];
          }
        }
      }
      // 添加最后一个单词
      if (currentWord.length > 0) {
        words.push(currentWord);
      }
      
      // 检查是否所有单词都正确
      let allCorrect = true;
      for (const word of words) {
        // 检查这个单词是否已经全部锁定
        const isWordLocked = word.every(w => lockedChars[w.charIndex]);
        if (isWordLocked) {
          continue; // 已锁定的单词跳过
        }
        
        // 构建用户输入的单词和正确答案的单词
        let userWord = '';
        let correctWord = '';
        let allFilled = true;
        
        for (const w of word) {
          const userChar = answerChars[w.charIndex] || '';
          if (!userChar) {
            allFilled = false;
            allCorrect = false;
            break;
          }
          userWord += userChar.toLowerCase();
          correctWord += w.correctChar.toLowerCase();
        }
        
        // 如果单词填写完整，检查是否正确
        if (allFilled && userWord !== correctWord) {
          allCorrect = false;
        }
      }
      
      // 检查是否所有位置都已锁定（全部正确）
      const allLocked = lockedChars.every(locked => locked);
      const finalCorrect = allLocked || allCorrect;
      
      // 设置结果（只显示，不锁定）
      const checkResult = {
        is_correct: finalCorrect,
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
      // 如果输入为空，清空当前聚焦位置（但不能清空已锁定的）
      if (!lockedChars[currentFocusIndex]) {
        const newChars = [...answerChars];
        newChars[currentFocusIndex] = '';
        setAnswerChars(newChars);
        setUserAnswer(newChars.join(''));
      }
      return;
    }
    
    // 获取最后一个输入的字符
    const lastChar = filtered[filtered.length - 1];
    const newChars = [...answerChars];
    
    // 在当前聚焦位置填入字符（但不能修改已锁定的位置）
    if (currentFocusIndex < newChars.length && !lockedChars[currentFocusIndex]) {
      newChars[currentFocusIndex] = lastChar;
      
      // 自动移动到下一个未锁定且为空的位置
      let nextIndex = currentFocusIndex + 1;
      while (nextIndex < newChars.length && (lockedChars[nextIndex] || newChars[nextIndex] !== '')) {
        nextIndex++;
      }
      if (nextIndex < newChars.length) {
        setCurrentFocusIndex(nextIndex);
      } else {
        // 如果后面都填满了，找到第一个未锁定且为空的位置
        const firstEmptyIndex = newChars.findIndex((char, index) => !lockedChars[index] && !char);
        if (firstEmptyIndex >= 0) {
          setCurrentFocusIndex(firstEmptyIndex);
        } else {
          // 如果所有位置都填满了，移动到最后一个未锁定的位置
          const lastUnlockedIndex = [...lockedChars].reverse().findIndex(locked => !locked);
          if (lastUnlockedIndex >= 0) {
            setCurrentFocusIndex(newChars.length - 1 - lastUnlockedIndex);
          }
        }
      }
    }
    
    setAnswerChars(newChars);
    setUserAnswer(newChars.join(''));
  };
  
  // 处理字符单元格点击
  const handleCharCellClick = (inputIndex) => {
    if (loading) return;
    // 不能点击已锁定的位置
    if (lockedChars[inputIndex]) return;
    setCurrentFocusIndex(inputIndex);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // 处理键盘方向键
  const handleKeyDown = (e) => {
    if (loading) return;
    
    const letterPositions = charPositions.filter(p => p.type === 'letter');
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      // 向左移动，跳过已锁定的位置
      let newIndex = currentFocusIndex - 1;
      while (newIndex >= 0 && lockedChars[newIndex]) {
        newIndex--;
      }
      if (newIndex >= 0) {
        setCurrentFocusIndex(newIndex);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // 向右移动，跳过已锁定的位置
      let newIndex = currentFocusIndex + 1;
      while (newIndex < letterPositions.length && lockedChars[newIndex]) {
        newIndex++;
      }
      if (newIndex < letterPositions.length) {
        setCurrentFocusIndex(newIndex);
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      // 不能删除已锁定的字符
      if (lockedChars[currentFocusIndex]) return;
      
      const newChars = [...answerChars];
      if (newChars[currentFocusIndex]) {
        // 如果当前位置有字符，删除它
        newChars[currentFocusIndex] = '';
      } else if (currentFocusIndex > 0) {
        // 如果当前位置为空，删除前一个位置的字符并移动光标（但不能删除已锁定的）
        let prevIndex = currentFocusIndex - 1;
        while (prevIndex >= 0 && lockedChars[prevIndex]) {
          prevIndex--;
        }
        if (prevIndex >= 0) {
          newChars[prevIndex] = '';
          setCurrentFocusIndex(prevIndex);
        }
      }
      setAnswerChars(newChars);
      setUserAnswer(newChars.join(''));
    } else if (e.key === 'Delete') {
      e.preventDefault();
      // 不能删除已锁定的字符
      if (lockedChars[currentFocusIndex]) return;
      
      const newChars = [...answerChars];
      newChars[currentFocusIndex] = '';
      setAnswerChars(newChars);
      setUserAnswer(newChars.join(''));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      if (result) {
        // 如果有结果显示
        if (result.is_correct) {
          // 全部正确，进入下一题
          handleNext();
        } else {
          // 还有错误，触发继续
          handleContinue();
        }
      } else {
        // 否则提交答案
        handleSubmit();
      }
    }
  };

  // 继续填写（清空错误提示，锁定正确单词，清空错误单词）
  const handleContinue = useCallback(() => {
    // 按单词比较，锁定正确的单词，清空错误的单词
    const newLockedChars = [...lockedChars];
    const newAnswerChars = [...answerChars];
    
    // 将字符位置按单词分组
    const letterPositions = charPositions.filter(p => p.type === 'letter');
    const words = [];
    let currentWord = [];
    
    for (let i = 0; i < charPositions.length; i++) {
      const pos = charPositions[i];
      if (pos.type === 'letter') {
        const charIdx = letterPositions.findIndex(p => p === pos);
        currentWord.push({
          posIndex: i,
          charIndex: charIdx,
          correctChar: pos.char
        });
      } else if (pos.type === 'spacing' || pos.type === 'space' || pos.type === 'punctuation') {
        // 遇到分隔符，结束当前单词
        if (currentWord.length > 0) {
          words.push([...currentWord]);
          currentWord = [];
        }
      }
    }
    // 添加最后一个单词
    if (currentWord.length > 0) {
      words.push(currentWord);
    }
    
    // 逐个单词比较
    for (const word of words) {
      // 检查这个单词是否已经全部锁定
      const isWordLocked = word.every(w => lockedChars[w.charIndex]);
      if (isWordLocked) {
        continue; // 已锁定的单词跳过
      }
      
      // 构建用户输入的单词和正确答案的单词
      let userWord = '';
      let correctWord = '';
      let allFilled = true;
      
      for (const w of word) {
        const userChar = answerChars[w.charIndex] || '';
        if (!userChar) {
          allFilled = false;
        }
        userWord += userChar.toLowerCase();
        correctWord += w.correctChar.toLowerCase();
      }
      
      // 检查单词是否有任何输入
      const hasAnyInput = word.some(w => answerChars[w.charIndex]);
      
      if (hasAnyInput) {
        // 如果用户填写了完整的单词，进行比较
        if (allFilled && userWord === correctWord) {
          // 整个单词正确，锁定该单词的所有字符
          for (const w of word) {
            newLockedChars[w.charIndex] = true;
            // 确保使用正确的字符（保持大小写）
            newAnswerChars[w.charIndex] = w.correctChar;
          }
        } else {
          // 整个单词错误或未填完整，清空该单词的所有字符
          for (const w of word) {
            newAnswerChars[w.charIndex] = '';
          }
        }
      }
      // 如果单词没有任何输入，不做任何处理，保持为空
    }
    
    setLockedChars(newLockedChars);
    setAnswerChars(newAnswerChars);
    
    // 清空result状态
    setResult(null);
    
    // 找到第一个未锁定且为空的位置并聚焦
    const firstEmptyIndex = newAnswerChars.findIndex((char, index) => !newLockedChars[index] && !char);
    if (firstEmptyIndex >= 0) {
      setCurrentFocusIndex(firstEmptyIndex);
    } else {
      // 如果所有位置都有字符或已锁定，找到第一个未锁定的位置
      const firstUnlockedIndex = newLockedChars.findIndex(locked => !locked);
      if (firstUnlockedIndex >= 0) {
        setCurrentFocusIndex(firstUnlockedIndex);
      }
    }
    
    // 聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [answerChars, lockedChars, charPositions]);

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
      
      // Enter键：如果有结果显示，根据是否正确决定进入下一题或继续；否则由input的onKeyPress处理
      if (e.key === 'Enter' && !loading && result) {
        e.preventDefault();
        if (result.is_correct) {
          // 全部正确，进入下一题
          loadNewSentence();
        } else {
          // 还有错误，触发继续
          handleContinue();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [result, sentence, loading, loadNewSentence, handleContinue]);

  const handleNext = () => {
    loadNewSentence();
  };

  // 重做当前题目
  const handleRetry = () => {
    // 清空用户输入和锁定状态
    setAnswerChars(new Array(answerChars.length).fill(''));
    setLockedChars(new Array(answerChars.length).fill(false));
    setUserAnswer('');
    setResult(null);
    setCurrentFocusIndex(0);
    
    // 重新播放语音
    if (sentence && sentence.english) {
      setTimeout(() => {
        speakText(sentence.english);
      }, 100);
    }
    
    // 聚焦输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 200);
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
          disabled={loading}
          autoFocus
        />
        
        {/* 显示下划线和用户输入 */}
        <div className="answer-display" onClick={() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}>
          {(() => {
            // 将字符位置按单词分组
            const letterPositions = charPositions.filter(p => p.type === 'letter');
            const groups = [];
            let currentGroup = [];
            
            for (let i = 0; i < charPositions.length; i++) {
              const pos = charPositions[i];
              
              if (pos.type === 'letter') {
                currentGroup.push({ type: 'letter', pos, index: i });
              } else if (pos.type === 'spacing' || pos.type === 'space') {
                if (currentGroup.length > 0) {
                  groups.push({ type: 'word', items: [...currentGroup] });
                  currentGroup = [];
                }
                groups.push({ type: 'spacing', pos, index: i });
              } else if (pos.type === 'punctuation') {
                if (currentGroup.length > 0) {
                  groups.push({ type: 'word', items: [...currentGroup] });
                  currentGroup = [];
                }
                groups.push({ type: 'punctuation', pos, index: i });
              }
            }
            // 添加最后一个单词
            if (currentGroup.length > 0) {
              groups.push({ type: 'word', items: currentGroup });
            }
            
            return groups.map((group, groupIdx) => {
              if (group.type === 'spacing') {
                return <span key={`spacing-${groupIdx}`} className="spacing">{group.pos.char}</span>;
              }
              
              if (group.type === 'punctuation') {
                return (
                  <span key={`punctuation-${groupIdx}`} className="punctuation-char">
                    {group.pos.char}
                  </span>
                );
              }
              
              // 单词组
              return (
                <span key={`word-${groupIdx}`} className="word-group">
                  {group.items.map((item, itemIdx) => {
                    const pos = item.pos;
                    const idx = item.index;
                    const inputIndex = letterPositions.findIndex(p => p === pos);
                    
                    const userChar = inputIndex >= 0 ? (answerChars[inputIndex] || '') : '';
                    const correctChar = pos.char.toLowerCase();
                    const isLocked = inputIndex >= 0 && lockedChars[inputIndex];
                    // 如果有结果显示，检查字符是否正确
                    const isCorrect = result ? (userChar.toLowerCase() === correctChar) : null;
                    // 检查是否是填了但错误的字符（需要显示删除符号）
                    const showDeleteIcon = result && !isLocked && userChar && !isCorrect;
                    // 已锁定的字符显示为绿色，如果有结果显示则显示正确答案，否则显示用户输入
                    const showChar = isLocked 
                      ? letterPositions[inputIndex].char 
                      : (userChar || (result && !isLocked ? correctChar : ''));
                    const isFocused = !isLocked && !result && inputIndex === currentFocusIndex;
                    
                    return (
                      <span
                        key={`char-${idx}`}
                        className={`char-cell-wrapper`}
                      >
                        <span
                          className={`char-cell ${
                            isLocked 
                              ? 'locked'
                              : result 
                                ? (isCorrect ? 'correct' : 'incorrect')
                                : userChar ? 'filled' : 'empty'
                          } ${showDeleteIcon ? 'has-strikethrough' : ''} ${isFocused ? 'focused' : ''}`}
                          onClick={() => handleCharCellClick(inputIndex)}
                          style={{ cursor: (isLocked || result) ? 'default' : 'pointer' }}
                        >
                          {showChar || '_'}
                        </span>
                      </span>
                    );
                  })}
                </span>
              );
            });
          })()}
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
              disabled={loading || answerChars.every((c, i) => !lockedChars[i] && !c)}
            >
              提交
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="result-section">
          {result.is_correct ? (
            // 全部正确时显示成功消息和下一题、重做按钮
            <>
              <div className={`result-message correct`}>
                ✓ 正确！
              </div>
              <div className="button-group">
                <button 
                  className="next-btn" 
                  onClick={handleNext}
                >
                  下一题
                </button>
                <button 
                  className="retry-btn" 
                  onClick={handleRetry}
                  title="重新做这道题"
                >
                  ↻
                </button>
              </div>
            </>
          ) : (
            // 有错误时显示错误消息和继续按钮
            <>
              <div className={`result-message incorrect`}>
                ✗ 错误
              </div>
              <div className="correct-answer">
                正确答案：{result.correct_answer}
              </div>
              <div className="button-group">
                <button 
                  className="continue-btn" 
                  onClick={handleContinue}
                >
                  继续
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LearningCard;



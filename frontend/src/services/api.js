const API_BASE_URL = '/api';

export const getRandomSentence = async (difficulties = []) => {
  const params = new URLSearchParams();
  if (difficulties.length > 0) {
    params.append('difficulties', difficulties.join(','));
  }
  const url = `${API_BASE_URL}/sentence/random${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('获取句子失败');
  }
  return response.json();
};

export const getSentencesList = async (difficulties = []) => {
  const params = new URLSearchParams();
  if (difficulties.length > 0) {
    params.append('difficulties', difficulties.join(','));
  }
  const url = `${API_BASE_URL}/sentences/list${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('获取句子列表失败');
  }
  return response.json();
};

export const uploadExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload-excel`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '上传文件失败');
  }
  
  return response.json();
};

export const checkAnswer = async (sentenceId, answer) => {
  const response = await fetch(`${API_BASE_URL}/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sentence_id: sentenceId,
      answer: answer,
    }),
  });
  if (!response.ok) {
    throw new Error('检查答案失败');
  }
  return response.json();
};


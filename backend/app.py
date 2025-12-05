from flask import Flask, jsonify, request
from flask_cors import CORS
from database import init_db, get_db
from models import Sentence
from sqlalchemy.orm import Session
import random
import pandas as pd

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化数据库
init_db()

@app.route('/api/sentence/random', methods=['GET'])
def get_random_sentence():
    """获取随机句子，支持按难度筛选"""
    db: Session = next(get_db())
    try:
        # 获取难度参数（可以是多个，用逗号分隔）
        difficulties = request.args.get('difficulties', '').split(',')
        difficulties = [d.strip() for d in difficulties if d.strip()]
        
        # 构建查询
        query = db.query(Sentence)
        if difficulties:
            query = query.filter(Sentence.difficulty.in_(difficulties))
        
        sentences = query.all()
        if not sentences:
            return jsonify({'error': '没有可用的句子'}), 404
        
        sentence = random.choice(sentences)
        return jsonify({
            'id': sentence.id,
            'chinese': sentence.chinese,
            'english': sentence.english,
            'difficulty': sentence.difficulty
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/sentences/list', methods=['GET'])
def get_sentences_list():
    """获取句子列表，支持按难度筛选和分页"""
    db: Session = next(get_db())
    try:
        # 获取难度参数
        difficulties = request.args.get('difficulties', '').split(',')
        difficulties = [d.strip() for d in difficulties if d.strip()]
        
        # 构建查询
        query = db.query(Sentence)
        if difficulties:
            query = query.filter(Sentence.difficulty.in_(difficulties))
        
        sentences = query.order_by(Sentence.id).all()
        
        result = [{
            'id': s.id,
            'chinese': s.chinese,
            'english': s.english,
            'difficulty': s.difficulty
        } for s in sentences]
        
        return jsonify({
            'sentences': result,
            'total': len(result)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/sentence/<int:sentence_id>', methods=['GET'])
def get_sentence(sentence_id):
    """获取指定ID的句子"""
    db: Session = next(get_db())
    try:
        sentence = db.query(Sentence).filter(Sentence.id == sentence_id).first()
        if not sentence:
            return jsonify({'error': '句子不存在'}), 404
        
        return jsonify({
            'id': sentence.id,
            'chinese': sentence.chinese,
            'english': sentence.english
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/upload-excel', methods=['POST'])
def upload_excel():
    """上传并解析Excel文件"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '文件名为空'}), 400
        
        # 检查文件扩展名
        if not file.filename.endswith(('.xlsx', '.xls')):
            return jsonify({'error': '只支持Excel文件(.xlsx, .xls)'}), 400
        
        # 读取Excel文件
        df = pd.read_excel(file, header=None)
        
        # 检查列数
        if df.shape[1] < 2:
            return jsonify({'error': 'Excel文件至少需要2列（中文、英文）'}), 400
        
        # 提取数据
        sentences = []
        for index, row in df.iterrows():
            chinese = str(df.iloc[index, 0]).strip()
            english = str(df.iloc[index, 1]).strip()
            
            # 跳过空行
            if not chinese or not english or chinese == 'nan' or english == 'nan':
                continue
            
            sentences.append({
                'id': index + 1,  # 临时ID
                'chinese': chinese,
                'english': english,
                'difficulty': 'custom'
            })
        
        if len(sentences) == 0:
            return jsonify({'error': 'Excel文件中没有有效数据'}), 400
        
        return jsonify({
            'sentences': sentences,
            'total': len(sentences)
        })
    except Exception as e:
        return jsonify({'error': f'解析Excel文件失败: {str(e)}'}), 500

@app.route('/api/check', methods=['POST'])
def check_answer():
    """检查用户答案"""
    data = request.json
    sentence_id = data.get('sentence_id')
    user_answer = data.get('answer', '').strip()
    
    db: Session = next(get_db())
    try:
        sentence = db.query(Sentence).filter(Sentence.id == sentence_id).first()
        if not sentence:
            return jsonify({'error': '句子不存在'}), 404
        
        correct_answer = sentence.english.strip()
        # 答案检查：忽略大小写，规范化空格（多个空格合并为一个）
        # 保留标点符号，但规范化空格
        import re
        normalized_user = re.sub(r'\s+', ' ', user_answer.lower().strip())
        normalized_correct = re.sub(r'\s+', ' ', correct_answer.lower().strip())
        is_correct = normalized_user == normalized_correct
        
        return jsonify({
            'is_correct': is_correct,
            'correct_answer': correct_answer,
            'user_answer': user_answer
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)


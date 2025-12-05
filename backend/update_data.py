"""
更新数据库，添加分级标记和新数据
"""
from database import SessionLocal, init_db
from models import Sentence
from init_data import CET4_SENTENCES, IELTS_SENTENCES

def update_database():
    """更新数据库：标记现有数据为cet6，添加cet4和ielts数据"""
    init_db()
    db = SessionLocal()
    
    try:
        # 1. 更新现有数据的difficulty为cet6（确保所有现有数据都是cet6）
        existing_sentences = db.query(Sentence).all()
        updated_count = 0
        for sentence in existing_sentences:
            if sentence.difficulty != 'cet6':
                sentence.difficulty = 'cet6'
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            print(f"已更新 {updated_count} 条现有记录的difficulty为cet6")
        
        # 2. 检查是否已有cet4和ielts数据
        cet4_count = db.query(Sentence).filter(Sentence.difficulty == 'cet4').count()
        ielts_count = db.query(Sentence).filter(Sentence.difficulty == 'ielts').count()
        
        if cet4_count == 0:
            # 添加四级句子
            for item in CET4_SENTENCES:
                sentence = Sentence(
                    chinese=item['chinese'],
                    english=item['english'],
                    difficulty='cet4'
                )
                db.add(sentence)
            db.commit()
            print(f"成功添加 {len(CET4_SENTENCES)} 条CET4句子")
        else:
            print(f"数据库中已有 {cet4_count} 条CET4句子，跳过添加")
        
        if ielts_count == 0:
            # 添加雅思句子
            for item in IELTS_SENTENCES:
                sentence = Sentence(
                    chinese=item['chinese'],
                    english=item['english'],
                    difficulty='ielts'
                )
                db.add(sentence)
            db.commit()
            print(f"成功添加 {len(IELTS_SENTENCES)} 条IELTS句子")
        else:
            print(f"数据库中已有 {ielts_count} 条IELTS句子，跳过添加")
        
        # 3. 显示统计信息
        total = db.query(Sentence).count()
        cet6_count = db.query(Sentence).filter(Sentence.difficulty == 'cet6').count()
        cet4_count = db.query(Sentence).filter(Sentence.difficulty == 'cet4').count()
        ielts_count = db.query(Sentence).filter(Sentence.difficulty == 'ielts').count()
        
        print("\n数据库统计：")
        print(f"  - CET6 (六级): {cet6_count} 条")
        print(f"  - CET4 (四级): {cet4_count} 条")
        print(f"  - IELTS (雅思): {ielts_count} 条")
        print(f"总计: {total} 条")
        
    except Exception as e:
        db.rollback()
        print(f"更新数据时出错: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    update_database()


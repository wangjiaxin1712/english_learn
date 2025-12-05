"""
从Excel文件导入句子数据
Excel格式：第一列=中文，第二列=英文，第三列=难度（可选）
"""
import sys
import os
import pandas as pd
from database import SessionLocal, init_db
from models import Sentence

def import_from_excel(excel_path, skip_duplicates=True):
    """
    从Excel文件导入数据
    
    Args:
        excel_path: Excel文件路径
        skip_duplicates: 是否跳过重复的句子（基于中文和英文）
    """
    # 检查文件是否存在
    if not os.path.exists(excel_path):
        print(f"错误：文件不存在 - {excel_path}")
        return False
    
    # 初始化数据库
    init_db()
    db = SessionLocal()
    
    try:
        # 读取Excel文件
        print(f"正在读取Excel文件: {excel_path}")
        df = pd.read_excel(excel_path, header=None)
        
        # 检查列数
        if df.shape[1] < 2:
            print("错误：Excel文件至少需要2列（中文、英文）")
            return False
        
        # 提取数据
        # 第一列：中文，第二列：英文，第三列：难度（可选）
        chinese_col = df.iloc[:, 0]
        english_col = df.iloc[:, 1]
        difficulty_col = df.iloc[:, 2] if df.shape[1] >= 3 else None
        
        # 统计信息
        total_rows = len(df)
        imported_count = 0
        skipped_count = 0
        error_count = 0
        
        print(f"\n开始导入，共 {total_rows} 行数据...")
        
        # 遍历每一行
        for index, row in df.iterrows():
            try:
                chinese = str(chinese_col.iloc[index]).strip()
                english = str(english_col.iloc[index]).strip()
                
                # 跳过空行
                if not chinese or not english or chinese == 'nan' or english == 'nan':
                    skipped_count += 1
                    continue
                
                # 获取难度（如果有第三列）
                if difficulty_col is not None:
                    difficulty = str(difficulty_col.iloc[index]).strip().lower()
                    # 验证难度值
                    if difficulty not in ['cet4', 'cet6', 'ielts']:
                        difficulty = 'cet6'  # 默认值
                else:
                    difficulty = 'cet6'  # 默认值
                
                # 检查是否重复
                if skip_duplicates:
                    existing = db.query(Sentence).filter(
                        Sentence.chinese == chinese,
                        Sentence.english == english
                    ).first()
                    if existing:
                        skipped_count += 1
                        continue
                
                # 创建新记录
                sentence = Sentence(
                    chinese=chinese,
                    english=english,
                    difficulty=difficulty
                )
                db.add(sentence)
                imported_count += 1
                
                # 每100条提交一次
                if imported_count % 100 == 0:
                    db.commit()
                    print(f"已导入 {imported_count} 条...")
                    
            except Exception as e:
                error_count += 1
                print(f"第 {index + 1} 行导入失败: {e}")
                continue
        
        # 提交剩余的数据
        db.commit()
        
        # 显示统计信息
        print("\n" + "="*50)
        print("导入完成！")
        print(f"总计: {total_rows} 行")
        print(f"成功导入: {imported_count} 条")
        print(f"跳过: {skipped_count} 条（空行或重复）")
        print(f"错误: {error_count} 条")
        print("="*50)
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"导入过程中出错: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python import_excel.py <excel_file_path>")
        print("\n示例:")
        print("  python import_excel.py data.xlsx")
        print("  python import_excel.py /path/to/data.xlsx")
        print("\nExcel格式:")
        print("  第一列: 中文")
        print("  第二列: 英文")
        print("  第三列: 难度 (可选: cet4, cet6, ielts)")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    success = import_from_excel(excel_path)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == '__main__':
    main()


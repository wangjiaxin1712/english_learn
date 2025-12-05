from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Sentence
import os

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'sentences.db')
DATABASE_URL = f'sqlite:///{DB_PATH}'

# 创建数据库引擎
engine = create_engine(DATABASE_URL, echo=False)

# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """初始化数据库，创建表"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


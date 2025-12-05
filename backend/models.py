from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Sentence(Base):
    __tablename__ = 'sentences'
    
    id = Column(Integer, primary_key=True)
    chinese = Column(String(500), nullable=False)
    english = Column(String(500), nullable=False)
    difficulty = Column(String(20), default='cet6')
    created_at = Column(DateTime, default=datetime.now)


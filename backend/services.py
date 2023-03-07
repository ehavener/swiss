from sqlalchemy.orm import Session
import cohere

import models
from schemas import User
from main import settings

co = cohere.Client(settings.cohere_api_key)

def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_threads(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Thread).offset(skip).limit(limit).all()

def get_messages(thread_id: int, db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Message).filter(models.Message.thread_id == thread_id).offset(skip).limit(limit).all()

def create_thread(title: str, user: User, db: Session):
    db_thread = models.Thread(title=title, user_id=user.id)
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    return db_thread

def create_message(thread_id: int, text: str, user: User, type: str, db: Session):
    print("thread_id", thread_id)
    db_message = models.Message(text=text, thread_id=thread_id, type=type, user_id=user.id)
    print("db_message.thread_id", db_message.thread_id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def generate_response(text: str):
    response = co.generate(
        model="command-xlarge-nightly",
        max_tokens=300,
        prompt=text,
        temperature=0.9,
        k=0,
        p=0.75,
    )
    return response

from sqlalchemy.orm import Session
import cohere

from models import User, Thread, Message
from schemas import UserModel
from config import settings

co = cohere.Client(settings.cohere_api_key)

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserModel):
    # Assumes password property is hashed
    db_user = User(email=user.email, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_threads_by_user(user_id: int, db: Session):
    return db.query(Thread).filter(Thread.user_id == user_id).all()

def get_messages(user_id: int, thread_id: int, db: Session):
    return db.query(Message).filter(Message.user_id == user_id).filter(Message.thread_id == thread_id).all()

def create_thread(title: str, user: UserModel, db: Session):
    db_thread = Thread(title=title, user_id=user.id)
    db.add(db_thread)
    db.commit()
    db.refresh(db_thread)
    return db_thread

def create_message(thread_id: int, text: str, user: UserModel, type: str, db: Session):
    db_message = Message(text=text, thread_id=thread_id, type=type, user_id=user.id)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def generate_cohere_response(text: str):
    response = co.generate(
        model="command-xlarge-nightly",
        max_tokens=300,
        prompt=text,
        temperature=0.9,
        k=0,
        p=0.75,
    )
    return response

def generate_toolformer_response(text: str):

    return NotImplemented
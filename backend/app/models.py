from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)

    threads = relationship("Thread", back_populates="user")
    messages = relationship("Message", back_populates="user")

class Thread(Base):
    __tablename__ = "threads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    last_message_at = Column(DateTime)
    user_id = Column(Integer, ForeignKey("users.id"))

    messages = relationship("Message", back_populates="thread")
    user = relationship("User", back_populates="threads")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True)
    type = Column(String, index=True)  # "prompt" | "response"
    timestamp = Column(DateTime)
    thread_id = Column(Integer, ForeignKey("threads.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="messages")
    thread = relationship("Thread", back_populates="messages")

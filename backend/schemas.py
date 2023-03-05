from typing import Union

from pydantic import BaseModel

class User(BaseModel):
    id: int
    email: Union[str, None] = None
    full_name: Union[str, None] = None
    disabled: Union[bool, None] = None

    class Config:
        orm_mode = True

class Thread(BaseModel):
    id: int
    title: str
    last_message_at: Union[str, None]
    user_id: int

    class Config:
        orm_mode = True

class ThreadCreate(BaseModel):
    title: str

    class Config:
        orm_mode = True

class Message(BaseModel):
    id: int
    text: str
    type: str  # prompt | response
    timestamp: Union[str, None]
    thread_id: int
    user_id: int

    class Config:
        orm_mode = True

class MessageCreate(BaseModel):
    text: str

    class Config:
        orm_mode = True

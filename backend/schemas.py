from typing import List, Union

from pydantic import BaseModel


class PromptBase(BaseModel):
    text: Union[str, None] = None


class PromptCreate(PromptBase):
    pass


class Prompt(PromptBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True


class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    prompts: List[Prompt] = []

    class Config:
        orm_mode = True

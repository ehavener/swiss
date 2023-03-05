from datetime import timedelta, datetime
from inspect import getmembers
from pprint import pprint
from types import FunctionType
from typing import Union, List

from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from pydantic import BaseSettings
from sqlalchemy.orm import Session

import models
from database import SessionLocal
from schemas import User

class Settings(BaseSettings):
    # JWT # to get a string like this run: # openssl rand -hex 32
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # CORS
    origins: List[str] = ["http://localhost:3000"]
    # Co:here
    cohere_api_key: str

settings = Settings()

class Prompt(BaseModel):
    text: str

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Security

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Union[str, None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserInDB(User):
    hashed_password: str

def get_user(db: Session, username: str):
    user_db_model = db.query(models.User).filter(models.User.email == username).first()
    return UserInDB(id=user_db_model.id, email=user_db_model.email,
                    full_name=user_db_model.full_name, disabled=user_db_model.disabled,
                    hashed_password=user_db_model.hashed_password)

def authenticate_user(db, username: str, password: str):
    user = get_user(db=db, username=username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db=db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/")
async def root():
    return {"message": "Hello World"}

import services
import schemas

def attributes(obj):
    disallowed_names = {
      name for name, value in getmembers(type(obj))
        if isinstance(value, FunctionType)}
    return {
      name: getattr(obj, name) for name in dir(obj)
        if name[0] != '_' and name not in disallowed_names and hasattr(obj, name)}

def print_attributes(obj):
    pprint(attributes(obj))

@app.get("/threads/", response_model=List[schemas.Thread])
async def get_threads(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    threads = services.get_threads(db, skip=skip, limit=limit)
    return threads

@app.get("/threads/{thread_id}")
async def get_thread(thread_id: int, current_user: User = Depends(get_current_active_user)):
    return NotImplemented

@app.post("/threads/", response_model=schemas.Thread)
async def create_thread(thread: schemas.ThreadCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    thread.title = "A new thread"
    thread = services.create_thread(thread.title, current_user, db)
    return thread

@app.get("/threads/{thread_id}/messages/", response_model=List[schemas.Message])
async def get_thread_messages(thread_id: int, skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    messages = services.get_messages(thread_id, db, skip=skip, limit=limit)
    return messages

@app.post("/threads/{thread_id}/messages/", response_model=List[schemas.Message])
async def create_thread_message(thread_id: int, message: schemas.MessageCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    # creates a new message as POSTed by the user
    new_message = services.create_message(thread_id, message.text, current_user, db)
    # sends the appropriate context (entire thread concatenated) to the model
    # creates a new message with the model's response
    # returns all messages in thread
    return NotImplemented

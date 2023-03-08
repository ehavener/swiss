from datetime import timedelta, datetime
from typing import Union, List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings

from models import User
from database import SessionLocal
from schemas import UserModel, UserCreateModel, ThreadModel, ThreadCreateModel, MessageModel, MessageCreateModel
import services

# FastAPI Setup
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Security and Authorization Middleware
class TokenModel(BaseModel):
    access_token: str
    token_type: str

class TokenDataModel(BaseModel):
    username: Union[str, None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

class UserInDBModel(UserModel):
    hashed_password: str

def get_user(db: Session, username: str):
    user_db_model = db.query(User).filter(User.email == username).first()
    return UserInDBModel(id=user_db_model.id, email=user_db_model.email,
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
        token_data = TokenDataModel(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db=db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserModel = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authorized",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Routes and Controllers
@app.post("/sign-up", response_model=TokenModel)
async def create_user(user: UserCreateModel, db: Session = Depends(get_db)):
    # check if user exists
    if services.get_user(db, user.email):
        raise HTTPException(status_code=404, detail="A user with this email already exists")
    # password length requirement
    if len(user.password) < 8:
        raise HTTPException(status_code=404, detail="Password must be 8 characters")
    # create user
    unhashed_password = user.password
    user.password = get_password_hash(user.password)
    user = services.create_user(db, user)
    user = authenticate_user(db, user.email, unhashed_password)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=TokenModel)
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

@app.get("/users/me/", response_model=UserModel)
async def read_users_me(current_user: UserModel = Depends(get_current_active_user)):
    return current_user

@app.get("/threads/", response_model=List[ThreadModel])
async def get_threads_by_user(current_user: UserModel = Depends(get_current_active_user),
                              db: Session = Depends(get_db)):
    user_id = current_user.id
    threads = services.get_threads_by_user(user_id, db)
    return threads

@app.post("/threads/", response_model=ThreadModel)
async def create_thread(thread: ThreadCreateModel, current_user: UserModel = Depends(get_current_active_user),
                        db: Session = Depends(get_db)):
    thread = services.create_thread(thread.title, current_user, db)
    return thread

@app.get("/threads/{thread_id}/messages/", response_model=List[MessageModel])
async def get_thread_messages(thread_id: int,
                              current_user: UserModel = Depends(get_current_active_user),
                              db: Session = Depends(get_db)):
    # Users should only be able to read messages in threads they own
    messages = services.get_messages(current_user.id, thread_id, db)
    return messages

@app.post("/threads/{thread_id}/messages/", response_model=List[MessageModel])
async def create_thread_message(thread_id: int, message: MessageCreateModel,
                                current_user: UserModel = Depends(get_current_active_user),
                                db: Session = Depends(get_db)):
    # creates a new message as POSTed by the user
    # Users should only be able to create messages in threads they own
    services.create_message(thread_id=thread_id, text=message.text, user=current_user, type="prompt", db=db)
    # sends the appropriate context (entire thread concatenated) to the model
    all_messages_in_thread = services.get_messages(user_id=current_user.id, thread_id=thread_id, db=db)
    context = " ".join([m.text for m in all_messages_in_thread])
    model_response = services.generate_cohere_response(context)
    # creates a new message with the model's response
    services.create_message(thread_id=thread_id, text=model_response[0].text, user=current_user, type="response", db=db)
    # returns all messages in thread
    messages = services.get_messages(user_id=current_user.id, thread_id=thread_id, db=db)
    return messages

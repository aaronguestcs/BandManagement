"""
Auth: register + login issue a signed JWT, get_current_user validates it.
Issues a Bearer token for the client to use in future requests. Token signed with SECRET key set in env.
Token is marked with expiry of 7 days, after which the client requires a new login to get a new token.
"""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET = os.getenv("SECRET") or "dev-secret-change-me"
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24 * 7 # 7 days for token expiry

oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode()[:72], bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode()[:72], hashed.encode())


class RegisterIn(BaseModel):
    username: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    creds_exc = HTTPException(
        status.HTTP_401_UNAUTHORIZED, "Invalid credentials", {"WWW-Authenticate": "Bearer"}
    )
    try:
        user_id = int(jwt.decode(token, SECRET, algorithms=[ALGORITHM])["sub"])
    except (JWTError, KeyError, ValueError):
        raise creds_exc
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise creds_exc
    return user


@router.post("/register", response_model=Token)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already taken")
    user = User(username=data.username, email=data.email, hashed_password=hash_pw(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=make_token(user.id), user=user)


@router.post("/login", response_model=Token)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user is None or not user.hashed_password or not verify_pw(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    return Token(access_token=make_token(user.id), user=user)

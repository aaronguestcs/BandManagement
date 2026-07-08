"""
Auth: register + login issue a signed JWT; get_current_user validates it.

The flow (frontend -> here):
  1. POST /auth/register or /auth/login  ->  { access_token, user }
  2. Frontend stores access_token, sends it as `Authorization: Bearer <token>`
  3. Any route that Depends(get_current_user) decodes the token back to a User

The token is just a signed statement "user id N, valid until T". Signed with
SECRET, so the server can trust it without a DB session lookup on every request.
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

SECRET = os.getenv("SECRET") or "dev-secret-change-me"  # ponytail: dev fallback; set SECRET in .env before deploying
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24 * 7

# tokenUrl is only used to label the "Authorize" button in Swagger docs.
oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# bcrypt caps input at 72 bytes and now raises past it, so truncate first.
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

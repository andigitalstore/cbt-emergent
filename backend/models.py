from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    GURU = "guru"
    SISWA = "siswa"

class UserStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"

class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"

class SubscriptionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    ESSAY = "essay"
    SENTENCE_ORDER = "sentence_order"

class ExamSessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    FORCE_SUBMITTED = "force_submitted"

# Request/Response Models

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    school_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class QuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: Any
    points: int = 1

class QuestionResponse(BaseModel):
    question_id: str
    teacher_id: str
    question_text: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: Any
    points: int
    created_at: datetime

class ExamSettings(BaseModel):
    shuffle_questions: bool = False
    shuffle_options: bool = False

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    token: str
    question_ids: List[str]
    settings: ExamSettings

class ExamResponse(BaseModel):
    exam_id: str
    teacher_id: str
    title: str
    description: Optional[str]
    duration_minutes: int
    token: str
    questions_count: int
    settings: ExamSettings
    status: str
    created_at: datetime

class StudentExamStart(BaseModel):
    student_name: str
    student_class: str
    token: str

class SaveAnswer(BaseModel):
    session_id: str
    question_id: str
    answer: Any
    status: str

class ReportViolation(BaseModel):
    session_id: str

class SubmitExam(BaseModel):
    session_id: str

class SubscriptionCreate(BaseModel):
    teacher_id: str
    plan_tier: SubscriptionTier

class SubscriptionResponse(BaseModel):
    subscription_id: str
    teacher_id: str
    plan_tier: SubscriptionTier
    status: SubscriptionStatus
    snap_token: Optional[str] = None
    created_at: datetime
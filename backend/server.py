from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timedelta, timezone
import uuid
import random
import io
import pandas as pd
from fastapi.responses import StreamingResponse

from database import get_database
from models import *
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from midtrans_service import midtrans_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pricing tiers (in IDR)
PRICING = {
    SubscriptionTier.FREE: 0,
    SubscriptionTier.PRO: 500000
}

# ==================== AUTHENTICATION ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    db = get_database()
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "password_hash": hashed_pw,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": UserRole.GURU,
        "status": UserStatus.PENDING,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create teacher profile with free tier
    teacher_doc = {
        "_id": user_id,
        "user_id": user_id,
        "school_name": user_data.school_name or "",
        "subscription_tier": SubscriptionTier.FREE,
        "subscription_status": SubscriptionStatus.ACTIVE,
        "subscription_end_date": None,
        "quota_questions": 20,
        "quota_students": 10,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.teachers.insert_one(teacher_doc)
    
    return {"message": "Registration successful. Waiting for admin approval.", "user_id": user_id}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    db = get_database()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["status"] != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail=f"Account is {user['status']}")
    
    token_data = {
        "user_id": user["_id"],
        "email": user["email"],
        "role": user["role"]
    }
    
    access_token = create_access_token(token_data)
    
    user_info = {
        "user_id": user["_id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"]
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If teacher, include quota info
    if current_user["role"] == UserRole.GURU:
        teacher = await db.teachers.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        user["teacher_info"] = teacher
    
    return user

# ==================== SUPERADMIN ====================

@api_router.get("/superadmin/pending-users")
async def get_pending_users(current_user: dict = Depends(require_role([UserRole.SUPERADMIN]))):
    db = get_database()
    pending = await db.users.find({"status": UserStatus.PENDING, "role": UserRole.GURU}, {"password_hash": 0}).to_list(1000)
    # Convert _id to user_id for frontend
    for user in pending:
        user["user_id"] = user.pop("_id")
    return pending

@api_router.post("/superadmin/approve-user/{user_id}")
async def approve_user(user_id: str, current_user: dict = Depends(require_role([UserRole.SUPERADMIN]))):
    db = get_database()
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": {"status": UserStatus.ACTIVE}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User approved"}

@api_router.post("/superadmin/reject-user/{user_id}")
async def reject_user(user_id: str, current_user: dict = Depends(require_role([UserRole.SUPERADMIN]))):
    db = get_database()
    result = await db.users.update_one(
        {"_id": user_id},
        {"$set": {"status": UserStatus.REJECTED}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User rejected"}

@api_router.get("/superadmin/all-teachers")
async def get_all_teachers(current_user: dict = Depends(require_role([UserRole.SUPERADMIN]))):
    db = get_database()
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    return teachers

# ==================== SUBSCRIPTION ====================

@api_router.post("/subscription/create")
async def create_subscription(sub_data: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    if sub_data.plan_tier == SubscriptionTier.FREE:
        raise HTTPException(status_code=400, detail="Cannot create subscription for free tier")
    
    subscription_id = str(uuid.uuid4())
    order_id = f"SUB-{subscription_id[:8]}"
    price = PRICING[sub_data.plan_tier]
    
    # Get teacher info
    teacher = await db.teachers.find_one({"user_id": sub_data.teacher_id})
    user = await db.users.find_one({"_id": sub_data.teacher_id})
    
    if not teacher or not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    customer_details = {
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "email": user["email"]
    }
    
    item_details = [{
        "id": "pro-plan",
        "name": "CBT Pro - Paket Premium",
        "quantity": 1,
        "price": price
    }]
    
    snap_token = await midtrans_service.create_snap_token(
        order_id=order_id,
        gross_amount=price,
        customer_details=customer_details,
        item_details=item_details
    )
    
    subscription_doc = {
        "_id": subscription_id,
        "teacher_id": sub_data.teacher_id,
        "order_id": order_id,
        "plan_tier": sub_data.plan_tier,
        "status": SubscriptionStatus.PENDING,
        "snap_token": snap_token,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.subscriptions.insert_one(subscription_doc)
    
    return {
        "subscription_id": subscription_id,
        "teacher_id": sub_data.teacher_id,
        "plan_tier": sub_data.plan_tier,
        "status": SubscriptionStatus.PENDING,
        "snap_token": snap_token,
        "created_at": subscription_doc["created_at"]
    }

@api_router.post("/subscription/webhook/midtrans")
async def midtrans_webhook(request: Request):
    db = get_database()
    payload = await request.json()
    
    signature = payload.get('signature_key')
    if not midtrans_service.verify_notification_signature(payload, signature):
        logger.warning(f"Invalid signature for notification")
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    order_id = payload.get('order_id')
    transaction_status = payload.get('transaction_status')
    
    status_mapping = {
        'capture': SubscriptionStatus.ACTIVE,
        'settlement': SubscriptionStatus.ACTIVE,
        'pending': SubscriptionStatus.PENDING,
        'deny': SubscriptionStatus.EXPIRED,
        'cancel': SubscriptionStatus.EXPIRED,
        'expire': SubscriptionStatus.EXPIRED
    }
    
    new_status = status_mapping.get(transaction_status, SubscriptionStatus.PENDING)
    
    subscription = await db.subscriptions.find_one({"order_id": order_id})
    if not subscription:
        return {"status": "acknowledged"}
    
    await db.subscriptions.update_one(
        {"order_id": order_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Update teacher subscription
    if new_status == SubscriptionStatus.ACTIVE:
        await db.teachers.update_one(
            {"user_id": subscription["teacher_id"]},
            {
                "$set": {
                    "subscription_tier": SubscriptionTier.PRO,
                    "subscription_status": SubscriptionStatus.ACTIVE,
                    "subscription_end_date": datetime.now(timezone.utc) + timedelta(days=30),
                    "quota_questions": 999999,
                    "quota_students": 999999
                }
            }
        )
    
    return {"status": "success"}

@api_router.get("/subscription/status/{teacher_id}")
async def get_subscription_status(teacher_id: str):
    db = get_database()
    teacher = await db.teachers.find_one({"user_id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

# ==================== QUESTIONS ====================

@api_router.post("/questions/create")
async def create_question(question: QuestionCreate, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    
    # Check quota
    teacher = await db.teachers.find_one({"user_id": current_user["user_id"]})
    question_count = await db.questions.count_documents({"teacher_id": current_user["user_id"]})
    
    if question_count >= teacher["quota_questions"]:
        raise HTTPException(status_code=403, detail="Question quota exceeded. Please upgrade your subscription.")
    
    question_id = str(uuid.uuid4())
    question_doc = {
        "_id": question_id,
        "teacher_id": current_user["user_id"],
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "points": question.points,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.questions.insert_one(question_doc)
    
    return {
        "question_id": question_id,
        "teacher_id": current_user["user_id"],
        "question_text": question.question_text,
        "question_type": question.question_type,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "points": question.points,
        "created_at": question_doc["created_at"]
    }

@api_router.get("/questions/list")
async def list_questions(current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    questions = await db.questions.find({"teacher_id": current_user["user_id"]}).to_list(1000)
    # Convert _id to question_id
    for q in questions:
        q["question_id"] = q.pop("_id")
    return questions

@api_router.delete("/questions/{question_id}")
async def delete_question(question_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    result = await db.questions.delete_one({"_id": question_id, "teacher_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted"}

@api_router.get("/questions/check-quota")
async def check_quota(current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    teacher = await db.teachers.find_one({"user_id": current_user["user_id"]})
    question_count = await db.questions.count_documents({"teacher_id": current_user["user_id"]})
    return {
        "used": question_count,
        "quota": teacher["quota_questions"],
        "remaining": teacher["quota_questions"] - question_count
    }

# ==================== EXAMS ====================

@api_router.post("/exams/create")
async def create_exam(exam: ExamCreate, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    
    # Verify all questions exist and belong to teacher
    questions = await db.questions.find({
        "_id": {"$in": exam.question_ids},
        "teacher_id": current_user["user_id"]
    }).to_list(1000)
    
    if len(questions) != len(exam.question_ids):
        raise HTTPException(status_code=400, detail="Some questions not found or don't belong to you")
    
    exam_id = str(uuid.uuid4())
    exam_doc = {
        "_id": exam_id,
        "teacher_id": current_user["user_id"],
        "title": exam.title,
        "description": exam.description,
        "duration_minutes": exam.duration_minutes,
        "token": exam.token,
        "question_ids": exam.question_ids,
        "settings": exam.settings.model_dump(),
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.exams.insert_one(exam_doc)
    
    return {
        "exam_id": exam_id,
        "teacher_id": current_user["user_id"],
        "title": exam.title,
        "description": exam.description,
        "duration_minutes": exam.duration_minutes,
        "token": exam.token,
        "questions_count": len(exam.question_ids),
        "settings": exam.settings,
        "status": "active",
        "created_at": exam_doc["created_at"]
    }

@api_router.get("/exams/list")
async def list_exams(current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    exams = await db.exams.find({"teacher_id": current_user["user_id"]}).to_list(1000)
    # Convert _id to exam_id
    for e in exams:
        e["exam_id"] = e.pop("_id")
    return exams

@api_router.get("/exams/{exam_id}")
async def get_exam(exam_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    exam = await db.exams.find_one({"_id": exam_id, "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    exam["exam_id"] = exam.pop("_id")
    return exam

@api_router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    result = await db.exams.delete_one({"_id": exam_id, "teacher_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted"}

@api_router.post("/exams/validate-token")
async def validate_token(data: dict):
    db = get_database()
    exam = await db.exams.find_one({"token": data["token"]}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    if exam["status"] != "active":
        raise HTTPException(status_code=400, detail="Exam is not active")
    
    return {
        "exam_id": exam["exam_id"] if "exam_id" in exam else exam.get("_id"),
        "title": exam["title"],
        "duration_minutes": exam["duration_minutes"]
    }

@api_router.get("/exams/{exam_id}/live-monitor")
async def live_monitor(exam_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    
    exam = await db.exams.find_one({"_id": exam_id, "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    sessions = await db.exam_sessions.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
    return sessions

# ==================== STUDENT EXAM ====================

@api_router.post("/student/start-exam")
async def start_exam(data: StudentExamStart):
    db = get_database()
    
    exam = await db.exams.find_one({"token": data.token})
    if not exam:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    if exam["status"] != "active":
        raise HTTPException(status_code=400, detail="Exam is not active")
    
    # Get questions
    questions = await db.questions.find({"_id": {"$in": exam["question_ids"]}}).to_list(1000)
    
    # Shuffle if needed
    if exam["settings"]["shuffle_questions"]:
        random.shuffle(questions)
    
    # Prepare questions for student (without correct answers)
    student_questions = []
    for q in questions:
        q_data = {
            "question_id": q["_id"],
            "question_text": q["question_text"],
            "question_type": q["question_type"],
            "options": q["options"] if q["options"] else None,
            "points": q["points"]
        }
        
        if exam["settings"]["shuffle_options"] and q["options"]:
            q_data["options"] = random.sample(q["options"], len(q["options"]))
        
        student_questions.append(q_data)
    
    session_id = str(uuid.uuid4())
    session_doc = {
        "_id": session_id,
        "exam_id": exam["_id"],
        "student_name": data.student_name,
        "student_class": data.student_class,
        "token": data.token,
        "started_at": datetime.now(timezone.utc),
        "answers": {},
        "violations_count": 0,
        "status": ExamSessionStatus.IN_PROGRESS,
        "submitted_at": None,
        "final_score": None
    }
    
    await db.exam_sessions.insert_one(session_doc)
    
    return {
        "session_id": session_id,
        "exam_id": exam["_id"],
        "title": exam["title"],
        "duration_minutes": exam["duration_minutes"],
        "questions": student_questions
    }

@api_router.post("/student/save-answer")
async def save_answer(data: SaveAnswer):
    db = get_database()
    
    session = await db.exam_sessions.find_one({"_id": data.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != ExamSessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session is not active")
    
    # Update answer
    await db.exam_sessions.update_one(
        {"_id": data.session_id},
        {"$set": {f"answers.{data.question_id}": {"answer": data.answer, "status": data.status}}}
    )
    
    return {"message": "Answer saved"}

@api_router.post("/student/report-violation")
async def report_violation(data: ReportViolation):
    db = get_database()
    
    session = await db.exam_sessions.find_one({"_id": data.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    new_count = session["violations_count"] + 1
    
    # Force submit if >= 3 violations
    if new_count >= 3:
        await db.exam_sessions.update_one(
            {"_id": data.session_id},
            {
                "$set": {
                    "violations_count": new_count,
                    "status": ExamSessionStatus.FORCE_SUBMITTED,
                    "submitted_at": datetime.now(timezone.utc),
                    "final_score": 0
                }
            }
        )
        return {"message": "Exam force submitted due to violations", "force_submitted": True}
    
    await db.exam_sessions.update_one(
        {"_id": data.session_id},
        {"$set": {"violations_count": new_count}}
    )
    
    return {"message": "Violation recorded", "violations_count": new_count, "force_submitted": False}

@api_router.post("/student/submit-exam")
async def submit_exam(data: SubmitExam):
    db = get_database()
    
    session = await db.exam_sessions.find_one({"_id": data.session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != ExamSessionStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Session already submitted")
    
    # Calculate score
    exam = await db.exams.find_one({"_id": session["exam_id"]})
    questions = await db.questions.find({"_id": {"$in": exam["question_ids"]}}).to_list(1000)
    
    total_points = 0
    earned_points = 0
    
    for q in questions:
        total_points += q["points"]
        q_id = q["_id"]
        
        if q_id in session["answers"]:
            student_answer = session["answers"][q_id]["answer"]
            correct_answer = q["correct_answer"]
            
            # Auto-grade only multiple choice and sentence order
            if q["question_type"] == QuestionType.MULTIPLE_CHOICE:
                if student_answer == correct_answer:
                    earned_points += q["points"]
            elif q["question_type"] == QuestionType.SENTENCE_ORDER:
                if student_answer == correct_answer:
                    earned_points += q["points"]
    
    final_score = (earned_points / total_points * 100) if total_points > 0 else 0
    
    await db.exam_sessions.update_one(
        {"_id": data.session_id},
        {
            "$set": {
                "status": ExamSessionStatus.SUBMITTED,
                "submitted_at": datetime.now(timezone.utc),
                "final_score": round(final_score, 2)
            }
        }
    )
    
    return {"message": "Exam submitted", "final_score": round(final_score, 2)}

@api_router.get("/student/session/{session_id}")
async def get_session(session_id: str):
    db = get_database()
    session = await db.exam_sessions.find_one({"_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

# ==================== RESULTS ====================

@api_router.get("/results/exam/{exam_id}")
async def get_exam_results(exam_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    
    exam = await db.exams.find_one({"_id": exam_id, "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    sessions = await db.exam_sessions.find({"exam_id": exam_id}).to_list(1000)
    # Convert _id to session_id
    for s in sessions:
        s["session_id"] = s.pop("_id")
    return sessions

@api_router.get("/results/export/{exam_id}")
async def export_results(exam_id: str, current_user: dict = Depends(require_role([UserRole.GURU]))):
    db = get_database()
    
    exam = await db.exams.find_one({"_id": exam_id, "teacher_id": current_user["user_id"]})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    sessions = await db.exam_sessions.find({"exam_id": exam_id}).to_list(1000)
    
    data = []
    for s in sessions:
        data.append({
            "Nama": s["student_name"],
            "Kelas": s["student_class"],
            "Waktu Mulai": s["started_at"].strftime("%Y-%m-%d %H:%M:%S") if s["started_at"] else "",
            "Waktu Selesai": s["submitted_at"].strftime("%Y-%m-%d %H:%M:%S") if s["submitted_at"] else "",
            "Status": s["status"],
            "Pelanggaran": s["violations_count"],
            "Nilai": s["final_score"] if s["final_score"] is not None else ""
        })
    
    df = pd.DataFrame(data)
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=hasil_ujian_{exam_id}.csv"
    
    return response

# Create superadmin on startup
@app.on_event("startup")
async def create_superadmin():
    db = get_database()
    existing = await db.users.find_one({"email": "admin@cbtpro.com"})
    if not existing:
        user_id = str(uuid.uuid4())
        admin_doc = {
            "_id": user_id,
            "email": "admin@cbtpro.com",
            "password_hash": hash_password("admin123"),
            "first_name": "Super",
            "last_name": "Admin",
            "role": UserRole.SUPERADMIN,
            "status": UserStatus.ACTIVE,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_doc)
        logger.info("Superadmin created: admin@cbtpro.com / admin123")

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "CBT Pro API"}

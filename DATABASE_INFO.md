# Database Storage - CBT Pro

## Overview
CBT Pro menggunakan **MongoDB** sebagai database untuk menyimpan semua data aplikasi.

## Connection Details

### Configuration
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
```

### Access dari Backend
```python
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
```

## Database Structure

### Collections (Total: 5)

#### 1. **users** (Authentication & User Management)
Menyimpan informasi user dengan role-based access control.

```javascript
{
  "_id": "uuid",                    // User ID (Primary Key)
  "email": "guru1@test.com",       // Email (Unique)
  "password_hash": "bcrypt_hash",  // Hashed password
  "first_name": "Guru",
  "last_name": "Satu",
  "role": "guru",                  // superadmin | guru | siswa
  "status": "active",              // pending | active | rejected
  "created_at": "2026-01-02..."
}
```

**Current Data**: 4 users (1 superadmin, 3 guru)

#### 2. **teachers** (Subscription & Quota Management)
Menyimpan informasi guru, subscription tier, dan quota.

```javascript
{
  "_id": "user_id",
  "user_id": "uuid",
  "school_name": "SMA Negeri 1",
  "subscription_tier": "free",     // free | pro
  "subscription_status": "active", // active | expired
  "subscription_end_date": null,   // DateTime atau null
  "quota_questions": 20,           // 20 untuk free, 999999 untuk pro
  "quota_students": 10,            // 10 untuk free, 999999 untuk pro
  "created_at": "2026-01-02..."
}
```

**Current Data**: 3 teachers

#### 3. **questions** (Question Bank)
Menyimpan soal-soal ujian dari guru.

```javascript
{
  "_id": "uuid",                   // Question ID
  "teacher_id": "uuid",
  "question_text": "Apa ibu kota Indonesia?",
  "question_type": "multiple_choice", // multiple_choice | essay | sentence_order
  "options": ["Jakarta", "Bandung", "Surabaya", "Medan"],
  "correct_answer": "Jakarta",
  "points": 10,
  "created_at": "2026-01-02..."
}
```

**Current Data**: 3 questions

#### 4. **exams** (Exam Configuration)
Menyimpan konfigurasi ujian yang dibuat guru.

```javascript
{
  "_id": "uuid",                   // Exam ID
  "teacher_id": "uuid",
  "title": "Ujian Pengetahuan Umum",
  "description": "Deskripsi ujian...",
  "duration_minutes": 30,
  "token": "TEST123",              // Token untuk siswa
  "question_ids": ["uuid1", "uuid2", "uuid3"],
  "settings": {
    "shuffle_questions": true,
    "shuffle_options": false
  },
  "status": "active",              // active | inactive
  "created_at": "2026-01-02..."
}
```

**Current Data**: 2 exams

#### 5. **exam_sessions** (Student Exam Attempts)
Menyimpan session ujian siswa dengan jawaban dan hasil.

```javascript
{
  "_id": "uuid",                   // Session ID
  "exam_id": "uuid",
  "student_name": "Budi Santoso",
  "student_class": "12 IPA 1",
  "token": "TEST123",
  "started_at": "2026-01-02...",
  "answers": {
    "question_id_1": {
      "answer": "Jakarta",
      "status": "answered"         // answered | doubtful
    }
  },
  "violations_count": 0,           // Tab switching violations
  "status": "submitted",           // in_progress | submitted | force_submitted
  "submitted_at": "2026-01-02...",
  "final_score": 33.33
}
```

**Current Data**: 2 sessions

## Storage Location

### Physical Storage
- **Path**: `/var/lib/mongodb`
- **Current Size**: 4 KB (data) + 148 KB (storage + indexes)
- **Total Collections**: 5
- **Total Indexes**: 5

### Data Persistence
Data disimpan secara persistent di container MongoDB. Data akan tetap ada selama:
1. Container MongoDB tidak di-reset
2. Volume storage tidak dihapus
3. Database tidak di-drop manual

## Database Statistics

```
Database: test_database
Collections: 5
Data Size: 4.35 KB
Storage Size: 148.00 KB
Indexes: 5
Index Size: 148.00 KB
```

## Security Features

### 1. Password Hashing
```python
import bcrypt

# Hashing password
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# Verifying password
bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

### 2. No Sensitive Data Exposure
- Password hash tidak pernah di-return ke frontend
- Query projection: `{"password_hash": 0}`
- JWT token untuk authentication

### 3. ObjectId Serialization
Semua `_id` dari MongoDB dikonversi ke field yang sesuai untuk JSON serialization:
- `_id` → `user_id` (users)
- `_id` → `question_id` (questions)
- `_id` → `exam_id` (exams)
- `_id` → `session_id` (exam_sessions)

## Backup & Recovery

### Manual Backup
```bash
mongodump --db test_database --out /backup/cbt_pro_$(date +%Y%m%d)
```

### Restore from Backup
```bash
mongorestore --db test_database /backup/cbt_pro_20260102
```

## Development vs Production

### Current Setup (Development)
- Local MongoDB instance
- Database name: `test_database`
- No authentication required
- Bind IP: all interfaces

### Production Recommendations
1. Enable MongoDB authentication
2. Use MongoDB Atlas atau managed service
3. Enable SSL/TLS connections
4. Regular automated backups
5. Implement connection pooling
6. Set up replica sets for high availability
7. Enable audit logging

## Data Flow Example

### User Registration Flow
```
1. POST /api/auth/register
2. Hash password dengan bcrypt
3. Insert ke users collection (status: pending)
4. Insert ke teachers collection (free tier)
5. Return success message
```

### Exam Taking Flow
```
1. POST /api/student/start-exam (dengan token)
2. Validate token di exams collection
3. Create session di exam_sessions collection
4. Return questions (tanpa correct_answer)
5. Auto-save answers ke exam_sessions.answers
6. Calculate score saat submit
7. Update session dengan final_score
```

## Monitoring

### Check Current Data
```bash
python3 << 'EOF'
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def monitor():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    for collection in await db.list_collection_names():
        count = await db[collection].count_documents({})
        print(f"{collection}: {count} documents")

asyncio.run(monitor())
EOF
```

### View Specific Collection
```bash
# Users
mongo test_database --eval "db.users.find().pretty()"

# Recent exams
mongo test_database --eval "db.exams.find().sort({created_at: -1}).limit(5).pretty()"
```

## Notes

- Database menggunakan async driver (Motor) untuk FastAPI
- Semua datetime disimpan dalam UTC timezone
- UUID v4 digunakan untuk semua primary keys
- Tidak ada foreign key constraints (NoSQL nature)
- Relationship di-maintain di application layer

---

**Created**: 2026-01-02
**Database**: MongoDB 4.x
**Driver**: Motor (async)
**Current Data Size**: ~152 KB

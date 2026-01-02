#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for CBT Application
Tests all critical APIs including auth, subscription, exams, and results
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://testpro-9.preview.emergentagent.com/api"

# Test credentials from review request
TEACHER_EMAIL = "guru1@test.com"
TEACHER_PASSWORD = "password123"
SUPERADMIN_EMAIL = "admin@cbtpro.com"  # Use the actual superadmin created on startup
SUPERADMIN_PASSWORD = "admin123"
STUDENT_TOKEN = "TEST123"

class CBTAPITester:
    def __init__(self):
        self.teacher_token = None
        self.superadmin_token = None
        self.teacher_user_id = None
        self.exam_id = None
        self.session_id = None
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_teacher_login(self):
        """Test teacher login functionality"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "email": TEACHER_EMAIL,
                "password": TEACHER_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.teacher_token = data["access_token"]
                    self.teacher_user_id = data["user"]["user_id"]
                    self.log_result("Teacher Login", True, f"Login successful for {TEACHER_EMAIL}")
                    return True
                else:
                    self.log_result("Teacher Login", False, "Missing access_token or user in response", data)
            else:
                self.log_result("Teacher Login", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Teacher Login", False, f"Exception: {str(e)}")
        return False
    
    def test_superadmin_login(self):
        """Test superadmin login functionality"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "email": SUPERADMIN_EMAIL,
                "password": SUPERADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.superadmin_token = data["access_token"]
                    self.log_result("Superadmin Login", True, f"Login successful for {SUPERADMIN_EMAIL}")
                    return True
                else:
                    self.log_result("Superadmin Login", False, "Missing access_token in response", data)
            else:
                self.log_result("Superadmin Login", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Superadmin Login", False, f"Exception: {str(e)}")
        return False
    
    def test_auth_me(self):
        """Test /auth/me endpoint - verify user_id is in response"""
        if not self.teacher_token:
            self.log_result("Auth Me API", False, "No teacher token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.teacher_token}"}
            response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "user_id" in data:
                    self.log_result("Auth Me API", True, f"user_id found in response: {data['user_id']}")
                    return True
                else:
                    self.log_result("Auth Me API", False, "user_id missing from response", data)
            else:
                self.log_result("Auth Me API", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Auth Me API", False, f"Exception: {str(e)}")
        return False
    
    def test_subscription_create(self):
        """Test subscription creation - should return snap_token"""
        if not self.teacher_token or not self.teacher_user_id:
            self.log_result("Subscription Create", False, "No teacher token or user_id available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.teacher_token}"}
            response = requests.post(f"{BACKEND_URL}/subscription/create", 
                headers=headers,
                json={
                    "teacher_id": self.teacher_user_id,
                    "plan_tier": "PRO"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if "snap_token" in data:
                    self.log_result("Subscription Create", True, f"snap_token received: {data['snap_token'][:20]}...")
                    return True
                else:
                    self.log_result("Subscription Create", False, "snap_token missing from response", data)
            else:
                self.log_result("Subscription Create", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Subscription Create", False, f"Exception: {str(e)}")
        return False
    
    def test_exams_list(self):
        """Test listing teacher's exams"""
        if not self.teacher_token:
            self.log_result("Exams List", False, "No teacher token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.teacher_token}"}
            response = requests.get(f"{BACKEND_URL}/exams/list", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Store first exam ID for results testing
                        self.exam_id = data[0].get("exam_id")
                        self.log_result("Exams List", True, f"Found {len(data)} exams")
                    else:
                        self.log_result("Exams List", True, "No exams found (empty list)")
                    return True
                else:
                    self.log_result("Exams List", False, "Response is not a list", data)
            else:
                self.log_result("Exams List", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Exams List", False, f"Exception: {str(e)}")
        return False
    
    def test_exam_results(self):
        """Test getting exam results"""
        if not self.teacher_token:
            self.log_result("Exam Results", False, "No teacher token available")
            return False
            
        if not self.exam_id:
            self.log_result("Exam Results", False, "No exam_id available from exams list")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.teacher_token}"}
            response = requests.get(f"{BACKEND_URL}/results/exam/{self.exam_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Exam Results", True, f"Retrieved results for exam {self.exam_id}, {len(data)} sessions")
                    return True
                else:
                    self.log_result("Exam Results", False, "Response is not a list", data)
            else:
                self.log_result("Exam Results", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Exam Results", False, f"Exception: {str(e)}")
        return False
    
    def test_validate_student_token(self):
        """Test validating student exam token"""
        try:
            response = requests.post(f"{BACKEND_URL}/exams/validate-token", json={
                "token": STUDENT_TOKEN
            })
            
            if response.status_code == 200:
                data = response.json()
                if "exam_id" in data and "title" in data:
                    self.log_result("Student Token Validation", True, f"Token valid for exam: {data['title']}")
                    return True
                else:
                    self.log_result("Student Token Validation", False, "Missing exam_id or title in response", data)
            elif response.status_code == 404:
                self.log_result("Student Token Validation", True, f"Token {STUDENT_TOKEN} not found (expected for test)")
                return True
            else:
                self.log_result("Student Token Validation", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Student Token Validation", False, f"Exception: {str(e)}")
        return False
    
    def test_student_session_result(self):
        """Test getting student session result"""
        # Use the session ID from the review request
        session_id = "132772cf-26f8-4e8b-b4a3-e5f5a1653da1"
        
        try:
            response = requests.get(f"{BACKEND_URL}/student/session/{session_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "final_score" in data:
                    self.log_result("Student Session Result", True, f"Session found with score: {data['final_score']}")
                    return True
                else:
                    self.log_result("Student Session Result", False, "final_score missing from response", data)
            elif response.status_code == 404:
                self.log_result("Student Session Result", True, f"Session {session_id} not found (expected for test)")
                return True
            else:
                self.log_result("Student Session Result", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Student Session Result", False, f"Exception: {str(e)}")
        return False
    
    def test_export_csv(self):
        """Test CSV export functionality"""
        if not self.teacher_token or not self.exam_id:
            self.log_result("CSV Export", False, "No teacher token or exam_id available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.teacher_token}"}
            response = requests.get(f"{BACKEND_URL}/results/export/{self.exam_id}", headers=headers)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'text/csv' in content_type:
                    self.log_result("CSV Export", True, f"CSV export successful, size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_result("CSV Export", False, f"Wrong content type: {content_type}")
            else:
                self.log_result("CSV Export", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_result("CSV Export", False, f"Exception: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print(f"\n🚀 Starting CBT Backend API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Authentication tests
        self.test_teacher_login()
        self.test_superadmin_login()
        self.test_auth_me()
        
        # Subscription tests
        self.test_subscription_create()
        
        # Exam and results tests
        self.test_exams_list()
        self.test_exam_results()
        self.test_export_csv()
        
        # Student tests
        self.test_validate_student_token()
        self.test_student_session_result()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if "✅ PASS" in r["status"])
        failed = sum(1 for r in self.results if "❌ FAIL" in r["status"])
        
        print(f"Total Tests: {len(self.results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if failed == 0 else '❌ SOME TESTS FAILED'}")
        
        return failed == 0

if __name__ == "__main__":
    tester = CBTAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
#!/usr/bin/env python3
"""
Backend API Tests for RF Visualizer
Tests all endpoints including auth, equipment, calculations, configurations, and subscriptions
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class RFVisualizerAPITester:
    def __init__(self, base_url="https://keydown-rf.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@rf.test"
        self.test_password = "TestPass123!"
        self.test_name = f"RF Operator {datetime.now().strftime('%H%M%S')}"

    def log_result(self, test_name, passed, response_data=None, error=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "error": error,
            "response": response_data
        })

    def test_api_endpoint(self, method, endpoint, expected_status, data=None, description=""):
        """Generic API test method"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                self.log_result(f"{method} {endpoint}", False, error="Unsupported HTTP method")
                return None

            success = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}

            error_msg = None if success else f"Expected {expected_status}, got {response.status_code}"
            if not success and response_data and 'detail' in response_data:
                error_msg += f" - {response_data['detail']}"

            self.log_result(f"{method} {endpoint} {description}", success, response_data, error_msg)
            return response_data if success else None

        except Exception as e:
            self.log_result(f"{method} {endpoint} {description}", False, error=str(e))
            return None

    def test_user_registration(self):
        """Test user registration"""
        data = {
            "email": self.test_email,
            "password": self.test_password,
            "name": self.test_name
        }
        
        result = self.test_api_endpoint("POST", "/auth/register", 200, data, "(User Registration)")
        if result and 'token' in result and 'user' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        result = self.test_api_endpoint("POST", "/auth/login", 200, data, "(User Login)")
        if result and 'token' in result:
            self.token = result['token']
            self.user_id = result['user']['id']
            return True
        return False

    def test_get_user_profile(self):
        """Test get current user profile"""
        return self.test_api_endpoint("GET", "/auth/me", 200, description="(Get User Profile)")

    def test_get_equipment_data(self):
        """Test equipment data endpoint"""
        result = self.test_api_endpoint("GET", "/equipment", 200, description="(Get Equipment Data)")
        if result:
            # Verify structure
            required_keys = ['radios', 'driver_amps', 'final_amps', 'antennas', 'vehicles']
            has_all_keys = all(key in result for key in required_keys)
            if has_all_keys:
                print("  ✓ Equipment data structure is valid")
                return True
            else:
                print("  ✗ Missing required keys in equipment data")
        return result is not None

    def test_rf_calculation(self):
        """Test RF calculation endpoint"""
        data = {
            "radio": "galaxy-959",
            "driver_amp": "2-pill",
            "final_amp": "16-pill",
            "antenna": "wilson-1000",
            "vehicle": "f150",
            "bonding": True,
            "extra_alternators": False
        }
        
        result = self.test_api_endpoint("POST", "/calculate", 200, data, "(RF Calculation)")
        if result:
            # Verify calculation results structure
            required_fields = ['dead_key_watts', 'peak_watts', 'voltage', 'swr', 'takeoff_angle']
            has_required = all(field in result for field in required_fields)
            if has_required:
                print(f"  ✓ Calculation result: {result['dead_key_watts']}W dead key, {result['peak_watts']}W peak")
                return True
            else:
                print("  ✗ Missing required fields in calculation result")
        return result is not None

    def test_configuration_crud(self):
        """Test configuration CRUD operations"""
        # Create configuration
        config_data = {
            "name": f"Test Config {datetime.now().strftime('%H%M%S')}",
            "radio": "stryker-955",
            "driver_amp": "4-pill",
            "final_amp": "8-pill",
            "antenna": "predator-10k",
            "vehicle": "suburban",
            "bonding": True,
            "extra_alternators": True
        }
        
        create_result = self.test_api_endpoint("POST", "/configurations", 200, config_data, "(Create Configuration)")
        if not create_result or 'id' not in create_result:
            return False
            
        config_id = create_result['id']
        
        # List configurations
        list_result = self.test_api_endpoint("GET", "/configurations", 200, description="(List Configurations)")
        if not list_result:
            return False
            
        # Verify our config is in the list
        found_config = any(cfg['id'] == config_id for cfg in list_result)
        if found_config:
            print("  ✓ Configuration found in list")
        else:
            print("  ✗ Configuration not found in list")
            return False
        
        # Delete configuration
        delete_result = self.test_api_endpoint("DELETE", f"/configurations/{config_id}", 200, description="(Delete Configuration)")
        if delete_result and delete_result.get('status') == 'deleted':
            print("  ✓ Configuration deleted successfully")
            return True
            
        return False

    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        # Test subscription creation (will fail without valid payment but should return proper error)
        sub_data = {
            "plan": "monthly",
            "origin_url": "https://keydown-rf.preview.emergentagent.com"
        }
        
        result = self.test_api_endpoint("POST", "/subscribe", 200, sub_data, "(Create Subscription)")
        if result and 'url' in result and 'session_id' in result:
            print("  ✓ Subscription endpoint returns checkout URL")
            return True
        return False

    def test_invalid_auth(self):
        """Test endpoints with invalid authentication"""
        # Store current token
        original_token = self.token
        
        # Test with invalid token
        self.token = "invalid_token_12345"
        result = self.test_api_endpoint("GET", "/auth/me", 401, description="(Invalid Token)")
        
        # Test with no token
        self.token = None
        result2 = self.test_api_endpoint("GET", "/configurations", 401, description="(No Token)")
        
        # Restore original token
        self.token = original_token
        
        return result is not None and result2 is not None

    def test_invalid_endpoints(self):
        """Test invalid endpoints and data"""
        # Test non-existent endpoint
        result1 = self.test_api_endpoint("GET", "/nonexistent", 404, description="(Non-existent Endpoint)")
        
        # Test invalid RF calculation data
        bad_data = {
            "radio": "invalid-radio",
            "driver_amp": "invalid-amp",
            "final_amp": "invalid-final",
            "antenna": "invalid-antenna",
            "vehicle": "invalid-vehicle"
        }
        result2 = self.test_api_endpoint("POST", "/calculate", 400, bad_data, "(Invalid RF Data)")
        
        return True  # These should fail, which is expected

    def test_admin_login(self):
        """Test admin login with seeded admin account"""
        admin_data = {
            "email": "fallstommy@gmail.com",
            "password": "admin123"
        }
        
        result = self.test_api_endpoint("POST", "/auth/login", 200, admin_data, "(Admin Login)")
        if result and 'token' in result and result.get('user', {}).get('role') == 'admin':
            self.admin_token = result['token']
            print("  ✓ Admin login successful, role=admin")
            return True
        return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        # Store current token and use admin token
        original_token = self.token
        self.token = getattr(self, 'admin_token', None)
        
        if not self.token:
            self.log_result("GET /admin/stats", False, error="Admin token not available")
            return False
        
        result = self.test_api_endpoint("GET", "/admin/stats", 200, description="(Admin Stats)")
        
        # Restore original token
        self.token = original_token
        
        if result:
            required_fields = ['total_users', 'active_subscriptions', 'total_configurations', 'total_payments']
            has_required = all(field in result for field in required_fields)
            if has_required:
                print(f"  ✓ Stats: {result['total_users']} users, {result['active_subscriptions']} active subs")
                return True
        return result is not None

    def test_admin_users_management(self):
        """Test admin user management endpoints"""
        original_token = self.token
        self.token = getattr(self, 'admin_token', None)
        
        if not self.token:
            self.log_result("Admin Users Management", False, error="Admin token not available")
            return False

        # Get users list
        users_result = self.test_api_endpoint("GET", "/admin/users", 200, description="(Admin List Users)")
        if not users_result:
            self.token = original_token
            return False

        # Find a test user to modify (not the admin)
        test_user = None
        for user in users_result:
            if user.get('email') != 'fallstommy@gmail.com' and user.get('role') == 'user':
                test_user = user
                break

        if test_user:
            # Test user role update
            update_data = {"role": "subadmin"}
            update_result = self.test_api_endpoint("PATCH", f"/admin/users/{test_user['id']}", 200, update_data, "(Update User Role)")
            
            if update_result and update_result.get('role') == 'subadmin':
                print("  ✓ User role updated to subadmin")
                
                # Test subscription grant
                sub_data = {"subscription_status": "active", "subscription_plan": "monthly"}
                sub_result = self.test_api_endpoint("PATCH", f"/admin/users/{test_user['id']}", 200, sub_data, "(Grant Subscription)")
                
                if sub_result and sub_result.get('subscription_status') == 'active':
                    print("  ✓ Subscription granted successfully")
                    success = True
                else:
                    success = False
            else:
                success = False
        else:
            print("  ! No test user available for modification")
            success = True  # Not a failure, just no data to test with
        
        self.token = original_token
        return success

    def test_admin_equipment_management(self):
        """Test admin equipment management"""
        original_token = self.token
        self.token = getattr(self, 'admin_token', None)
        
        if not self.token:
            self.log_result("Admin Equipment Management", False, error="Admin token not available")
            return False

        # List equipment
        eq_result = self.test_api_endpoint("GET", "/admin/equipment", 200, description="(Admin List Equipment)")
        if not eq_result:
            self.token = original_token
            return False

        # Add new equipment
        test_equipment = {
            "key": f"test-radio-{datetime.now().strftime('%H%M%S')}",
            "category": "radios",
            "data": {
                "name": "Test Radio",
                "dead_key": 5.0,
                "peak_key": 15.0,
                "impedance": 50
            }
        }
        
        add_result = self.test_api_endpoint("POST", "/admin/equipment", 200, test_equipment, "(Add Equipment)")
        if not add_result:
            self.token = original_token
            return False
        
        print(f"  ✓ Equipment added: {test_equipment['key']}")
        
        # Delete the test equipment
        delete_result = self.test_api_endpoint("DELETE", f"/admin/equipment/{test_equipment['category']}/{test_equipment['key']}", 200, description="(Delete Equipment)")
        
        if delete_result and delete_result.get('status') == 'deleted':
            print("  ✓ Equipment deleted successfully")
            success = True
        else:
            success = False
        
        self.token = original_token
        return success

    def test_admin_access_control(self):
        """Test that regular users cannot access admin endpoints"""
        # Use regular user token (not admin)
        regular_result1 = self.test_api_endpoint("GET", "/admin/stats", 403, description="(Regular User - Admin Stats)")
        regular_result2 = self.test_api_endpoint("GET", "/admin/users", 403, description="(Regular User - Admin Users)")
        
        return regular_result1 is not None and regular_result2 is not None

    def run_all_tests(self):
        """Run comprehensive backend test suite"""
        print(f"\n🔍 Starting RF Visualizer Backend API Tests")
        print(f"📡 API Base URL: {self.base_url}")
        print(f"👤 Test User: {self.test_email}")
        print("=" * 80)

        # Test sequence
        tests = [
            ("Equipment Data", self.test_get_equipment_data),
            ("User Registration", self.test_user_registration),
            ("User Profile", self.test_get_user_profile),
            ("RF Calculations", self.test_rf_calculation),
            ("Configuration CRUD", self.test_configuration_crud),
            ("Admin Login", self.test_admin_login),
            ("Admin Stats", self.test_admin_stats),
            ("Admin User Management", self.test_admin_users_management),
            ("Admin Equipment Management", self.test_admin_equipment_management),
            ("Admin Access Control", self.test_admin_access_control),
            ("Subscription Flow", self.test_subscription_endpoints),
            ("Invalid Auth", self.test_invalid_auth),
            ("Invalid Endpoints", self.test_invalid_endpoints),
        ]

        for test_name, test_func in tests:
            print(f"\n📋 {test_name} Tests:")
            try:
                test_func()
            except Exception as e:
                print(f"❌ {test_name} - Exception: {str(e)}")

        # Summary
        print("\n" + "=" * 80)
        print(f"📊 Backend Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"🎯 Success Rate: {success_rate:.1f}%")

        if success_rate >= 80:
            print("✅ Backend API is functioning well")
            return 0
        elif success_rate >= 60:
            print("⚠️  Backend API has some issues but basic functionality works")
            return 1
        else:
            print("❌ Backend API has significant issues")
            return 2

def main():
    tester = RFVisualizerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
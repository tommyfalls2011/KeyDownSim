"""
Backend API tests for RF Visualizer - /api/calculate endpoint
Tests under-driven detection, RF calculations, and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRFCalculateEndpoint:
    """Tests for /api/calculate endpoint with under-driven detection"""
    
    def test_calculate_endpoint_exists(self):
        """Verify /api/calculate endpoint is accessible"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "none",
            "final_amp": "none",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /api/calculate endpoint accessible")

    def test_under_driven_with_weak_radio_strong_final(self):
        """Test under-driven detection: Cobra 29 (1W) + 2-pill driver + 16-pill final should be under-driven"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "2-pill",
            "final_amp": "16-pill",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify under_driven detection fields exist
        assert "under_driven" in data, "Response missing 'under_driven' field"
        assert "drive_ratio" in data, "Response missing 'drive_ratio' field"
        assert "drive_watts" in data, "Response missing 'drive_watts' field"
        assert "ideal_drive" in data, "Response missing 'ideal_drive' field"
        
        # Verify under-driven is True for this config
        assert data["under_driven"] == True, f"Expected under_driven=True, got {data['under_driven']}"
        assert data["drive_ratio"] < 0.6, f"Expected drive_ratio < 0.6, got {data['drive_ratio']}"
        
        print(f"✓ Under-driven detection working: under_driven={data['under_driven']}, drive_ratio={data['drive_ratio']}")
        print(f"  Drive: {data['drive_watts']}W / Need: {data['ideal_drive']}W")

    def test_not_under_driven_with_strong_radio_matched_final(self):
        """Test under-driven NOT showing: Stryker 955 + 4-pill driver + 4-pill final should NOT be under-driven"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "stryker-955",
            "driver_amp": "4-pill",
            "final_amp": "4-pill",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify under_driven is False for this config
        assert data["under_driven"] == False, f"Expected under_driven=False, got {data['under_driven']}"
        assert data["drive_ratio"] >= 0.6, f"Expected drive_ratio >= 0.6, got {data['drive_ratio']}"
        
        print(f"✓ Not under-driven detection working: under_driven={data['under_driven']}, drive_ratio={data['drive_ratio']}")
        print(f"  Drive: {data['drive_watts']}W / Need: {data['ideal_drive']}W")

    def test_no_final_amp_no_under_driven(self):
        """Test that with no final amp, under_driven should be False"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "2-pill",
            "final_amp": "none",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["under_driven"] == False, f"With no final amp, under_driven should be False"
        print("✓ No final amp = not under-driven")

    def test_takeoff_angle_returned(self):
        """Test that takeoff_angle is returned in calculate response"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "none",
            "final_amp": "none",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "takeoff_angle" in data, "Response missing 'takeoff_angle' field"
        assert isinstance(data["takeoff_angle"], (int, float)), "takeoff_angle should be numeric"
        assert 0 <= data["takeoff_angle"] <= 90, f"takeoff_angle should be between 0-90, got {data['takeoff_angle']}"
        
        print(f"✓ Take-off angle returned: {data['takeoff_angle']}°")

    def test_takeoff_angle_penalty_without_bonding(self):
        """Test that takeoff_angle increases without bonding"""
        # With bonding
        response_bonded = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "none",
            "final_amp": "none",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True
        })
        
        # Without bonding
        response_unbonded = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "cobra-29",
            "driver_amp": "none",
            "final_amp": "none",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": False
        })
        
        assert response_bonded.status_code == 200
        assert response_unbonded.status_code == 200
        
        bonded_angle = response_bonded.json()["takeoff_angle"]
        unbonded_angle = response_unbonded.json()["takeoff_angle"]
        
        assert unbonded_angle > bonded_angle, f"Unbonded angle ({unbonded_angle}°) should be higher than bonded ({bonded_angle}°)"
        
        print(f"✓ Bonding penalty working: bonded={bonded_angle}°, unbonded={unbonded_angle}°")

    def test_all_rf_calc_fields_present(self):
        """Test that all expected RF calculation fields are present"""
        response = requests.post(f"{BASE_URL}/api/calculate", json={
            "radio": "stryker-955",
            "driver_amp": "4-pill",
            "final_amp": "8-pill",
            "antenna": "wilson-1000",
            "vehicle": "f150",
            "bonding": True,
            "alternator_count": 2,
            "alternator_amps": 200,
            "battery_type": "agm",
            "battery_count": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            "dead_key_watts", "peak_watts", "voltage", "voltage_drop",
            "overloaded", "current_draw", "swr", "takeoff_angle",
            "ground_plane_quality", "directional_bias",
            "under_driven", "drive_ratio", "drive_watts", "ideal_drive"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ All {len(required_fields)} required fields present in response")


class TestEquipmentEndpoint:
    """Tests for /api/equipment endpoint"""
    
    def test_equipment_endpoint(self):
        """Verify /api/equipment returns all equipment categories"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        expected_categories = ["radios", "driver_amps", "final_amps", "antennas", "vehicles"]
        for cat in expected_categories:
            assert cat in data, f"Missing category: {cat}"
        
        print(f"✓ Equipment endpoint returns all categories")


class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_login_success(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "fallstommy@gmail.com",
            "password": "admin123"
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        
        print("✓ Admin login successful")

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

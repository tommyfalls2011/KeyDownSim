"""
Test Equipment Sync Feature
Tests that all equipment items from backend defaults are properly synced to MongoDB
and accessible via API endpoints.

Issue being tested: Combo amplifiers (2x4 Combo, 2x6 Combo) were visible in main simulation
dropdown but missing from Admin equipment management page. The fix involved syncing all 
equipment definitions from backend defaults into MongoDB equipment collection on startup.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://radpat-demo.preview.emergentagent.com')

class TestEquipmentAPI:
    """Test /api/equipment endpoint returns all equipment items"""
    
    def test_equipment_endpoint_returns_data(self):
        """Test that equipment endpoint returns valid response"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        assert "radios" in data
        assert "driver_amps" in data
        assert "final_amps" in data
        assert "antennas" in data
        assert "vehicles" in data
        print("PASS: Equipment endpoint returns all categories")
    
    def test_driver_amps_includes_combo_amps(self):
        """Test that driver_amps includes 2x4 and 2x6 combo amps - the main bug fix"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        driver_amps = data.get("driver_amps", {})
        
        # Verify 2x4 Combo exists with correct specs
        assert "2x4" in driver_amps, "2x4 Combo missing from driver_amps"
        amp_2x4 = driver_amps["2x4"]
        assert amp_2x4["gain_db"] == 20, f"2x4 gain_db should be 20, got {amp_2x4.get('gain_db')}"
        assert amp_2x4["transistors"] == 6, f"2x4 transistors should be 6, got {amp_2x4.get('transistors')}"
        assert amp_2x4["current_draw"] == 130, f"2x4 current_draw should be 130, got {amp_2x4.get('current_draw')}"
        print("PASS: 2x4 Combo present with correct specs (gain_db:20, transistors:6, current_draw:130)")
        
        # Verify 2x6 Combo exists with correct specs
        assert "2x6" in driver_amps, "2x6 Combo missing from driver_amps"
        amp_2x6 = driver_amps["2x6"]
        assert amp_2x6["gain_db"] == 21, f"2x6 gain_db should be 21, got {amp_2x6.get('gain_db')}"
        assert amp_2x6["transistors"] == 8, f"2x6 transistors should be 8, got {amp_2x6.get('transistors')}"
        assert amp_2x6["current_draw"] == 180, f"2x6 current_draw should be 180, got {amp_2x6.get('current_draw')}"
        print("PASS: 2x6 Combo present with correct specs (gain_db:21, transistors:8, current_draw:180)")
    
    def test_all_driver_amps_present(self):
        """Test that all 7 driver amps are returned"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        driver_amps = data.get("driver_amps", {})
        expected_keys = ["none", "1-pill", "2-pill", "3-pill", "4-pill", "2x4", "2x6"]
        
        for key in expected_keys:
            assert key in driver_amps, f"Driver amp '{key}' missing"
        
        print(f"PASS: All {len(expected_keys)} driver amps present: {list(driver_amps.keys())}")
    
    def test_final_amps_includes_all_items(self):
        """Test that final_amps includes 2-pill, 24-pill, 32-pill"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        final_amps = data.get("final_amps", {})
        expected_keys = ["none", "2-pill", "4-pill", "8-pill", "16-pill", "24-pill", "32-pill"]
        
        for key in expected_keys:
            assert key in final_amps, f"Final amp '{key}' missing"
        
        print(f"PASS: All {len(expected_keys)} final amps present: {list(final_amps.keys())}")
    
    def test_antennas_includes_all_items(self):
        """Test that antennas includes predator-k2-*, predator-comp-*, fight-stix-*"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        antennas = data.get("antennas", {})
        
        # Check predator k2 series
        assert "predator-k2-12" in antennas, "predator-k2-12 missing"
        assert "predator-k2-17" in antennas, "predator-k2-17 missing"
        
        # Check predator comp series
        assert "predator-comp-9" in antennas, "predator-comp-9 missing"
        assert "predator-comp-12" in antennas, "predator-comp-12 missing"
        assert "predator-comp-17" in antennas, "predator-comp-17 missing"
        assert "predator-comp-22" in antennas, "predator-comp-22 missing"
        
        # Check fight stix series
        assert "fight-stix-6" in antennas, "fight-stix-6 missing"
        assert "fight-stix-12" in antennas, "fight-stix-12 missing"
        
        print(f"PASS: All expected antennas present. Total: {len(antennas)}")
    
    def test_vehicles_includes_all_items(self):
        """Test that vehicles includes all 13 items"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        vehicles = data.get("vehicles", {})
        expected_keys = [
            "jeep", "shootout", "silverado-rcsb", "c10", "suburban", "wagon",
            "silverado-3500", "f150", "f350", "ram", "ram-3500", "van", "semi"
        ]
        
        for key in expected_keys:
            assert key in vehicles, f"Vehicle '{key}' missing"
        
        assert len(vehicles) >= 13, f"Expected at least 13 vehicles, got {len(vehicles)}"
        print(f"PASS: All {len(expected_keys)} expected vehicles present. Total: {len(vehicles)}")
    
    def test_radio_specs_match_frontend(self):
        """Test that radio specs match frontend rfEngine.js (cobra-29 dead_key=0.75, peak_key=25)"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        data = response.json()
        
        radios = data.get("radios", {})
        
        # Verify cobra-29 specs
        assert "cobra-29" in radios, "cobra-29 missing"
        cobra29 = radios["cobra-29"]
        assert cobra29["dead_key"] == 0.75, f"cobra-29 dead_key should be 0.75, got {cobra29.get('dead_key')}"
        assert cobra29["peak_key"] == 25, f"cobra-29 peak_key should be 25, got {cobra29.get('peak_key')}"
        assert cobra29["type"] == "AM", f"cobra-29 type should be AM, got {cobra29.get('type')}"
        
        print("PASS: cobra-29 specs match frontend (dead_key=0.75, peak_key=25, type=AM)")


class TestAdminEquipment:
    """Test admin equipment endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "fallstommy@gmail.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "fallstommy@gmail.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        print("PASS: Admin login successful")
    
    def test_admin_equipment_returns_52_items(self, admin_token):
        """Test that admin equipment endpoint returns all 52 items"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/equipment", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 52, f"Expected 52 equipment items, got {len(data)}"
        print(f"PASS: Admin equipment returns {len(data)} items (expected 52)")
    
    def test_admin_equipment_includes_combo_amps(self, admin_token):
        """Test that admin equipment list includes 2x4 and 2x6 combo amps"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/equipment", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Find combo amps in the list
        driver_amps = [item for item in data if item.get("category") == "driver_amps"]
        driver_amp_keys = [item.get("key") for item in driver_amps]
        
        assert "2x4" in driver_amp_keys, "2x4 Combo missing from admin equipment"
        assert "2x6" in driver_amp_keys, "2x6 Combo missing from admin equipment"
        
        # Verify specs
        amp_2x4 = next((item for item in driver_amps if item.get("key") == "2x4"), None)
        assert amp_2x4 is not None
        assert amp_2x4["data"]["gain_db"] == 20
        assert amp_2x4["data"]["transistors"] == 6
        
        amp_2x6 = next((item for item in driver_amps if item.get("key") == "2x6"), None)
        assert amp_2x6 is not None
        assert amp_2x6["data"]["gain_db"] == 21
        assert amp_2x6["data"]["transistors"] == 8
        
        print("PASS: Admin equipment includes 2x4 and 2x6 combo amps with correct specs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

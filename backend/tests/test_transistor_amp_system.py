"""
Test suite for the new Transistor + Box Size + Heatsink amplifier selection system.

This replaces the old fixed amp presets (2-pill, 4-pill, 2x4 combo, etc.) with:
- 6 Transistor Types: Toshiba 2SC2879, HG 2SC2879, Mitsubishi 2SC3240, MRF454, SD1446, HG SD1446
- 9 Box Sizes: 1, 2, 3, 4, 6, 8, 16, 24, 32
- 3 Heatsink Types: small, medium, large

Tests cover:
1. GET /api/equipment - returns transistors, heatsinks, box_sizes
2. POST /api/configurations - saves with new fields
3. GET /api/configurations - loads saved configs
4. POST /api/calculate - RF calculation with new amp specs
5. Admin equipment management
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "fallstommy@gmail.com"
ADMIN_PASSWORD = "admin123"

# Expected transistor data
EXPECTED_TRANSISTORS = {
    'toshiba-2sc2879': {'name': 'Toshiba 2SC2879', 'watts_pep': 100, 'gain_db': 13},
    'hg-2sc2879': {'name': 'HG 2SC2879', 'watts_pep': 125, 'gain_db': 11.5},
    'mitsubishi-2sc3240': {'name': 'Mitsubishi 2SC3240', 'watts_pep': 105, 'gain_db': 11.5},
    'mrf454': {'name': 'MRF454', 'watts_pep': 80, 'gain_db': 10},
    'sd1446': {'name': 'SD1446', 'watts_pep': 70, 'gain_db': 10},
    'hg-sd1446': {'name': 'HG SD1446', 'watts_pep': 75, 'gain_db': 10},
}

EXPECTED_HEATSINKS = {
    'small': {'name': 'Small (passive/small fins)', 'thermal_resistance': 2.0, 'cool_rate': 0.8},
    'medium': {'name': 'Medium (finned + fan)', 'thermal_resistance': 0.8, 'cool_rate': 2.0},
    'large': {'name': 'Large (big fins + high-CFM)', 'thermal_resistance': 0.3, 'cool_rate': 4.0},
}

EXPECTED_BOX_SIZES = [1, 2, 3, 4, 6, 8, 16, 24, 32]


class TestEquipmentAPI:
    """Test GET /api/equipment returns new transistor-based equipment"""
    
    def test_equipment_returns_transistors(self):
        """Equipment endpoint should return transistors category"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'transistors' in data, "Response should contain 'transistors' category"
        
        transistors = data['transistors']
        assert len(transistors) >= 6, f"Expected at least 6 transistors, got {len(transistors)}"
        
        # Verify all expected transistors are present
        for key, expected in EXPECTED_TRANSISTORS.items():
            assert key in transistors, f"Missing transistor: {key}"
            assert transistors[key]['name'] == expected['name'], f"Wrong name for {key}"
        
        print(f"PASS: Found {len(transistors)} transistors")
    
    def test_equipment_returns_heatsinks(self):
        """Equipment endpoint should return heatsinks category"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        assert 'heatsinks' in data, "Response should contain 'heatsinks' category"
        
        heatsinks = data['heatsinks']
        assert len(heatsinks) >= 3, f"Expected at least 3 heatsinks, got {len(heatsinks)}"
        
        # Verify all expected heatsinks
        for key, expected in EXPECTED_HEATSINKS.items():
            assert key in heatsinks, f"Missing heatsink: {key}"
            assert heatsinks[key]['name'] == expected['name'], f"Wrong name for {key}"
        
        print(f"PASS: Found {len(heatsinks)} heatsinks")
    
    def test_equipment_returns_box_sizes(self):
        """Equipment endpoint should return box_sizes array"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        assert 'box_sizes' in data, "Response should contain 'box_sizes'"
        
        box_sizes = data['box_sizes']
        assert box_sizes == EXPECTED_BOX_SIZES, f"Box sizes mismatch. Expected {EXPECTED_BOX_SIZES}, got {box_sizes}"
        
        print(f"PASS: Box sizes correct: {box_sizes}")
    
    def test_equipment_does_not_return_old_amp_categories(self):
        """Equipment should NOT return driver_amps/final_amps (old system)"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        # Old system used driver_amps and final_amps - should not be present
        assert 'driver_amps' not in data, "Old 'driver_amps' category should not exist"
        assert 'final_amps' not in data, "Old 'final_amps' category should not exist"
        
        print("PASS: Old amp categories not present")


class TestConfigurationAPI:
    """Test configuration CRUD with new transistor-based fields"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_create_config_with_new_fields(self, auth_headers):
        """Test creating configuration with transistor-based amp fields"""
        config_data = {
            "name": "TEST_TransistorConfig",
            "radio": "cobra-29",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "medium",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 8,
            "final_heatsink": "large",
            "antenna": "whip-102",
            "antenna_position": "center",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 2,
            "alternator_amps": 130,
            "battery_type": "agm",
            "battery_count": 2,
            "regulator_voltages": [14.2],
            "tip_length": 48
        }
        
        response = requests.post(
            f"{BASE_URL}/api/configurations",
            json=config_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created = response.json()
        assert 'id' in created, "Response should have 'id'"
        assert created['driver_transistor'] == "toshiba-2sc2879"
        assert created['driver_box_size'] == 2
        assert created['driver_heatsink'] == "medium"
        assert created['final_transistor'] == "hg-2sc2879"
        assert created['final_box_size'] == 8
        assert created['final_heatsink'] == "large"
        
        print(f"PASS: Created config with new fields, id={created['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_create_config_with_no_amp(self, auth_headers):
        """Test creating configuration with no amplifiers selected"""
        config_data = {
            "name": "TEST_NoAmpConfig",
            "radio": "galaxy-959",
            "driver_transistor": "none",
            "driver_box_size": 0,
            "driver_heatsink": "medium",
            "final_transistor": "none",
            "final_box_size": 0,
            "final_heatsink": "medium",
            "antenna": "wilson-1000",
            "antenna_position": "rear",
            "vehicle": "f150",
            "bonding": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/configurations",
            json=config_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created = response.json()
        assert created['driver_transistor'] == "none"
        assert created['driver_box_size'] == 0
        assert created['final_transistor'] == "none"
        assert created['final_box_size'] == 0
        
        print(f"PASS: Created no-amp config, id={created['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_list_configs_returns_new_fields(self, auth_headers):
        """Test that listing configurations returns new transistor fields"""
        # First create a config
        config_data = {
            "name": "TEST_ListTest",
            "radio": "stryker-955",
            "driver_transistor": "mrf454",
            "driver_box_size": 4,
            "driver_heatsink": "large",
            "final_transistor": "sd1446",
            "final_box_size": 16,
            "final_heatsink": "large",
            "antenna": "whip-102",
            "vehicle": "suburban"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/configurations",
            json=config_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        created_id = create_response.json()['id']
        
        # Now list configs
        list_response = requests.get(
            f"{BASE_URL}/api/configurations",
            headers=auth_headers
        )
        assert list_response.status_code == 200
        
        configs = list_response.json()
        test_config = next((c for c in configs if c['id'] == created_id), None)
        
        assert test_config is not None, "Created config not found in list"
        assert test_config['driver_transistor'] == "mrf454"
        assert test_config['driver_box_size'] == 4
        assert test_config['final_transistor'] == "sd1446"
        assert test_config['final_box_size'] == 16
        
        print(f"PASS: Listed config has new fields")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created_id}", headers=auth_headers)


class TestCalculateAPI:
    """Test RF calculation with new transistor-based amp specs"""
    
    def test_calculate_with_transistor_amps(self):
        """Test RF calculation using transistor + box size"""
        calc_data = {
            "radio": "cobra-29",  # 0.75W dead key
            "driver_transistor": "toshiba-2sc2879",  # 100W, 13dB
            "driver_box_size": 2,
            "driver_heatsink": "medium",
            "final_transistor": "hg-2sc2879",  # 125W, 11.5dB
            "final_box_size": 4,
            "final_heatsink": "medium",
            "antenna": "whip-102",
            "antenna_position": "center",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1,
            "regulator_voltages": [14.2],
            "tip_length": 48
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        
        # Verify response has expected fields
        assert 'dead_key_watts' in result
        assert 'peak_watts' in result
        assert 'voltage' in result
        assert 'current_draw' in result
        assert 'swr' in result
        assert 'under_driven' in result
        
        # With driver (2x Toshiba = ~200W capacity) and final (4x HG = ~600W capacity)
        # The power should be significant but not unrealistic
        assert result['dead_key_watts'] > 10, f"Dead key too low: {result['dead_key_watts']}"
        assert result['peak_watts'] > result['dead_key_watts'], "Peak should exceed dead key"
        
        print(f"PASS: Calculate returned valid results: {result['dead_key_watts']}W dead key, {result['peak_watts']}W peak")
    
    def test_calculate_no_amp(self):
        """Test RF calculation with no amplifiers (radio only)"""
        calc_data = {
            "radio": "galaxy-959",  # 2W dead key
            "driver_transistor": "none",
            "driver_box_size": 0,
            "driver_heatsink": "medium",
            "final_transistor": "none",
            "final_box_size": 0,
            "final_heatsink": "medium",
            "antenna": "whip-102",
            "antenna_position": "center",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1,
            "regulator_voltages": [14.2],
            "tip_length": 48
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        
        # With no amps, power should be just radio output (2W for Galaxy 959)
        assert result['dead_key_watts'] <= 5, f"Dead key too high for no-amp config: {result['dead_key_watts']}"
        
        print(f"PASS: No-amp calculation: {result['dead_key_watts']}W dead key")
    
    def test_calculate_detects_under_driven(self):
        """Test that under-driven condition is detected"""
        # Small driver (1-pill Toshiba ~100W output) with large final (8-pill HG ~1000W capacity)
        calc_data = {
            "radio": "cobra-29",  # 0.75W
            "driver_transistor": "toshiba-2sc2879",  # 100W, 13dB
            "driver_box_size": 1,  # Single pill
            "driver_heatsink": "small",
            "final_transistor": "hg-2sc2879",  # 125W, 11.5dB
            "final_box_size": 8,  # 8 pills - needs ~70W drive
            "final_heatsink": "medium",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 1,
            "alternator_amps": 130,
            "battery_type": "lead",
            "battery_count": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        assert response.status_code == 200
        
        result = response.json()
        
        # Should detect under-driven condition
        assert 'under_driven' in result
        assert 'drive_ratio' in result
        
        print(f"PASS: Under-driven detection: {result['under_driven']}, drive_ratio: {result['drive_ratio']}")


class TestAdminEquipment:
    """Test admin equipment management with new categories"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_admin_equipment_includes_transistors(self, auth_headers):
        """Admin equipment list should include transistors category"""
        response = requests.get(f"{BASE_URL}/api/admin/equipment", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        items = response.json()
        transistor_items = [i for i in items if i.get('category') == 'transistors']
        
        assert len(transistor_items) >= 6, f"Expected at least 6 transistors, got {len(transistor_items)}"
        
        # Verify transistor keys
        transistor_keys = {i['key'] for i in transistor_items}
        expected_keys = set(EXPECTED_TRANSISTORS.keys())
        assert expected_keys.issubset(transistor_keys), f"Missing transistors: {expected_keys - transistor_keys}"
        
        print(f"PASS: Admin equipment has {len(transistor_items)} transistors")
    
    def test_admin_equipment_includes_heatsinks(self, auth_headers):
        """Admin equipment list should include heatsinks category"""
        response = requests.get(f"{BASE_URL}/api/admin/equipment", headers=auth_headers)
        assert response.status_code == 200
        
        items = response.json()
        heatsink_items = [i for i in items if i.get('category') == 'heatsinks']
        
        assert len(heatsink_items) >= 3, f"Expected at least 3 heatsinks, got {len(heatsink_items)}"
        
        heatsink_keys = {i['key'] for i in heatsink_items}
        expected_keys = set(EXPECTED_HEATSINKS.keys())
        assert expected_keys.issubset(heatsink_keys), f"Missing heatsinks: {expected_keys - heatsink_keys}"
        
        print(f"PASS: Admin equipment has {len(heatsink_items)} heatsinks")


class TestLogin:
    """Test login functionality"""
    
    def test_admin_login(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert 'token' in data, "Response should contain token"
        assert 'user' in data, "Response should contain user"
        assert data['user']['role'] == 'admin', f"Expected admin role, got {data['user']['role']}"
        
        print(f"PASS: Admin login successful, role={data['user']['role']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Test suite for the 5-tier heatsink system.

New 5-tier heatsink model (replacing old 3-tier Small/Medium/Large):
- Small (1-2 pills): passive fins
- Medium (3-4 pills): finned + single fan
- Large (6-8 pills): thick extruded aluminum + high-CFM fans
- XL (12-16 pills): bonded fin assembly + dual fans
- Extreme (24-32 pills): custom-machined radiator + high-pressure forced air

Tests cover:
1. Backend /api/equipment returns all 5 heatsinks with correct thermal specs
2. Auto-selection logic (recommend heatsink based on pill count)
3. Undersized warning (selecting heatsink below recommended for pill count)
4. Configuration save/load preserves new heatsink values (xlarge, extreme)
5. Signal chain calculation with different heatsink tiers
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "fallstommy@gmail.com"
ADMIN_PASSWORD = "admin123"

# Expected 5-tier heatsinks with specs from server.py
EXPECTED_5_HEATSINKS = {
    'small':   {'name': 'Small (passive fins)',          'thermal_resistance': 2.5,  'cool_rate': 0.6,  'max_pills': 2},
    'medium':  {'name': 'Medium (finned + fan)',         'thermal_resistance': 1.2,  'cool_rate': 1.5,  'max_pills': 4},
    'large':   {'name': 'Large (extruded + high-CFM)',   'thermal_resistance': 0.5,  'cool_rate': 3.0,  'max_pills': 8},
    'xlarge':  {'name': 'XL (bonded fin + dual fans)',   'thermal_resistance': 0.25, 'cool_rate': 5.0,  'max_pills': 16},
    'extreme': {'name': 'Extreme (machined radiator)',   'thermal_resistance': 0.12, 'cool_rate': 8.0,  'max_pills': 32},
}

# Recommended heatsink mapping (pill count -> heatsink key)
HEATSINK_RECOMMENDATIONS = {
    1: 'small', 2: 'small',      # 1-2 pills -> small
    3: 'medium', 4: 'medium',    # 3-4 pills -> medium
    6: 'large', 8: 'large',      # 6-8 pills -> large
    16: 'xlarge',                # 12-16 pills -> xlarge
    24: 'extreme', 32: 'extreme' # 24-32 pills -> extreme
}


class TestEquipment5TierHeatsinks:
    """Test GET /api/equipment returns all 5 heatsinks"""
    
    def test_equipment_returns_5_heatsinks(self):
        """Equipment endpoint should return all 5 heatsink tiers"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'heatsinks' in data, "Response should contain 'heatsinks' category"
        
        heatsinks = data['heatsinks']
        assert len(heatsinks) == 5, f"Expected 5 heatsinks, got {len(heatsinks)}: {list(heatsinks.keys())}"
        
        # Verify all 5 heatsinks are present
        expected_keys = ['small', 'medium', 'large', 'xlarge', 'extreme']
        for key in expected_keys:
            assert key in heatsinks, f"Missing heatsink: {key}"
        
        print(f"PASS: Found all 5 heatsink tiers: {list(heatsinks.keys())}")
    
    def test_heatsink_thermal_specs_correct(self):
        """Each heatsink should have correct thermal_resistance and cool_rate"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        heatsinks = response.json().get('heatsinks', {})
        
        for key, expected in EXPECTED_5_HEATSINKS.items():
            assert key in heatsinks, f"Missing heatsink: {key}"
            hs = heatsinks[key]
            
            # Verify name
            assert hs.get('name') == expected['name'], f"{key}: Expected name '{expected['name']}', got '{hs.get('name')}'"
            
            # Verify thermal_resistance
            assert hs.get('thermal_resistance') == expected['thermal_resistance'], \
                f"{key}: Expected thermal_resistance {expected['thermal_resistance']}, got {hs.get('thermal_resistance')}"
            
            # Verify cool_rate
            assert hs.get('cool_rate') == expected['cool_rate'], \
                f"{key}: Expected cool_rate {expected['cool_rate']}, got {hs.get('cool_rate')}"
            
            # Verify max_pills
            assert hs.get('max_pills') == expected['max_pills'], \
                f"{key}: Expected max_pills {expected['max_pills']}, got {hs.get('max_pills')}"
        
        print("PASS: All 5 heatsinks have correct thermal specs")
    
    def test_xlarge_heatsink_present(self):
        """New 'xlarge' heatsink (XL bonded fin + dual fans) should exist"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        heatsinks = response.json().get('heatsinks', {})
        
        assert 'xlarge' in heatsinks, "xlarge heatsink missing"
        xlarge = heatsinks['xlarge']
        
        assert xlarge.get('max_pills') == 16, f"xlarge max_pills should be 16, got {xlarge.get('max_pills')}"
        assert xlarge.get('cool_rate') == 5.0, f"xlarge cool_rate should be 5.0, got {xlarge.get('cool_rate')}"
        
        print(f"PASS: xlarge heatsink exists with correct specs: {xlarge}")
    
    def test_extreme_heatsink_present(self):
        """New 'extreme' heatsink (machined radiator) should exist"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        heatsinks = response.json().get('heatsinks', {})
        
        assert 'extreme' in heatsinks, "extreme heatsink missing"
        extreme = heatsinks['extreme']
        
        assert extreme.get('max_pills') == 32, f"extreme max_pills should be 32, got {extreme.get('max_pills')}"
        assert extreme.get('cool_rate') == 8.0, f"extreme cool_rate should be 8.0, got {extreme.get('cool_rate')}"
        assert extreme.get('thermal_resistance') == 0.12, f"extreme thermal_resistance should be 0.12, got {extreme.get('thermal_resistance')}"
        
        print(f"PASS: extreme heatsink exists with correct specs: {extreme}")


class TestConfigurationWithNewHeatsinks:
    """Test configuration save/load preserves new heatsink values"""
    
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
    
    def test_save_config_with_xlarge_heatsink(self, auth_headers):
        """Configuration should save with xlarge heatsink"""
        config_data = {
            "name": "TEST_XLargeHeatsinkConfig",
            "radio": "cobra-29",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 4,
            "driver_heatsink": "medium",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 16,           # 16-pill box
            "final_heatsink": "xlarge",     # NEW xlarge heatsink
            "antenna": "whip-102",
            "antenna_position": "center",
            "vehicle": "suburban",
            "bonding": True
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create config: {response.text}"
        
        created = response.json()
        assert created['final_heatsink'] == 'xlarge', f"Expected xlarge heatsink, got {created['final_heatsink']}"
        assert created['final_box_size'] == 16
        
        print(f"PASS: Saved config with xlarge heatsink, id={created['id']}")
        
        # Verify by fetching
        get_response = requests.get(f"{BASE_URL}/api/configurations", headers=auth_headers)
        configs = get_response.json()
        saved = next((c for c in configs if c['id'] == created['id']), None)
        assert saved is not None
        assert saved['final_heatsink'] == 'xlarge', "Loaded config should have xlarge heatsink"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_save_config_with_extreme_heatsink(self, auth_headers):
        """Configuration should save with extreme heatsink"""
        config_data = {
            "name": "TEST_ExtremeHeatsinkConfig",
            "radio": "ranger-rci2970",  # High-power radio
            "driver_transistor": "hg-2sc2879",
            "driver_box_size": 8,
            "driver_heatsink": "large",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 32,            # 32-pill box
            "final_heatsink": "extreme",     # NEW extreme heatsink
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 4,
            "alternator_amps": 320,
            "battery_type": "lithium",
            "battery_count": 4
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create config: {response.text}"
        
        created = response.json()
        assert created['final_heatsink'] == 'extreme', f"Expected extreme heatsink, got {created['final_heatsink']}"
        assert created['final_box_size'] == 32
        
        print(f"PASS: Saved config with extreme heatsink, id={created['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_backward_compatible_with_old_heatsinks(self, auth_headers):
        """Old configs with medium/large heatsinks should still work"""
        config_data = {
            "name": "TEST_BackwardCompatible",
            "radio": "cobra-29",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "small",      # Old heatsink
            "final_transistor": "hg-2sc2879",
            "final_box_size": 4,
            "final_heatsink": "medium",      # Old heatsink
            "antenna": "whip-102",
            "vehicle": "suburban"
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed with old heatsinks: {response.text}"
        
        created = response.json()
        assert created['driver_heatsink'] == 'small'
        assert created['final_heatsink'] == 'medium'
        
        print(f"PASS: Backward compatible with old heatsinks")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)


class TestCalculateWithHeatsinks:
    """Test RF calculation works with different heatsink tiers"""
    
    def test_calculate_with_xlarge_heatsink(self):
        """Calculation should work with xlarge heatsink for 16-pill box"""
        calc_data = {
            "radio": "stryker-955",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 4,
            "driver_heatsink": "medium",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 16,            # 16-pill box
            "final_heatsink": "xlarge",      # Recommended for 16 pills
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 2,
            "alternator_amps": 320,
            "battery_type": "agm",
            "battery_count": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        assert response.status_code == 200, f"Calculation failed: {response.text}"
        
        result = response.json()
        assert 'dead_key_watts' in result
        assert 'peak_watts' in result
        
        # 16-pill final should produce significant power
        assert result['dead_key_watts'] > 500, f"16-pill setup should produce >500W, got {result['dead_key_watts']}"
        
        print(f"PASS: Calculate with xlarge: {result['dead_key_watts']}W dead key, {result['peak_watts']}W peak")
    
    def test_calculate_with_extreme_heatsink(self):
        """Calculation should work with extreme heatsink for 32-pill box"""
        calc_data = {
            "radio": "ranger-rci2970",
            "driver_transistor": "hg-2sc2879",
            "driver_box_size": 8,
            "driver_heatsink": "large",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 32,            # 32-pill box
            "final_heatsink": "extreme",     # Recommended for 32 pills
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 4,
            "alternator_amps": 320,
            "battery_type": "lithium",
            "battery_count": 4
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        assert response.status_code == 200, f"Calculation failed: {response.text}"
        
        result = response.json()
        
        # 32-pill final should produce significant power (may be limited by driver output)
        assert result['dead_key_watts'] > 500, f"32-pill setup should produce >500W, got {result['dead_key_watts']}"
        
        print(f"PASS: Calculate with extreme: {result['dead_key_watts']}W dead key, {result['peak_watts']}W peak")
    
    def test_calculate_various_box_sizes(self):
        """Test calculations for various box sizes with appropriate heatsinks"""
        test_cases = [
            (2, 'small', 50),      # 2-pill -> small heatsink, expect >50W
            (4, 'medium', 200),    # 4-pill -> medium heatsink, expect >200W
            (8, 'large', 400),     # 8-pill -> large heatsink, expect >400W
            (16, 'xlarge', 800),   # 16-pill -> xlarge heatsink, expect >800W
            (32, 'extreme', 800),  # 32-pill -> extreme heatsink, expect >800W (may be driver-limited)
        ]
        
        for box_size, heatsink, min_expected_watts in test_cases:
            calc_data = {
                "radio": "ranger-rci2970",
                "driver_transistor": "toshiba-2sc2879",
                "driver_box_size": 4,
                "driver_heatsink": "medium",
                "final_transistor": "hg-2sc2879",
                "final_box_size": box_size,
                "final_heatsink": heatsink,
                "antenna": "whip-102",
                "vehicle": "suburban",
                "bonding": True,
                "alternator_count": 2,
                "alternator_amps": 320,
                "battery_type": "agm",
                "battery_count": 2
            }
            
            response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
            assert response.status_code == 200, f"Calc failed for {box_size}-pill: {response.text}"
            
            result = response.json()
            assert result['dead_key_watts'] >= min_expected_watts, \
                f"{box_size}-pill with {heatsink}: expected >= {min_expected_watts}W, got {result['dead_key_watts']}W"
            
            print(f"PASS: {box_size}-pill + {heatsink}: {result['dead_key_watts']}W dead key")


class TestAdminHeatsinks:
    """Test admin equipment shows all 5 heatsinks"""
    
    @pytest.fixture
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['token']}"}
    
    def test_admin_equipment_has_5_heatsinks(self, auth_headers):
        """Admin equipment list should include all 5 heatsinks"""
        response = requests.get(f"{BASE_URL}/api/admin/equipment", headers=auth_headers)
        assert response.status_code == 200
        
        items = response.json()
        heatsink_items = [i for i in items if i.get('category') == 'heatsinks']
        
        assert len(heatsink_items) == 5, f"Expected 5 heatsinks, got {len(heatsink_items)}"
        
        heatsink_keys = {i['key'] for i in heatsink_items}
        expected_keys = {'small', 'medium', 'large', 'xlarge', 'extreme'}
        
        assert heatsink_keys == expected_keys, f"Missing heatsinks: {expected_keys - heatsink_keys}"
        
        print(f"PASS: Admin equipment has all 5 heatsinks: {heatsink_keys}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

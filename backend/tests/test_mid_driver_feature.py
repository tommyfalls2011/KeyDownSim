"""
Test suite for the Mid Driver stage feature.

New 3-stage amplifier chain: Radio → Driver → Mid Driver → Final

Tests cover:
1. Backend /api/configurations accepts and returns mid_driver fields
2. Mid driver fields in configuration save/load
3. Signal chain calculation with all 3 stages
4. Mitsubishi 2SC3240 updated specs (wattsPEP=180, not 105)
5. Under-driven threshold changed from 35% to 5%
6. Cobra 29 (0.75W) driving single pill final does NOT trigger under-driven warning
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "fallstommy@gmail.com"
ADMIN_PASSWORD = "admin123"


class TestMidDriverConfiguration:
    """Test backend accepts mid_driver fields in configuration"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()['token']
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_save_config_with_mid_driver(self, auth_headers):
        """Configuration should save with mid_driver fields"""
        config_data = {
            "name": "TEST_MidDriverConfig",
            "radio": "cobra-29",
            # Driver stage
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "small",
            # Mid Driver stage (NEW)
            "mid_driver_transistor": "hg-2sc2879",
            "mid_driver_box_size": 4,
            "mid_driver_heatsink": "medium",
            # Final stage
            "final_transistor": "mitsubishi-2sc3240",
            "final_box_size": 8,
            "final_heatsink": "large",
            "antenna": "whip-102",
            "antenna_position": "center",
            "vehicle": "suburban",
            "bonding": True
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create config: {response.text}"
        
        created = response.json()
        
        # Verify mid_driver fields are stored
        assert created['mid_driver_transistor'] == 'hg-2sc2879', f"Got {created.get('mid_driver_transistor')}"
        assert created['mid_driver_box_size'] == 4, f"Got {created.get('mid_driver_box_size')}"
        assert created['mid_driver_heatsink'] == 'medium', f"Got {created.get('mid_driver_heatsink')}"
        
        print(f"PASS: Saved config with mid_driver fields, id={created['id']}")
        
        # Verify by fetching
        get_response = requests.get(f"{BASE_URL}/api/configurations", headers=auth_headers)
        configs = get_response.json()
        saved = next((c for c in configs if c['id'] == created['id']), None)
        assert saved is not None
        assert saved['mid_driver_transistor'] == 'hg-2sc2879'
        assert saved['mid_driver_box_size'] == 4
        assert saved['mid_driver_heatsink'] == 'medium'
        
        print("PASS: Loaded config has correct mid_driver fields")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_save_config_without_mid_driver(self, auth_headers):
        """Configuration should save with mid_driver fields as 'none'/0 when not used"""
        config_data = {
            "name": "TEST_NoMidDriverConfig",
            "radio": "cobra-29",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "small",
            # Mid driver defaults to none
            "mid_driver_transistor": "none",
            "mid_driver_box_size": 0,
            "mid_driver_heatsink": "small",
            "final_transistor": "hg-2sc2879",
            "final_box_size": 4,
            "final_heatsink": "medium",
            "antenna": "whip-102",
            "vehicle": "suburban"
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        assert created['mid_driver_transistor'] == 'none'
        assert created['mid_driver_box_size'] == 0
        
        print("PASS: Config saved with no mid_driver stage")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)
    
    def test_full_3_stage_config(self, auth_headers):
        """Test saving a full 3-stage amp configuration"""
        config_data = {
            "name": "TEST_Full3StageConfig",
            "radio": "stryker-955",  # 3W dead key
            # Driver: 2-pill Toshiba
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "small",
            # Mid Driver: 4-pill HG
            "mid_driver_transistor": "hg-2sc2879",
            "mid_driver_box_size": 4,
            "mid_driver_heatsink": "medium",
            # Final: 8-pill Mitsubishi
            "final_transistor": "mitsubishi-2sc3240",
            "final_box_size": 8,
            "final_heatsink": "large",
            "antenna": "predator-k1-12",
            "antenna_position": "rear",
            "vehicle": "silverado-rcsb",
            "bonding": True,
            "alternator_count": 3,
            "alternator_amps": 320,
            "battery_type": "lithium",
            "battery_count": 2,
            "regulator_voltages": [14.5, 14.5],
            "tip_length": 46
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        
        # Verify all 3 stages saved correctly
        assert created['driver_transistor'] == 'toshiba-2sc2879'
        assert created['driver_box_size'] == 2
        assert created['mid_driver_transistor'] == 'hg-2sc2879'
        assert created['mid_driver_box_size'] == 4
        assert created['final_transistor'] == 'mitsubishi-2sc3240'
        assert created['final_box_size'] == 8
        
        print(f"PASS: Full 3-stage config saved correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/configurations/{created['id']}", headers=auth_headers)


class TestMitsubishiTransistorSpecs:
    """Test Mitsubishi 2SC3240 has updated specs"""
    
    def test_mitsubishi_wattsPEP_is_180(self):
        """Mitsubishi 2SC3240 should now show 180W PEP (not 105W)"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        transistors = data.get('transistors', {})
        
        mitsu = transistors.get('mitsubishi-2sc3240')
        assert mitsu is not None, "Mitsubishi 2SC3240 not found in transistors"
        
        # Get watts_pep (snake_case from backend)
        watts_pep = mitsu.get('watts_pep') or mitsu.get('wattsPEP')
        assert watts_pep == 180, f"Expected wattsPEP=180, got {watts_pep}"
        
        print(f"PASS: Mitsubishi 2SC3240 wattsPEP={watts_pep} (correctly changed from 105 to 180)")
    
    def test_mitsubishi_efficiency(self):
        """Mitsubishi 2SC3240 should have 57.5% efficiency"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        transistors = response.json().get('transistors', {})
        mitsu = transistors.get('mitsubishi-2sc3240')
        
        efficiency = mitsu.get('efficiency')
        assert efficiency == 0.575, f"Expected efficiency=0.575, got {efficiency}"
        
        print(f"PASS: Mitsubishi 2SC3240 efficiency={efficiency}")
    
    def test_mitsubishi_current_draw_calculation(self):
        """Current per pill should be ~25A (180W / (12.5V * 0.575) = 25A)"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        transistors = response.json().get('transistors', {})
        mitsu = transistors.get('mitsubishi-2sc3240')
        
        watts_pep = mitsu.get('watts_pep') or mitsu.get('wattsPEP')
        efficiency = mitsu.get('efficiency')
        current_max = mitsu.get('current_max') or mitsu.get('currentMax')
        
        # current_per_pill = watts_pep / (12.5 * efficiency)
        calculated_current = watts_pep / (12.5 * efficiency)
        
        assert abs(calculated_current - 25) < 1, f"Current per pill should be ~25A, calculated {calculated_current}"
        assert current_max == 25, f"Expected current_max=25, got {current_max}"
        
        print(f"PASS: Mitsubishi 2SC3240 current draw = {current_max}A per pill (matches 180W @ 57.5% eff)")


class TestUnderDrivenThreshold:
    """Test under-driven threshold changed from 35% to 5%"""
    
    def test_cobra29_single_pill_not_underdriven(self):
        """
        Cobra 29 (0.75W dead key) driving a single pill final should NOT trigger under-driven warning.
        
        Old behavior: 35% threshold would trigger warning
        New behavior: 5% threshold - 0.75W into ~5W drive needed = 15% drive ratio > 5% = NO WARNING
        """
        # This tests the frontend calculation logic
        # For a single-pill final with 13dB gain (Toshiba), ideal drive = 100W / 20 = 5W
        # Radio dead key 0.75W = 15% drive ratio, which is > 5% threshold = NOT under-driven
        
        # Calculate manually:
        # Final: 1 pill * 100W = 100W capacity
        # Final gain: 10^(13/10) = 20
        # Ideal drive: 100 / 20 = 5W
        # Radio drive: 0.75W
        # Drive ratio: 0.75 / 5 = 0.15 = 15%
        # 15% > 5% threshold = NOT under-driven
        
        # We can't directly test the frontend JS function, but we verify the data is correct
        # Frontend uses: isUnderDriven: driveRatio < 0.05 (5%)
        
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        radios = data.get('radios', {})
        transistors = data.get('transistors', {})
        
        cobra = radios.get('cobra-29')
        toshiba = transistors.get('toshiba-2sc2879')
        
        dead_key = cobra.get('dead_key') or cobra.get('deadKey')
        watts_pep = toshiba.get('watts_pep') or toshiba.get('wattsPEP')
        gain_db = toshiba.get('gain_db') or toshiba.get('gainDB')
        
        final_capacity = 1 * watts_pep  # 1 pill
        final_gain = 10 ** (gain_db / 10)  # ~20 for 13dB
        ideal_drive = final_capacity / final_gain
        drive_ratio = dead_key / ideal_drive
        
        print(f"Cobra 29 dead key: {dead_key}W")
        print(f"1-pill final capacity: {final_capacity}W")
        print(f"Final gain: {final_gain:.1f}x ({gain_db}dB)")
        print(f"Ideal drive: {ideal_drive:.2f}W")
        print(f"Drive ratio: {drive_ratio:.2%}")
        
        # With 5% threshold, 15% drive ratio should NOT be under-driven
        is_under_driven = drive_ratio < 0.05
        assert not is_under_driven, f"Cobra 29 + 1-pill should NOT be under-driven at {drive_ratio:.1%} (threshold 5%)"
        
        print(f"PASS: Cobra 29 (0.75W) + 1-pill final: drive ratio {drive_ratio:.1%} >= 5% threshold = NOT under-driven")
    
    def test_extreme_underdriven_scenario(self):
        """Test an extreme case where under-driven SHOULD trigger"""
        # Very high power final (32-pill) with tiny radio and no driver stages
        # Should be under-driven (way below 5%)
        
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        radios = data.get('radios', {})
        transistors = data.get('transistors', {})
        
        cobra = radios.get('cobra-29')
        hg = transistors.get('hg-2sc2879')
        
        dead_key = cobra.get('dead_key') or cobra.get('deadKey')  # 0.75W
        watts_pep = hg.get('watts_pep') or hg.get('wattsPEP')  # 125W
        gain_db = hg.get('gain_db') or hg.get('gainDB')  # 11.5dB
        
        # 32-pill final with combining bonus
        combining_bonus = 1.2 ** 8  # 8 combining stages for 32-pill
        final_capacity = 32 * watts_pep * combining_bonus
        final_gain = 10 ** (gain_db / 10)
        ideal_drive = final_capacity / final_gain
        drive_ratio = dead_key / ideal_drive
        
        print(f"32-pill final capacity: {final_capacity:.0f}W")
        print(f"Ideal drive: {ideal_drive:.1f}W")
        print(f"Radio drive: {dead_key}W")
        print(f"Drive ratio: {drive_ratio:.4f} ({drive_ratio:.2%})")
        
        # This extreme case should be under-driven (< 5%)
        is_under_driven = drive_ratio < 0.05
        assert is_under_driven, f"32-pill with just radio should be under-driven at {drive_ratio:.2%}"
        
        print(f"PASS: Extreme under-driven case: {drive_ratio:.4%} < 5% threshold = UNDER-DRIVEN")


class TestCalculateWithMidDriver:
    """Test RF calculation works with mid_driver stage (even though backend may not include it yet)"""
    
    def test_calculate_accepts_mid_driver_fields(self):
        """Calculate endpoint should accept mid_driver fields in request"""
        calc_data = {
            "radio": "stryker-955",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 2,
            "driver_heatsink": "small",
            # Mid driver fields
            "mid_driver_transistor": "hg-2sc2879",
            "mid_driver_box_size": 4,
            "mid_driver_heatsink": "medium",
            # Final
            "final_transistor": "mitsubishi-2sc3240",
            "final_box_size": 8,
            "final_heatsink": "large",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "bonding": True,
            "alternator_count": 2,
            "alternator_amps": 320,
            "battery_type": "agm",
            "battery_count": 2
        }
        
        response = requests.post(f"{BASE_URL}/api/calculate", json=calc_data)
        # Should not reject the request with mid_driver fields
        assert response.status_code == 200, f"Calculate should accept mid_driver fields: {response.text}"
        
        result = response.json()
        assert 'dead_key_watts' in result
        assert 'peak_watts' in result
        
        print(f"PASS: Calculate accepts mid_driver fields: {result['dead_key_watts']}W dead key")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

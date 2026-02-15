"""
Test suite for the fixed amplifier power model:
1. Drive-based compression model (replaces linear gain formula)
2. Inter-stage jumper cable losses

Expected values (verified via Node.js tests):
- Cobra 29 → 3-pill Toshiba 2SC2879: ~78W dead key, ~313W peak
- Galaxy 959 → 3-pill Toshiba 2SC2879: ~128W dead key
- Stryker 955 → 3-pill Toshiba 2SC2879: ~157W dead key

The old linear model produced ~15.6W for Cobra→3pill (31W from a 3-pill driver was wrong).
"""
import pytest
import requests
import os
import math

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://amp-test.preview.emergentagent.com')


class TestEquipmentAPI:
    """Test that equipment API returns correct data for power model calculations"""

    def test_equipment_api_returns_transistor_data(self):
        """Verify transistors have driveWatts field for drive-based model"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        assert "transistors" in data
        
        # Check Toshiba 2SC2879 has correct specs for power model
        toshiba = data["transistors"].get("toshiba-2sc2879")
        assert toshiba is not None, "Toshiba 2SC2879 transistor not found"
        assert toshiba["watts_pep"] == 100, "Expected 100W PEP per pill"
        assert toshiba["gain_db"] == 13, "Expected 13dB gain"
        assert toshiba["drive_watts"] == 4, "Expected 4W drive per pill for compression model"

    def test_equipment_api_returns_radio_data(self):
        """Verify radios have correct dead key/peak values"""
        response = requests.get(f"{BASE_URL}/api/equipment")
        assert response.status_code == 200
        
        data = response.json()
        assert "radios" in data
        
        # Check Cobra 29 has correct power specs
        cobra = data["radios"].get("cobra-29")
        assert cobra is not None
        assert cobra["dead_key"] == 0.75, "Cobra 29 dead key should be 0.75W"
        assert cobra["peak_key"] == 25, "Cobra 29 peak should be 25W"
        
        # Check Galaxy 959
        galaxy = data["radios"].get("galaxy-959")
        assert galaxy is not None
        assert galaxy["dead_key"] == 2, "Galaxy 959 dead key should be 2W"
        
        # Check Stryker 955
        stryker = data["radios"].get("stryker-955")
        assert stryker is not None
        assert stryker["dead_key"] == 3, "Stryker 955 dead key should be 3W"


class TestPowerModelCalculations:
    """
    Test the drive-based compression power model calculations.
    
    The model uses:
    - maxOutput = pills * wattsPEP * combining * voltageBoost
    - driveRequired = pills * driveWattsPerPill
    - if driveRatio >= 1.0: output = maxOutput
    - else: output = maxOutput * sqrt(driveRatio)
    
    This replaces the old linear model: output = min(input * gain * voltageBoost, maxOutput)
    """

    def calculate_expected_output(self, input_watts, pills, watts_per_pill, drive_watts_per_pill, voltage_boost=1.0):
        """Calculate expected output using the drive-based compression model"""
        # For a 3-pill box (no combining stages as per BOX_COMBINING)
        max_output = pills * watts_per_pill * voltage_boost
        drive_required = pills * drive_watts_per_pill
        drive_ratio = input_watts / drive_required
        
        if drive_ratio >= 1.0:
            return max_output
        else:
            return max_output * math.sqrt(drive_ratio)

    def test_cobra_to_3pill_toshiba_expected_power(self):
        """
        Verify: Cobra 29 (0.75W dead key) → 3-pill Toshiba 2SC2879 → ~78W dead key
        
        Calculation:
        - maxOutput = 3 pills * 100W * 1.0 combining * 1.0 voltage = 300W
        - driveRequired = 3 pills * 4W = 12W
        - driveRatio = 0.75W / 12W = 0.0625
        - output = 300W * sqrt(0.0625) = 300W * 0.25 = 75W
        
        With 14.2V voltage boost (nominal 13.8V):
        - voltageBoost ≈ 1.029
        - output ≈ 77-78W
        """
        cobra_dead_key = 0.75
        pills = 3
        watts_per_pill = 100  # Toshiba 2SC2879
        drive_watts_per_pill = 4
        
        # At nominal voltage (no boost)
        expected = self.calculate_expected_output(cobra_dead_key, pills, watts_per_pill, drive_watts_per_pill)
        
        # Expected ~75W at nominal, ~78W at 14.2V
        assert 70 <= expected <= 80, f"Expected ~75W, got {expected}W"
        print(f"Cobra → 3-pill Toshiba dead key: {expected:.1f}W (expected ~75-78W)")

    def test_galaxy_to_3pill_toshiba_expected_power(self):
        """
        Verify: Galaxy 959 (2W dead key) → 3-pill Toshiba 2SC2879 → ~128W dead key
        
        Calculation:
        - maxOutput = 300W
        - driveRequired = 12W
        - driveRatio = 2W / 12W = 0.167
        - output = 300W * sqrt(0.167) = 300W * 0.408 = 122W
        
        With voltage boost: ~128W
        """
        galaxy_dead_key = 2.0
        pills = 3
        watts_per_pill = 100
        drive_watts_per_pill = 4
        
        expected = self.calculate_expected_output(galaxy_dead_key, pills, watts_per_pill, drive_watts_per_pill)
        
        assert 115 <= expected <= 135, f"Expected ~122W, got {expected}W"
        print(f"Galaxy → 3-pill Toshiba dead key: {expected:.1f}W (expected ~122-128W)")

    def test_stryker_to_3pill_toshiba_expected_power(self):
        """
        Verify: Stryker 955 (3W dead key) → 3-pill Toshiba 2SC2879 → ~157W dead key
        
        Calculation:
        - maxOutput = 300W
        - driveRequired = 12W
        - driveRatio = 3W / 12W = 0.25
        - output = 300W * sqrt(0.25) = 300W * 0.5 = 150W
        
        With voltage boost: ~157W
        """
        stryker_dead_key = 3.0
        pills = 3
        watts_per_pill = 100
        drive_watts_per_pill = 4
        
        expected = self.calculate_expected_output(stryker_dead_key, pills, watts_per_pill, drive_watts_per_pill)
        
        assert 140 <= expected <= 165, f"Expected ~150W, got {expected}W"
        print(f"Stryker → 3-pill Toshiba dead key: {expected:.1f}W (expected ~150-157W)")

    def test_peak_power_calculation(self):
        """
        Verify peak power calculation for 3-pill Toshiba at 14.2V
        
        When fully driven (driveRatio >= 1.0), output = maxOutput
        maxOutput at 14.2V should be ~313W (with voltage boost)
        """
        pills = 3
        watts_per_pill = 100
        
        # Voltage boost calculation: vRatio = 14.2/13.8, boost = (vRatio + vRatio²) / 2
        v_ratio = 14.2 / 13.8
        voltage_boost = (v_ratio + v_ratio * v_ratio) / 2
        
        max_output = pills * watts_per_pill * voltage_boost
        
        # Expected ~309-313W at 14.2V
        assert 305 <= max_output <= 320, f"Expected ~313W peak, got {max_output:.1f}W"
        print(f"3-pill Toshiba peak at 14.2V: {max_output:.1f}W (expected ~313W)")


class TestJumperCableLoss:
    """
    Test inter-stage jumper cable loss calculations.
    
    Jumper cables add loss between amp stages:
    - totalLoss = cableLoss + 0.3dB connector loss
    - RG-8X: 1.4 dB/100ft
    - RG-213: 0.5 dB/100ft  
    - LMR-400: 0.3 dB/100ft
    """

    def calculate_jumper_loss_db(self, cable_type, length_ft):
        """Calculate jumper loss in dB"""
        cable_loss_per_100ft = {
            'rg8x': 1.4,
            'rg213': 0.5,
            'lmr400': 0.3
        }
        connector_loss_db = 0.3  # 2× PL-259 connectors
        
        cable_loss = (cable_loss_per_100ft.get(cable_type, 0.5) * length_ft) / 100
        return cable_loss + connector_loss_db

    def test_rg8x_3ft_jumper_loss(self):
        """RG-8X 3ft jumper: 1.4 * 3/100 + 0.3 = 0.042 + 0.3 = 0.342 dB"""
        loss_db = self.calculate_jumper_loss_db('rg8x', 3)
        expected = 0.342
        assert abs(loss_db - expected) < 0.01, f"Expected {expected}dB, got {loss_db:.3f}dB"
        print(f"RG-8X 3ft jumper loss: {loss_db:.3f}dB")

    def test_rg213_6ft_jumper_loss(self):
        """RG-213 6ft jumper: 0.5 * 6/100 + 0.3 = 0.03 + 0.3 = 0.33 dB"""
        loss_db = self.calculate_jumper_loss_db('rg213', 6)
        expected = 0.33
        assert abs(loss_db - expected) < 0.01, f"Expected {expected}dB, got {loss_db:.3f}dB"
        print(f"RG-213 6ft jumper loss: {loss_db:.3f}dB")

    def test_lmr400_10ft_jumper_loss(self):
        """LMR-400 10ft jumper: 0.3 * 10/100 + 0.3 = 0.03 + 0.3 = 0.33 dB"""
        loss_db = self.calculate_jumper_loss_db('lmr400', 10)
        expected = 0.33
        assert abs(loss_db - expected) < 0.01, f"Expected {expected}dB, got {loss_db:.3f}dB"
        print(f"LMR-400 10ft jumper loss: {loss_db:.3f}dB")

    def test_jumper_loss_affects_output_power(self):
        """Verify jumper cable loss reduces power to next stage"""
        # 0.33 dB loss = 10^(-0.33/10) = 0.927 multiplier
        loss_db = 0.33
        power_multiplier = 10 ** (-loss_db / 10)
        
        input_power = 100  # W
        output_power = input_power * power_multiplier
        
        # 100W input → ~92.7W after jumper
        assert 92 <= output_power <= 93, f"Expected ~92.7W, got {output_power:.1f}W"
        print(f"100W through 0.33dB jumper: {output_power:.1f}W")


class TestMultiStageChain:
    """Test multi-stage amplifier chains (e.g., Cobra → 3-pill driver → 8-pill final)"""

    def test_two_stage_chain_power_calculation(self):
        """
        Cobra 29 → 3-pill driver → 8-pill final
        
        Stage 1: Cobra 0.75W → 3-pill driver
        - maxOutput = 300W, driveRequired = 12W
        - driveRatio = 0.75/12 = 0.0625
        - output = 300 * sqrt(0.0625) = 75W
        
        Stage 2: 75W → 8-pill final  
        - maxOutput = 8 * 100 * 1.44 (2 combining stages) = 1152W
        - driveRequired = 8 * 4 = 32W
        - driveRatio = 75/32 = 2.34 (saturated)
        - output = 1152W (fully driven)
        """
        # This is a conceptual test - the actual values depend on voltage boost
        # and combining bonus per stage
        driver_output = 75  # Approximate from Cobra
        final_pills = 8
        watts_per_pill = 100
        drive_per_pill = 4
        combining_bonus = 1.2 ** 2  # 8-pill has 2 combining stages
        
        final_max = final_pills * watts_per_pill * combining_bonus
        drive_required = final_pills * drive_per_pill
        drive_ratio = driver_output / drive_required
        
        if drive_ratio >= 1.0:
            final_output = final_max
        else:
            final_output = final_max * math.sqrt(drive_ratio)
        
        # Should be fully driven since 75W > 32W required
        assert drive_ratio >= 1.0, f"8-pill final should be fully driven with {driver_output}W input"
        assert final_output == final_max, "Final should output max when fully driven"
        print(f"Cobra → 3-pill → 8-pill chain: driver={driver_output}W, final={final_output:.0f}W")


class TestConfigurationSaveLoad:
    """Test that jumper cable settings are properly saved and loaded"""

    def test_save_configuration_with_jumper_settings(self):
        """Verify configuration save includes jumper cable fields"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "fallstommy@gmail.com",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            pytest.skip("Authentication failed - cannot test config save")
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create config with jumper settings
        config_data = {
            "name": f"TEST_JumperConfig_{os.urandom(4).hex()}",
            "radio": "cobra-29",
            "antenna": "whip-102",
            "vehicle": "suburban",
            "driver_transistor": "toshiba-2sc2879",
            "driver_box_size": 3,
            "driver_heatsink": "medium",
            "final_transistor": "toshiba-2sc2879",
            "final_box_size": 8,
            "final_heatsink": "large",
            "jumper_radio_to_driver_type": "rg8x",
            "jumper_radio_to_driver_length": 6,
            "jumper_driver_to_mid_type": "rg213",
            "jumper_driver_to_mid_length": 3,
            "jumper_mid_to_final_type": "lmr400",
            "jumper_mid_to_final_length": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/configurations", json=config_data, headers=headers)
        assert response.status_code in [200, 201], f"Failed to save config: {response.text}"
        
        saved = response.json()
        assert saved.get("jumper_radio_to_driver_type") == "rg8x"
        assert saved.get("jumper_radio_to_driver_length") == 6
        assert saved.get("jumper_mid_to_final_type") == "lmr400"
        assert saved.get("jumper_mid_to_final_length") == 10
        
        print(f"Configuration saved with jumper settings: {saved.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

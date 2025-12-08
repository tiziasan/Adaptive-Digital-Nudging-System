from typing import Dict, Any


class FairnessMonitor:


    def get_fairness_constraint_prompt(self) -> str:


        return f"""
*** FAIRNESS AND BIAS MITIGATION INSTRUCTIONS ***
1. NON-DISCRIMINATION:
   - Ensure your language and strategy are neutral and inclusive. Do not make assumptions based on the user's device, location, or usage patterns that could reinforce stereotypes.

2. VULNERABILITY PROTECTION:
   - If the user shows signs of 'Pre-contemplation', respect their pace. Do not overwhelm them.

3. EQUITABLE OUTCOMES:
   - Ensure the suggested action is realistically achievable for this specific user profile. Do not suggest actions that require resources the user likely does not have.
**************************************************
"""
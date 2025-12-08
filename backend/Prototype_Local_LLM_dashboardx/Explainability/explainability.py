
class Explainability:


    def get_explanation_instructions(self) -> str:

        return """
*** EXPLAINABILITY & TRANSPARENCY REQUIREMENTS ***
You are required to provide a 'Transparency Explanation' for your decision.
1. RATIONALE GENERATION:
   - You MUST explain WHY this specific strategy matches this specific user's profile (Cognitive Mode + Behavioral Stage).
   - The explanation must be written in clear, natural language suitable for the user to read if they ask "Why am I seeing this?".

2. LOGIC TRACE:
   - Connect the dots: "Because you are in the [Stage] and prefer [Mode] thinking, we selected [Strategy] to help you [Goal]."

3. FORMAT:
   - Ensure your JSON output includes a field 'user_facing_explanation' that simplifies your technical reasoning into a friendly sentence.
**************************************************
"""

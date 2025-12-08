class EthicsCompliance:

    def get_regulatory_compliance_prompt(self) -> str:
        return """
*** CRITICAL REGULATORY COMPLIANCE INSTRUCTIONS (MANDATORY) ***
1. EU AI ACT COMPLIANCE (Article 5):
   - You are STRICTLY FORBIDDEN from using subliminal techniques or manipulative 'Dark Patterns' that materially distort the user's behavior in a way that causes harm.
   - The nudge must preserve the user's autonomy and freedom of choice. Do not coerce.

2. GDPR PRINCIPLES:
   - Data Minimization: Base your decision ONLY on the provided data. Do not infer sensitive personal traits (race, political opinions, health) unless explicitly stated.
   - Purpose Limitation: Your sole goal is energy sustainability. Do not optimize for commercial engagement or addiction.

3. DIGITAL SERVICES ACT (DSA):
   - Transparency: The user has a right to know they are being nudged. Ensure the generated strategy is justifiable and not deceptive.
*************************************************************
"""
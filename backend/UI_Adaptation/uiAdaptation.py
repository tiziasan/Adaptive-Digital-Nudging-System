from datetime import datetime
from typing import Dict, Any
import json
from openai import OpenAI
import ollama


class UIAdaptation:


    def __init__(self, api_key: str = None, use_ollama: bool = False, model: str = "qwen3:14b"):
        self.use_ollama = use_ollama

        if use_ollama:
            self.model = model
        else:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o-mini"

    def generate_ui_config(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:

        user_modeling = user_profile.get('user_modeling', {})
        user_emotions = user_profile.get('user_emotion')

        prompt = f"""You are a UI/UX expert specializing in adaptive interfaces for sustainability dashboards.

Based on the user's current emotion and cognitive profile, generate an optimal UI configuration for their energy monitoring dashboard that triggers positive emotions like happiness and surprise.

User Current Emotion: {user_emotions}

User Profile:
{json.dumps(user_modeling, indent=2)}

Generate a UI configuration that matches the user's cognitive characteristics:

**Cognitive Mode Considerations:**
- analytical/slow: Professional, structured design with detailed visualizations (pie charts for precise comparisons)
- intuitive/fast: Simple, clean design with quick-to-read visuals (line or bar charts for trend visualization)

**Behavioral Stage Considerations:**
- Pre-contemplation/Contemplation: Engaging, warm colors to attract attention
- Preparation/Action: Focused, calm colors to support decision-making
- Maintenance: Neutral, professional colors for routine monitoring

**Attention Availability Considerations:**
- high: Detailed visualizations, richer colors, smaller fonts acceptable (14px-16px)
- medium: Balanced design, moderate contrast, medium fonts (19px-21px)
- low: High contrast, larger fonts (24px-29px), simple charts

Respond with a JSON object containing EXACTLY these 6 fields with values selected ONLY from the allowed options below:

1. "font_size": Select ONE from ["14px", "16px", "19px", "21px", "24px", "27px", "29px"]

2. "background_colour": Select ONE hex code from:
   - "#ffffff" (white)
   - "#D1D5DBFF" (light gray)
   - "#666966" (dark gray)
   - "#BBF8B8FF" (light green)
   - "#AFCEF1FF" (sky blue)
   - "#F1DF96FF" (light yellow)
   - "#73F3CCFF" (aqua)
   - "#E5EEFD" (light blue)


3. "primary_colour": Select ONE hex code from the same list as background_colour above

4. "secondary_colour": Select ONE hex code from the same list as background_colour above (should differ from primary)

5. "consumption_graph": Select ONLY "bar" Or "line" Or "Pie"

6. "price_graph": Select ONLY "bar" OR "line" Or "Pie"

Mandatory output format JSON example:
{{
  "font_size": "16px",
  "background_colour": "#ffffff",
  "primary_colour": "#AFCEF1FF",
  "secondary_colour": "#BBF8B8FF",
  "consumption_graph": "bar",
  "price_graph": "line"
}}

You MUST select values EXACTLY as shown above. Do not use any other values.
Respond ONLY with the JSON object, nothing else.
"""

        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a UI/UX expert specializing in adaptive interfaces and accessibility."},
                    {"role": "user", "content": prompt}
                ],
                format="json",
                options={
                    "temperature": 0.3,
                    "num_predict": 10000  # equivalent to max_tokens
                }
            )
            response_content = response['message']['content']

            if isinstance(response_content, dict):
                result_json = response_content
            else:
                result_json = json.loads(response_content.strip())

        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a UI/UX expert specializing in adaptive interfaces and accessibility."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1250
            )
            result_json = json.loads(response.choices[0].message.content.strip())

        return result_json

    def create_ui_adaptation(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:

        ui_config = self.generate_ui_config(user_profile)

        user_modeling = user_profile.get('user_modeling', {})
        cognitive_mode = user_modeling.get('cognitive_mode', 'unknown')
        behavioral_stage = user_modeling.get('behavioral_stage', 'unknown')
        attention = user_modeling.get('attention_availability', 'unknown')
        user_emotions = user_profile.get('user_emotion', 'neutral')

        reasoning = f"User is in {user_emotions} mood. UI adapted for {cognitive_mode} cognitive mode, {behavioral_stage} behavioral stage, and {attention} attention availability. "
        reasoning += f"Font size {ui_config['font_size']} selected for optimal readability. "
        reasoning += f"Consumption data visualized as {ui_config['consumption_graph']} chart and price trends as {ui_config['price_graph']} chart. "
        reasoning += f"Color scheme: {ui_config['background_colour']} background with {ui_config['primary_colour']} primary and {ui_config['secondary_colour']} secondary accents for enhanced emotional engagement."

        ui_results = {
            "font_size": ui_config['font_size'],
            "background_colour": ui_config['background_colour'],
            "primary_colour": ui_config['primary_colour'],
            "secondary_colour": ui_config['secondary_colour'],
            "consumption_graph": ui_config['consumption_graph'],
            "price_graph": ui_config['price_graph'],
            "adaptation_reasoning": reasoning,
            "generation_timestamp": datetime.now().isoformat()
        }

        final_output = {
            **user_profile,
            "ui_adaptation": ui_results
        }

        return final_output

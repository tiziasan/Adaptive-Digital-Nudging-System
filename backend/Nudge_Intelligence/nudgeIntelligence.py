from datetime import datetime
from typing import Dict, Any
import json
from openai import OpenAI
import ollama


class NudgeIntelligence:


    def __init__(self, api_key: str = None, use_ollama: bool = False, model: str = "qwen3:8b"):
        self.use_ollama = use_ollama

        if use_ollama:
            self.model = model
        else:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o-mini"

        self.nudge_strategies = {
            "Raise visibility of user's actions": "Make user actions more observable to themselves or others to heighten awareness and accountability",
            "Provide multiple viewpoints": "Present alternative perspectives or solutions to broaden user decision-making",
            "Enable comparisons": "Facilitate direct comparison between options using metrics, visuals, or side-by-side layouts",
            "Suggest alternatives": "Offer explicit alternative choices to expand the perceived set of options",
            "Remind the consequences": "Prompt users with reminders about the potential outcomes of their choices, supporting deliberation",
            "Reduce distance": "Minimize psychological or physical effort between the user and a desired goal by lowering barriers",
            #"Just-in-time prompts": "Deliver messages or reminders exactly when a user is most likely to make a relevant decision",
            "Throttling mindless activity": "Insert pauses or minor obstacles to slow down habitual or automatic behaviors, encouraging reflection",
            "Instigate empathy": "Use narratives or examples that encourage users to consider others' feelings or perspectives",
            "Hiding": "Remove or obscure less desirable options to increase the likelihood of choosing beneficial ones",
            "Create friction": "Add small steps or hurdles to make undesired choices less convenient, steering users to better decisions",
            "Public commitment": "Encourage users to make commitments visible to others, increasing follow-through due to social pressure",
            "Biasing the memory": "Influence user recollection by emphasizing selective aspects of an experience, shaping future decisions",
            "Placebo": "Use symbolic actions or subtle cues that produce psychological effects and behavior change due to user expectations",
            "Add inferior alternatives": "Introduce clearly less attractive options to make preferred options stand out (decoy effect)",
            "Subliminal priming": "Present non-conscious cues or stimuli to subtly influence future user choices",
            "Deceptive visualization": "Employ misleading charts or graphics to bias interpretation of data and choices",
            "Opt-out policies": "Pre-select beneficial options, requiring users to opt out if they prefer alternatives, thus leveraging inertia",
            "Reciprocity": "Encourage giving by providing a benefit upfront to prompt users to reciprocate the gesture",
            "Scarcity": "Highlight the limited availability of options or resources to increase their perceived value",
            "Defaults": "Set preferred options as the automatic selection unless the user actively chooses otherwise, exploiting status quo bias",
            "Positioning": "Change physical or visual placement of choices to affect which options users notice or select first",
            "Ambient feedback": "Use subtle environmental signals (e.g., lights, sounds) to provide ongoing behavioral feedback"
        }

    def strategy_optimizer(self, complete_data: Dict[str, Any], fairness_prompt:str,explainability_prompt:str) -> Dict[str, str]:

        strategies_list = "\n".join([f"- **{name}**: {desc}" for name, desc in self.nudge_strategies.items()])

        prompt = f"""You are an expert in digital nudging and behavioral design for sustainability applications with no bias.
        {fairness_prompt}
        {explainability_prompt}

Based on the user profile data below, select the MOST EFFECTIVE nudging strategy for sustainability from the following 23 options take in consideration the feedbacks from the previous_nudges:

{strategies_list}

User Profile:
{json.dumps(complete_data, indent=2)}

Select a strategy that aligns with:
- The user's cognitive mode (intuitive/fast vs analytical/slow)
- Their behavioral stage (Pre-contemplation, Contemplation, Preparation, Action, Maintenance)
- Their attention availability (low, medium, high)

Respond with a JSON object containing:
1. "selected_strategy": The exact name of ONE strategy from the list above
2. "reasoning": A brief explanation (2-3 sentences) of WHY this strategy was selected, citing the user's cognitive mode, behavioral stage, and attention level

Mandatory output format JSON example:
{{
  "selected_strategy": "Raise visibility of user's actions",
  "reasoning": "Given the user's analytical/slow cognitive mode and Contemplation stage, visibility strategies are highly effective for informing decision-making. The medium attention availability suggests the user can process moderately detailed information."
}}

Respond ONLY with the JSON object, nothing else.
"""

        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a digital nudging expert specializing in sustainability behavior change."},
                    {"role": "user", "content": prompt}
                ],
                format="json",
                options={
                    "temperature": 0.7,
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
                     "content": "You are a digital nudging expert specializing in sustainability behavior change."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1250
            )
            result_json = json.loads(response.choices[0].message.content.strip())

        return result_json

    def nudge_generator(self,
                        selected_strategy: str,
                        user_modeling_data: Dict[str, Any], fairness_prompt:str,ethics_prompt:str) -> str:

        strategy_description = self.nudge_strategies.get(selected_strategy, "")

        prompt = f"""You are an expert nudge designer creating personalized sustainability messages for energy consumption reduction.
{fairness_prompt}
{ethics_prompt}

Create a concise, actionable nudge message using the following strategy:

Strategy Name: {selected_strategy}
Strategy Description: {strategy_description}

Complete User Data:
{json.dumps(user_modeling_data, indent=2)}

Requirements:
- Maximum 3 lines of text
- Focus on energy consumption reduction for electrodomestic appliances
- Use ACTUAL usage data (usage_hours and appliance_watt_consumption) to calculate real energy impact
- Identify the highest-consuming appliance and create nudge around it
- Consider the user's previous_nudges history and feedback to avoid repeating disliked approaches
- Personalized to the user's interaction patterns, consumption data, and behavioral context
- Tone appropriate for their cognitive mode and attention level (from user_modeling)
- Clear call-to-action
- Use the selected strategy effectively as described above
- Be compliant with AI Act, GDPR and Digital Services Act

Respond with ONLY the nudge message. No explanations, no titles, just the message text.
"""
        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a sustainability nudge designer creating behavior change interventions."},
                    {"role": "user", "content": prompt}
                ],
                format="json",
                options={
                    "temperature": 0.7,
                    "num_predict": 10000  # equivalent to max_tokens
                }
            )
            response_content = response['message']['content']

            if isinstance(response_content, dict):
                nudge_message = response_content
            else:
                nudge_message = json.loads(response_content.strip())

        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a sustainability nudge designer creating behavior change interventions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2250
            )
            nudge_message = response.choices[0].message.content.strip()

        return nudge_message





    def create_nudge(self, complete_data: Dict[str, Any], fairness_prompt:str,explainability_prompt:str, ethics_prompt:str) -> Dict[str, Any]:

        user_modeling_data = {k: v for k, v in complete_data.items() if k != 'previous_nudges'}


        strategy_result = self.strategy_optimizer(complete_data,fairness_prompt,explainability_prompt)
        selected_strategy = strategy_result["selected_strategy"]
        strategy_reasoning = strategy_result["reasoning"]

        nudge_message = self.nudge_generator(selected_strategy, user_modeling_data, fairness_prompt, ethics_prompt)

        nudge_results = {
            "selected_strategy": selected_strategy,
            "strategy_description": self.nudge_strategies.get(selected_strategy, ""),
            "strategy_selection_reasoning": strategy_reasoning,
            "nudge_message": nudge_message,
            "generation_timestamp": datetime.now().isoformat()
        }

        final_output = {
            **complete_data,
            "nudge_intelligence": nudge_results
        }

        return final_output

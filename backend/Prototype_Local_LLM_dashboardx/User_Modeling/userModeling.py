from datetime import datetime
from typing import Dict, Any
import json
import ollama
from openai import OpenAI


class UserModeling:
    def __init__(self, api_key: str = None,  use_ollama: bool = False, model: str = "qwen3:14b"):
        self.use_ollama = use_ollama

        if use_ollama:
            self.model = model
        else:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o-mini"




    def cognitive_profiler(self, data_capture: Dict[str, Any], fairness_prompt:str,explainability_prompt:str) -> Dict[str, str]:
        """
        Component 1: Cognitive Profiler
        Determines if user is in intuitive/fast (System 1) or analytical/slow (System 2) thinking

        Args:
            data_capture: Dictionary from Layer 1 containing behavioral and context data

        Returns:
            Dictionary with classification and reasoning
        """
        user_data_only = {k: v for k, v in data_capture.items() if k != 'previous_nudges'}
        prompt = f"""You are an expert in behavioral psychology with no bias analyzing user interactions with a sustainability energy monitoring dashboard.
        {fairness_prompt}
        {explainability_prompt}

Based on the following user interaction data, determine if the user is in:
- "intuitive/fast" thinking mode (System 1: quick decisions, impulsive, minimal analysis)
- "analytical/slow" thinking mode (System 2: deliberate, careful analysis, research-oriented)

User data:
{json.dumps(user_data_only, indent=2)}

Key indicators:
- High clicks, long hesitation, long duration → analytical/slow
- Low clicks, short hesitation, quick viewing → intuitive/fast
- Multiple appliances with high engagement → analytical/slow
- Quick scanning behavior → intuitive/fast

Respond EXACTLY just with a JSON object containing:
1. "classification": Either "intuitive/fast" OR "analytical/slow"
2. "reasoning": A brief explanation (1-2 sentences) of WHY you classified the user this way, citing specific data points

Example format:
{{
  "classification": "analytical/slow",
  "reasoning": "User spent 68 seconds on dishwasher with 5.6s hesitation and 12 clicks, indicating deliberate analysis. High engagement across multiple appliances shows systematic research behavior."
}}

Respond ONLY with the JSON object, nothing else.
Respond ONLY with valid JSON in this exact format:
{{
  "classification": "analytical/slow",
  "reasoning": "Your reasoning here"
}}

Do not include any markdown formatting, explanations, or additional text.
Start your response with {{ and end with }}
"""

        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system","content": "You are a behavioral psychology expert specializing in user profiling."},
                    {"role": "user", "content": prompt}
                ],
                format="json",
                options={
                    "temperature": 0.3,
                    "num_predict": 10000  # equivalent to max_tokens
                }
            )
            response_content = response['message']['content']

            # Gestisci sia dict che string
            if isinstance(response_content, dict):
                result_json = response_content
            else:
                result_json = json.loads(response_content.strip())

        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a behavioral psychology expert specializing in user profiling."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1250
            )
            result_json = json.loads(response.choices[0].message.content.strip())

        return result_json

    def behavioral_stage_detector(self, data_capture: Dict[str, Any],fairness_prompt:str,explainability_prompt:str) -> Dict[str, str]:
        """
        Component 2: Behavioral Stage Detector
        Identifies user's position in behavior change stages (Transtheoretical Model)

        Args:
            data_capture: Dictionary from Layer 1 containing behavioral and context data

        Returns:
            Dictionary with classification and reasoning
        """
        user_data_only = {k: v for k, v in data_capture.items() if k != 'previous_nudges'}

        prompt = f"""You are an expert in the Transtheoretical Model of behavior change with no bias, analyzing a user's sustainability journey.
{fairness_prompt}
{explainability_prompt}
Based on the user interaction data below, classify them into ONE of these stages:
- "Pre-contemplation": No awareness/interest in energy saving, minimal engagement
- "Contemplation": Researching and exploring options, high curiosity but no commitment
- "Preparation": Planning to take action, actively comparing appliances, making small changes
- "Action": Recently started energy-saving behaviors, active engagement with high-consumption appliances
- "Maintenance": Sustained energy-saving behavior, regular monitoring, established patterns

User data:
{json.dumps(user_data_only, indent=2)}

Key indicators:
- High hesitation on high-consumption appliances (dishwasher, washing_machine, air_conditioner) → Contemplation or Preparation
- Quick engagement with multiple appliances → Action or Maintenance
- Minimal interaction → Pre-contemplation
- Focused attention on specific high-consumption appliances → Action
- Looking at usage data (usage_hours_yesterday, usage_hours_last_week) → Shows monitoring behavior

Respond JUST with a JSON object containing:
1. "classification": One of "Pre-contemplation", "Contemplation", "Preparation", "Action", or "Maintenance"
2. "reasoning": A brief explanation (1-2 sentences) of WHY you classified the user in this stage, citing specific behavioral patterns

Example format:
{{
  "classification": "Contemplation",
  "reasoning": "User shows high engagement with multiple appliances (245.8s session) and long hesitation times (5.6s on dishwasher), indicating research behavior. However, no concrete action patterns suggest they are still exploring rather than committing."
}}

Respond ONLY with the JSON object, nothing else.

Respond ONLY with the JSON object, nothing else.
Respond ONLY with valid JSON in this exact format:
{{
  "classification": "analytical/slow",
  "reasoning": "Your reasoning here"
}}
"""
        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are an expert in behavioral change psychology and the Transtheoretical Model."},
                    {"role": "user", "content": prompt}
                ],
                format="json",

                options={
                    "temperature": 0.3,
                    "num_predict": 10000  # equivalent to max_tokens
                }
            )
            response_content = response['message']['content']

            # Gestisci sia dict che string
            if isinstance(response_content, dict):
                result_json = response_content
            else:
                result_json = json.loads(response_content.strip())
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert in behavioral change psychology and the Transtheoretical Model."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=150
            )
            result_json = json.loads(response.choices[0].message.content.strip())
        return result_json




    def attention_availability(self, data_capture: Dict[str, Any], fairness_prompt:str,explainability_prompt:str) -> Dict[str, str]:
        """
        Component 3: Attention Availability (formerly Load Estimator)
        Estimates user's available cognitive capacity

        Args:
            data_capture: Dictionary from Layer 1 containing behavioral and context data

        Returns:
            Dictionary with classification and reasoning
        """
        user_data_only = {k: v for k, v in data_capture.items() if k != 'previous_nudges'}

        prompt = f"""You are an expert in cognitive psychology with no bias analyzing a user's attention capacity.
{fairness_prompt}
{explainability_prompt}
Based on the following data, estimate the user's attention availability:
- "high": User has significant cognitive capacity, can handle complex information
- "medium": User has moderate capacity, prefers clear, focused information
- "low": User has limited capacity, needs simple, essential information only

User data:
{json.dumps(user_data_only, indent=2)}

Key indicators for LOW attention:
- Short session duration
- Mobile device + evening/night time + many interactions
- High session duration with scattered attention (many appliances, short duration each)
- Context suggests multitasking or distraction

Key indicators for HIGH attention:
- Desktop device + morning/afternoon + focused interaction
- Sustained attention on specific appliances
- Home location with deep engagement

Key indicators for MEDIUM attention:
- Mixed signals from above indicators

Respond JUST with a JSON object containing:
1. "classification": Either "high", "medium", or "low"
2. "reasoning": A brief explanation (1-2 sentences) of WHY you assessed this attention level, citing context and interaction patterns

Example format:
{{
  "classification": "medium",
  "reasoning": "User is on mobile device in the afternoon at home, suggesting moderate focus. Session duration of 245.8s with multiple appliances indicates engaged but not deeply focused attention."
}}

Respond ONLY with the JSON object, nothing else.

Respond ONLY with the JSON object, nothing else.
Respond ONLY with valid JSON in this exact format:
{{
  "classification": "analytical/slow",
  "reasoning": "Your reasoning here"
}}
"""
        if self.use_ollama:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system",
                     "content": "You are a cognitive psychology expert specializing in attention and working memory."},
                    {"role": "user", "content": prompt}
                ],
                format="json",

                options={
                    "temperature": 0.3,
                    "num_predict": 10000  # equivalent to max_tokens
                }
            )
            response_content = response['message']['content']

            # Gestisci sia dict che string
            if isinstance(response_content, dict):
                result_json = response_content
            else:
                result_json = json.loads(response_content.strip())
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a cognitive psychology expert specializing in attention and working memory."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=150
            )
            result_json = json.loads(response.choices[0].message.content.strip())
        return result_json

    def create_user_profile(self, data_capture: Dict[str, Any], fairness_prompt:str,explainability_prompt:str) -> Dict[str, Any]:
        """
        Runs all three components and merges results with original data capture

        Args:
            data_capture: Dictionary from Layer 1 (dataCapture.json)

        Returns:
            Merged dictionary with original data + Layer 2 user modeling outputs (with reasoning)
        """
        # Run all three components
        cognitive_result = self.cognitive_profiler(data_capture, fairness_prompt, explainability_prompt)
        behavioral_result = self.behavioral_stage_detector(data_capture, fairness_prompt, explainability_prompt)
        attention_result = self.attention_availability(data_capture, fairness_prompt, explainability_prompt)

        # Create user modeling results with reasoning
        user_modeling_results = {
            "cognitive_mode": cognitive_result["classification"],
            "cognitive_mode_reasoning": cognitive_result["reasoning"],
            "behavioral_stage": behavioral_result["classification"],
            "behavioral_stage_reasoning": behavioral_result["reasoning"],
            "attention_availability": attention_result["classification"],
            "attention_availability_reasoning": attention_result["reasoning"],
            "modeling_timestamp": datetime.now().isoformat()
        }

        # Merge with original data capture
        enhanced_data = {
            **data_capture,
            "user_modeling": user_modeling_results
        }

        return enhanced_data
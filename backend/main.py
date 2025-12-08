
import json
import csv
import os
import shutil
from datetime import datetime
from tempfile import NamedTemporaryFile

from Data_Capture.dataCapture import DataCapture
from User_Modeling.userModeling import UserModeling
from Nudge_Intelligence.nudgeIntelligence import NudgeIntelligence
from UI_Adaptation.uiAdaptation import UIAdaptation
from Ethics.ethicsCompliance import EthicsCompliance
from Explainability.explainability import Explainability
from Fairness.fairness import FairnessMonitor

class AIRANEPipeline:


    def __init__(self, openai_api_key=None, output_dir="output", use_ollama=False, model="qwen3:8b"):
        self.api_key = openai_api_key
        self.output_dir = output_dir
        self.use_ollama = use_ollama
        self.model = model
        self.csv_filename = "User.csv"

        os.makedirs(output_dir, exist_ok=True)

        self.layer2 = UserModeling(api_key=self.api_key,  use_ollama=False, model=model)
        self.layer3 = NudgeIntelligence(api_key=self.api_key,  use_ollama=False, model=model)
        self.layer4 = UIAdaptation(api_key=self.api_key,  use_ollama=False, model=model)
        self.ethics = EthicsCompliance()
        self.fairness = FairnessMonitor()
        self.explainability = Explainability()

        print("="*80)
        print(" Pipeline Initialized")
        print("="*80)

    def load_data_from_json(self, json_filepath):
        try:
            with open(json_filepath, 'r') as f:
                data = json.load(f)
            print(f"✓ Loaded data from: {json_filepath}")
            return data
        except FileNotFoundError:
            print(f"❌ ERROR: File not found: {json_filepath}")
            raise
        except json.JSONDecodeError as e:
            print(f"❌ ERROR: Invalid JSON format: {e}")
            raise

    def run_pipeline_from_json(self, json_filepath, save_intermediates=True):

        input_data = self.load_data_from_json(json_filepath)

        user_id = input_data.get('user_id')
        session_id = input_data.get('session_id')
        timestamp = input_data.get('timestamp')
        session_duration_sec = input_data.get('session_duration_sec')
        current_price = input_data.get('current_price', 0.0)

        raw_emotion = input_data.get('user_emotion')
        user_emotion = "neutral"
        happy_score = 0.0

        if isinstance(raw_emotion, dict):
            user_emotion = max(raw_emotion, key=raw_emotion.get)
            happy_score = raw_emotion.get('happy', 0.0)
        else:
            user_emotion = raw_emotion if raw_emotion else "neutral"

        electrodomestic_interactions = input_data.get('electrodomestic_interactions', [])

        time_of_day = "unknown"
        if timestamp:
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                hour = dt.hour
                if 6 <= hour < 12: time_of_day = "morning"
                elif 12 <= hour < 18: time_of_day = "afternoon"
                elif 18 <= hour < 22: time_of_day = "evening"
                else: time_of_day = "night"
            except ValueError:
                pass

        context = {
            "time_of_day": time_of_day,
            "location": "home",
            "device_type": "desktop" if "Macintosh" in input_data.get('device', '') or "Windows" in input_data.get('device', '') else "mobile"
        }

        previous_nudges = input_data.get('previous_nudges', [])

        print("\n" + "=" * 80)
        print(f"Running AIRANE Pipeline for User: {user_id}")
        print("=" * 80)

        # LAYER 1: Data_Capture
        print("\n[Layer 1] Data_Capture - Using data from JSON file...")

        data_capture = {
            "user_id": user_id,
            "session_id": session_id,
            "timestamp": timestamp,
            "session_duration_sec": session_duration_sec,
            "current_price": current_price,
            "user_emotion": user_emotion,
            "electrodomestic_interactions": electrodomestic_interactions,
            "context": context
        }

        if save_intermediates:
            self._save_json(data_capture, "dataCapture.json")


        ethics_prompt = self.ethics.get_regulatory_compliance_prompt()
        fairness_prompt = self.fairness.get_fairness_constraint_prompt()
        explainability_prompt = self.explainability.get_explanation_instructions()

        # LAYER 2: User_Modeling
        print("\n[Layer 2] User_Modeling - Creating user profile with LLM...")

        data_capture_with_history = {**data_capture, "previous_nudges": previous_nudges}

        user_profile = self.layer2.create_user_profile(
            data_capture_with_history,
            fairness_prompt,
            explainability_prompt
        )

        if save_intermediates:
            self._save_json(user_profile, "userModeling.json")

        # LAYER 3: Nudge_Intelligence
        print("\n[Layer 3] Nudge_Intelligence - Selecting strategy and generating nudge...")

        final_output = self.layer3.create_nudge(
            user_profile,
            ethics_prompt=ethics_prompt,
            fairness_prompt=fairness_prompt,
            explainability_prompt=explainability_prompt
        )

        print("✓ Nudge Generated:")
        print(f"  Strategy: {final_output['nudge_intelligence']['selected_strategy']}")

        if save_intermediates:
            self._save_json(final_output, "nudgeIntelligence.json")

        # LAYER 4: UI_Adaptation
        print("\n[Layer 4] UI_Adaptation - Generating personalized UI configuration...")

        final_output_with_ui = self.layer4.create_ui_adaptation(final_output)


        final_output_with_ui['pre_nudge_emotion'] = user_emotion
        final_output_with_ui['pre_nudge_happy_score'] = happy_score
        final_output_with_ui['post_nudge_emotion'] = "PENDING"
        final_output_with_ui['post_nudge_happy_score'] = "PENDING"

        if save_intermediates:
            self._save_json(final_output_with_ui, "finalOutput.json")
            self._save_csv(final_output_with_ui, self.csv_filename)

        print("\n" + "=" * 80)
        print("✓  Pipeline Complete!")
        print("=" * 80)

        final_output_with_ui['session_id'] = session_id
        return final_output_with_ui

    def record_outcome(self, session_id, post_nudge_emotion, post_nudge_happy_score=0.0):

        print(f"\n[Outcome Tracker] Receiving feedback for Session {session_id}...")

        filepath = os.path.join(self.output_dir, self.csv_filename)

        temp_file = NamedTemporaryFile(mode='w', delete=False, newline='', encoding='utf-8')

        updated = False
        try:
            if not os.path.exists(filepath):
                print("❌ CSV file does not exist yet.")
                return False

            with open(filepath, 'r', encoding='utf-8') as csvfile, temp_file:
                reader = csv.DictReader(csvfile)

                original_fieldnames = reader.fieldnames if reader.fieldnames else []
                fieldnames = list(original_fieldnames)
                if 'post_nudge_emotion' not in fieldnames:
                    fieldnames.append('post_nudge_emotion')
                if 'pre_nudge_happy_score' not in fieldnames:
                    fieldnames.append('pre_nudge_happy_score')
                if 'post_nudge_happy_score' not in fieldnames:
                    fieldnames.append('post_nudge_happy_score')

                writer = csv.DictWriter(temp_file, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()

                for row in reader:
                    if None in row:
                        del row[None]

                    if row.get('session_id') == session_id:
                        print(f"  -> Updating row: Pre='{row.get('pre_nudge_emotion')}' (Happy: {row.get('pre_nudge_happy_score')}) | Post='{post_nudge_emotion}' (Happy: {post_nudge_happy_score})")
                        row['post_nudge_emotion'] = post_nudge_emotion
                        row['post_nudge_happy_score'] = post_nudge_happy_score
                        updated = True
                    writer.writerow(row)

            shutil.move(temp_file.name, filepath)

            if updated:
                print("✓ Outcome successfully recorded in CSV.")
                return True
            else:
                print(f"❌ Session ID {session_id} not found in CSV.")
                return False

        except Exception as e:
            print(f"❌ Error updating CSV: {str(e)}")
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
            return False

    def _save_json(self, data, filename):
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  -> Saved JSON: {filepath}")

    def _save_csv(self, data, filename):
        filepath = os.path.join(self.output_dir, filename)

        def flatten_json(y):
            out = {}
            def flatten(x, name=''):
                if type(x) is dict:
                    for a in x:
                        flatten(x[a], name + a + '_')
                elif type(x) is list:
                    out[name[:-1]] = json.dumps(x)
                else:
                    out[name[:-1]] = x
            flatten(y)
            return out

        try:
            flat_data = flatten_json(data)

            file_exists = os.path.isfile(filepath)



            existing_headers = []
            if file_exists:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    try:
                        existing_headers = next(reader)
                    except StopIteration:
                        pass # Empty file

            current_keys = list(flat_data.keys())

            missing_headers = [k for k in current_keys if k not in existing_headers]

            if file_exists and missing_headers:
                print(f"  -> Updating CSV header with new fields: {missing_headers}")
                temp_file = NamedTemporaryFile(mode='w', delete=False, newline='', encoding='utf-8')
                new_headers = existing_headers + missing_headers

                with open(filepath, 'r', encoding='utf-8') as infile, temp_file:
                    reader = csv.DictReader(infile)
                    writer = csv.DictWriter(temp_file, fieldnames=new_headers, extrasaction='ignore')
                    writer.writeheader()
                    for row in reader:
                        if None in row: del row[None] # Sanitize
                        writer.writerow(row)

                shutil.move(temp_file.name, filepath)
                file_exists = True

            with open(filepath, 'a' if file_exists else 'w', newline='', encoding='utf-8') as f:


                if file_exists:
                     with open(filepath, 'r', encoding='utf-8') as r:
                        fieldnames = next(csv.reader(r))
                else:
                    fieldnames = list(flat_data.keys())

                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                if not file_exists or os.stat(filepath).st_size == 0:
                    writer.writeheader()
                writer.writerow(flat_data)

            print(f"  -> Saved/Appended to CSV: {filepath}")
        except Exception as e:
            print(f"  ❌ Error saving CSV: {str(e)}")

    def display_summary(self, output):
        if 'user_data' in output and isinstance(output['user_data'], dict):
            output = {**output.get('user_data', {}), **output}
        print("\n" + "="*80)
        print(" PIPELINE SUMMARY")
        print("="*80)
        print(f"\nUser: {output.get('user_id', 'N/A')}")
        ni = output.get('nudge_intelligence', {})
        print(f"Strategy: {ni.get('selected_strategy', 'N/A')}")
        print(f"Message: \"{ni.get('nudge_message', 'N/A')}\"")
        if 'ui_adaptation' in output:
            ui = output['ui_adaptation']
            print(f"Colors: {ui.get('primary_colour')}")
        print("\n" + "="*80)

def main():
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")
    pipeline = AIRANEPipeline(
        openai_api_key=OPENAI_API_KEY,
        use_ollama=True,
        model="qwen3:14b",
    )
    json_filepath = "initialData.json"
    try:
        if os.path.exists(json_filepath):
            result = pipeline.run_pipeline_from_json(json_filepath=json_filepath)
            pipeline.display_summary(result)
        else:
            print(f"Waiting for {json_filepath}...")
    except Exception as e:
        print(f"\n❌ Pipeline failed: {str(e)}")

if __name__ == "__main__":
    main()
from datetime import datetime
from typing import Dict, Any, List
import uuid


class DataCapture:

    def __init__(self, user_id: str = None):
        self.user_id = user_id or str(uuid.uuid4())
        self.session_id = str(uuid.uuid4())
        self.user_emotion = None
        self.session_start = datetime.now()

    def collect_behavioral_data(self,
                                electrodomestic_interactions: List[Dict[str, Any]]) -> Dict[str, Any]:

        behavioral_data = {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "timestamp": datetime.now().isoformat(),
            "session_duration_sec": (datetime.now() - self.session_start).total_seconds(),
            "user_emotion": self.user_emotion,
            "electrodomestic_interactions": []
        }

        for interaction in electrodomestic_interactions:
            appliance_data = {
                "appliance_type": interaction.get("appliance_type"),
                "clicks": interaction.get("clicks", 0),
                "scrolls": interaction.get("scrolls", 0),
                "hesitation_ms": interaction.get("hesitation", 0),
                "usage_hours_yesterday": interaction.get("usage_hours_yesterday", 0.0),
                "usage_hours_last_week": interaction.get("usage_hours_last_week", 0.0),
                "appliance_watt_consumption": interaction.get("appliance_watt_consumption", 0)
            }
            behavioral_data["electrodomestic_interactions"].append(appliance_data)

        return behavioral_data

    def collect_context_data(self,
                             time_of_day: str = None,
                             location: str = None,
                             device_type: str = None) -> Dict[str, Any]:

        current_time = datetime.now()

        if time_of_day is None:
            hour = current_time.hour
            if 6 <= hour < 12:
                time_of_day = "morning"
            elif 12 <= hour < 18:
                time_of_day = "afternoon"
            elif 18 <= hour < 22:
                time_of_day = "evening"
            else:
                time_of_day = "night"

        context_data = {
            "time_of_day": time_of_day,
            "location": location,
            "device_type": device_type
        }

        return context_data

    def capture_all(self,
                    electrodomestic_interactions: List[Dict[str, Any]],
                    time_of_day: str = None,
                    location: str = None,
                    device_type: str = None) -> Dict[str, Any]:

        behavioral = self.collect_behavioral_data(electrodomestic_interactions)
        context = self.collect_context_data(time_of_day, location, device_type)

        merged_data = {
            **behavioral,
            "context": context
        }

        return merged_data

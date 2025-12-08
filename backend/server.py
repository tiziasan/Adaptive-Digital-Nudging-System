# server.py
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# Import your existing pipeline
from main import AIRANEPipeline

app = FastAPI()

# Enable CORS (Allows your React app on port 5173 to talk to this Python script)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your pipeline once on startup
pipeline = AIRANEPipeline(
    openai_api_key=os.getenv("OPENAI_API_KEY", "your-key-here"),
    use_ollama=True,  # Set to False if using OpenAI
    model="qwen3:14b"
)


@app.post("/api/run-pipeline")
async def run_pipeline_endpoint(data: Dict[str, Any]):
    """
    Receives the JSON from React, saves it as initialData.json,
    and runs the pipeline.
    """
    try:
        print("📥 Received data from React...")

        # 1. Save data
        file_path = "initialData.json"
        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)

        print(f"✅ Saved data to {file_path}")

        # 2. Run pipeline
        result = pipeline.run_pipeline_from_json(
            json_filepath=file_path,
            save_intermediates=True
        )

        # 3. Return result
        return {
            "status": "success",
            "message": "Pipeline executed successfully",
            "data": result
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/record-outcome")
async def record_outcome_endpoint(data: Dict[str, Any]):
    """
    Reciprocal Feedback Endpoint
    React calls this AFTER the user has seen the nudge and their emotion is measured again.
    """
    try:
        session_id = data.get("session_id")
        post_nudge_emotion = data.get("post_nudge_emotion")
        # Extract the happy score (default to 0.0 if missing)
        post_nudge_happy_score = data.get("post_nudge_happy_score", 0.0)

        if not session_id or not post_nudge_emotion:
            raise HTTPException(status_code=400, detail="Missing session_id or post_nudge_emotion")

        # Call the pipeline method to update the CSV, now passing the happy score
        success = pipeline.record_outcome(session_id, post_nudge_emotion, post_nudge_happy_score)

        if success:
            return {"status": "success", "message": "Feedback recorded in CSV"}
        else:
            raise HTTPException(status_code=404, detail="Session not found in CSV")

    except Exception as e:
        print(f"❌ Error recording outcome: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    print("🚀 Starting Nudging API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
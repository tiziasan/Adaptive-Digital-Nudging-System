# server.py
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# Import your existing pipeline
from main import AIRANEPipeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = AIRANEPipeline(
    openai_api_key=os.getenv("OPENAI_API_KEY", "your-key-here"),
    use_ollama=True,
    model="qwen3:8b"
)


@app.post("/api/run-pipeline")
async def run_pipeline_endpoint(data: Dict[str, Any]):

    try:
        print("📥 Received data from React...")

        file_path = "initialData.json"
        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)

        print(f"✅ Saved data to {file_path}")

        result = pipeline.run_pipeline_from_json(
            json_filepath=file_path,
            save_intermediates=True
        )

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

    try:
        session_id = data.get("session_id")
        post_nudge_emotion = data.get("post_nudge_emotion")
        post_nudge_happy_score = data.get("post_nudge_happy_score", 0.0)

        if not session_id or not post_nudge_emotion:
            raise HTTPException(status_code=400, detail="Missing session_id or post_nudge_emotion")

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

    print(" Starting Nudging API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
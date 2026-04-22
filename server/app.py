import json
import os
from pathlib import Path
from urllib import error, request as urlrequest

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"
ENV_FILES = [BASE_DIR / ".env.local", BASE_DIR / ".env"]
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

app = Flask(__name__, static_folder=str(PUBLIC_DIR), static_url_path="")


def load_local_env() -> None:
    for env_file in ENV_FILES:
        if not env_file.exists():
            continue

        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'\"")

            if key and key not in os.environ:
                os.environ[key] = value


def get_gemini_api_key() -> str:
    load_local_env()
    return os.environ.get("GEMINI_API_KEY", "").strip()


def build_prompt(user_input: str) -> str:
    return (
        "You are a helpful healthcare assistant chatbot. "
        "Provide general wellness guidance only, not medical diagnosis. "
        "Be concise, empathetic, and practical. "
        "Always include a brief disclaimer that you are an AI and not a doctor, "
        "and advise urgent symptoms to seek professional care. "
        f"User question: {user_input}"
    )


def generate_gemini_reply(user_input: str) -> str:
    api_key = get_gemini_api_key()
    if not api_key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY. Add it to a local .env.local file or your environment."
        )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": build_prompt(user_input),
                    }
                ]
            }
        ]
    }

    body = json.dumps(payload).encode("utf-8")
    gemini_request = urlrequest.Request(
        f"{GEMINI_API_URL}?key={api_key}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlrequest.urlopen(gemini_request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini API request failed: {error_body}") from exc
    except error.URLError as exc:
        raise RuntimeError("Could not reach the Gemini API.") from exc

    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError("Gemini API returned no candidates.")

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise RuntimeError("Gemini API returned an empty response.")

    return text


def fallback_reply(user_input: str, reason: str) -> str:
    lowered = user_input.lower()

    if "sleep" in lowered:
        guidance = (
            "Two simple sleep tips: keep the same bedtime each night and avoid screens "
            "for about 30 to 60 minutes before bed."
        )
    elif "headache" in lowered:
        guidance = (
            "For a mild headache, rest, drink some water, and consider whether stress, "
            "poor sleep, or dehydration may be contributing."
        )
    elif "stress" in lowered or "anxiety" in lowered:
        guidance = (
            "Try a short walk, slow breathing for a few minutes, and reducing stimulation "
            "for a little while."
        )
    else:
        guidance = (
            "I can still offer general wellness guidance right now, even though the live AI "
            "service is temporarily unavailable."
        )

    if "quota" in reason.lower() or "resource_exhausted" in reason.lower():
        availability_note = (
            "The AI service is temporarily busy or out of quota, so I am using a local backup response."
        )
    else:
        availability_note = (
            "The AI service is temporarily unavailable, so I am using a local backup response."
        )

    return (
        f"{guidance} {availability_note} "
        "I am not a doctor, and if symptoms are severe, sudden, or getting worse, "
        "please contact a medical professional."
    )


@app.get("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    user_input = str(payload.get("text", "")).strip()

    if not user_input:
        return jsonify({"reply": "Please enter a message before sending."}), 400

    try:
        reply = generate_gemini_reply(user_input)
    except RuntimeError as exc:
        return jsonify({"reply": fallback_reply(user_input, str(exc))}), 200

    return jsonify({"reply": reply})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)

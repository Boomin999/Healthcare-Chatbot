from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = BASE_DIR / "public"

app = Flask(__name__, static_folder=str(PUBLIC_DIR), static_url_path="")


@app.get("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    user_input = str(payload.get("text", "")).strip()

    if not user_input:
        return jsonify({"reply": "Please enter a message before sending."}), 400

    return jsonify({"reply": f"You said: {user_input}"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)

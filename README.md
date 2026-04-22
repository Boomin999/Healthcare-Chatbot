# Healthcare Chatbot

A simple full-stack healthcare chatbot demo built with Flask and a lightweight HTML/CSS/JavaScript frontend.

This project is designed for general wellness guidance only. It is not a replacement for professional medical advice, diagnosis, or treatment.

## Features

- Chat-style interface for general wellness questions
- Quick prompts for symptoms, sleep, stress, nutrition, exercise, and hydration
- Local chat history saved in the browser
- Theme toggle and clear chat controls
- Flask backend with a simple JSON chat endpoint

## Project Structure

```text
.
|-- public/
|   |-- index.html
|   |-- script.js
|   `-- style.css
|-- server/
|   |-- app.py
|   `-- requirements.txt
|-- .gitignore
|-- LICENSE
`-- README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd healthcare-chatbot
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r server/requirements.txt
```

### 4. Run the app

```bash
python server/app.py
```

Then open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

## API

### `POST /chat`

Request body:

```json
{
  "text": "How can I improve my sleep?"
}
```

Example response:

```json
{
  "reply": "You said: How can I improve my sleep?"
}
```

## Notes

- The current backend returns a simple echo response and can be extended with real chatbot or AI logic.
- For safety, healthcare-related answers should always include appropriate medical disclaimers if you connect this to an LLM or external service.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

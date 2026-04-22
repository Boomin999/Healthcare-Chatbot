from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('text')
    # Here you would typically process the user input and generate a response
    # For demonstration purposes, we'll just echo the input back
    response = {
        'reply': f"You said: {user_input}"
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
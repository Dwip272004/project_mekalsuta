from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'  # Secret key for sessions
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow cross-origin requests

@app.route('/')
def index():
    return render_template('index.html')

# WebRTC signaling
@socketio.on('message')
def handle_message(data):
    # Broadcast signaling messages to all connected clients except the sender
    emit('message', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Default to port 5000 if not set
    socketio.run(app, host='0.0.0.0', port=port, debug=True)

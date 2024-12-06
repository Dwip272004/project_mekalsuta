from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

# WebRTC signaling
@socketio.on('message')
def handle_message(data):
    # Forward signaling messages to the other peer
    emit('message', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)

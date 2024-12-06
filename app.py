from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app)

# In-memory set to store active users
active_users = []

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join')
def handle_join(data):
    user_id = request.sid  # Use the session ID to identify the user
    active_users.append(user_id)
    
    print(f'{user_id} joined. Active users: {active_users}')

    # Notify all clients about the new user
    if len(active_users) == 2:
        # Notify both users that they are connected for a call
        emit('start_call', {'peer': active_users[1]}, room=active_users[0])
        emit('start_call', {'peer': active_users[0]}, room=active_users[1])

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.sid
    active_users.remove(user_id)
    print(f'{user_id} disconnected. Remaining users: {active_users}')

# WebRTC signaling
@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, room=data['target'])

@socketio.on('answer')
def handle_answer(data):
    emit('answer', data, room=data['target'])

@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    emit('ice_candidate', data, room=data['target'])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)

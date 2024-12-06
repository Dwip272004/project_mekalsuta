const socket = io.connect(window.location.origin);
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
let localStream, peerConnection;
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ]
};


navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
    });

    socket.on('message', async (message) => {
        console.log('Received message:', message); // Debug
        if (message.type === 'offer') {
            console.log('Received offer');
            createPeerConnection();
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('message', peerConnection.localDescription);
        } else if (message.type === 'answer') {
            console.log('Received answer');
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        } else if (message.type === 'candidate') {
            console.log('Received ICE candidate');
            const candidate = new RTCIceCandidate(message.candidate);
            await peerConnection.addIceCandidate(candidate);
        }
    });
    

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    // Handle new tracks
    peerConnection.ontrack = (event) => {
        console.log('Remote track received', event);
        remoteVideo.srcObject = event.streams[0]; // Attach remote stream
    };

    // Add local tracks
    localStream.getTracks().forEach((track) => {
        console.log('Adding local track:', track);
        peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('message', { type: 'candidate', candidate });
        }
    };
}


async function startCall() {
    startCallButton.disabled = true;
    endCallButton.disabled = false;
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('message', peerConnection.localDescription);
}

function endCall() {
    peerConnection.close();
    peerConnection = null;
    startCallButton.disabled = false;
    endCallButton.disabled = true;
    remoteVideo.srcObject = null;
    alert('Call ended!');
}

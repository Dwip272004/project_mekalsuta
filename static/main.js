const socket = io(); // Connect to the signaling server

let localStream;
let peerConnection;
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' } // Public STUN server
    ]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Get local media (camera & microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localStream = stream;
        localVideo.srcObject = stream;

        // Automatically create a peer connection and start signaling
        createPeerConnection();
        localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    })
    .catch((error) => {
        console.error('Error accessing media devices:', error);
    });

// Create peer connection and set up event handlers
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    // Handle incoming remote media streams
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('message', { type: 'candidate', candidate });
        }
    };
}

// Handle signaling messages
socket.on('message', async (message) => {
    console.log('Received message:', message);

    if (message.type === 'offer') {
        // Handle incoming offer
        if (!peerConnection) createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('message', peerConnection.localDescription);
    } else if (message.type === 'answer') {
        // Handle incoming answer
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate') {
        // Add incoming ICE candidate
        const candidate = new RTCIceCandidate(message.candidate);
        await peerConnection.addIceCandidate(candidate);
    }
});

// Automatically start the call by sending an offer
socket.on('connect', async () => {
    if (!peerConnection) createPeerConnection();

    // Create and send an offer when the user connects
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('message', peerConnection.localDescription);
});

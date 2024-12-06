const socket = io.connect(window.location.origin);
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
let localStream, peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
    });

socket.on('message', async message => {
    if (message.type === 'offer') {
        createPeerConnection();
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('message', peerConnection.localDescription);
    } else if (message.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate') {
        const candidate = new RTCIceCandidate(message.candidate);
        await peerConnection.addIceCandidate(candidate);
    }
});

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('message', { type: 'candidate', candidate });
        }
    };
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
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

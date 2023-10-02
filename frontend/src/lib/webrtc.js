import IO from 'socket.io-client';
import promise from './socket.io-promise';

const ICE_SERVERS = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];
const USE_AUDIO = true;
const USE_VIDEO = true;

const gapBetweenTiles = 5;
let signalingSocket = null; /* our socket.io connection to our webserver */
let localMediaStream = null; /* our own microphone / webcam */
let peers = {}; /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
let channel = {}; /* keep track of the peers Info in the channel, indexed by peer_id (aka socket.io id) */
let peerMediaElements = {}; /* keep track of our <video>/<audio> tags, indexed by peer_id */
let dataChannels = {};

const attachMediaStream = (element, stream) => (element.srcObject = stream);

const getVideoElement = (peerId, name, isLocal) => {
	const videoWrap = document.createElement("div");
	videoWrap.className = "video";
	const media = document.createElement("video");
	media.setAttribute("playsinline", true);
	media.autoplay = true;
	media.controls = false;
	if (isLocal) {
		media.setAttribute("id", "selfVideo");
		media.className = "mirror";
		media.muted = true;
		media.volume = 0;
	} else {
		media.mediaGroup = "remotevideo";
	}
	const audioEnabled = document.createElement("i");
	audioEnabled.setAttribute("id", peerId + "_audioEnabled");
	audioEnabled.className = "audioEnabled icon-mic";

	const peerNameEle = document.createElement("div");
	peerNameEle.setAttribute("id", peerId + "_videoPeerName");
	peerNameEle.className = "videoPeerName";
	if (isLocal) {
		peerNameEle.innerHTML = `${name ?? ""} (you)`;
	} else {
		peerNameEle.innerHTML = "Unnamed";
	}

	videoWrap.setAttribute("id", peerId);
	videoWrap.appendChild(media);
	videoWrap.appendChild(audioEnabled);
	videoWrap.appendChild(peerNameEle);
	document.getElementById("videos").appendChild(videoWrap);
	return media;
}

const setupLocalMedia = (peerId, name, callback, errorback) => {
	if (localMediaStream != null) {
		if (callback) callback();
		return;
	}

	navigator.mediaDevices
		.getUserMedia({ audio: USE_AUDIO, video: USE_VIDEO })
		.then((stream) => {
			localMediaStream = stream;
			const localMedia = getVideoElement(peerId, name, true);
			attachMediaStream(localMedia, stream);
			resizeVideos();
			if (callback) callback();
		})
		.catch(() => {
			alert("This site will not work without camera/microphone access.");
			if (errorback) errorback();
		});
}

const joinChatChannel = (channel, userData) => {
	if(!signalingSocket) return;
  signalingSocket.emit("join", { channel: channel, userData: userData });
}

const resizeVideos = () => {
	const videos = document.querySelectorAll("#videos .video");
	const elementsInARowCount = Math.ceil(Math.sqrt(videos.length));
	// videos.forEach((element) => {
  //   element.style.width = `calc(calc(50% / ${elementsInARowCount}) - ${gapBetweenTiles}px)`;
  // });
}

const initiateCall = (name, roomId) => {
  const userAgent = navigator.userAgent;
	const isMobileDevice = !!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
		userAgent.toUpperCase() || ""
	);
	const isTablet =
		/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
			userAgent.toLowerCase()
		);
	const isIpad = /macintosh/.test(userAgent.toLowerCase()) && "ontouchend" in document;
	const isDesktop = !isMobileDevice && !isTablet && !isIpad;

  const roomLink = `${import.meta.env.VITE_BACKEND_URL}/`;
	signalingSocket = IO(roomLink);
	signalingSocket.request = promise(signalingSocket);
	
	signalingSocket.on("connect", () => {
		const peerId = signalingSocket.id;
		console.log("peerId: " + peerId);
		if(!peerId) return;

		const userData = {
			peerName: name,
			videoEnabled: true,
			audioEnabled: true,
			userAgent: userAgent,
			isMobileDevice: isMobileDevice,
			isTablet: isTablet,
			isIpad: isIpad,
			isDesktop: isDesktop,
		};

		if (localMediaStream) joinChatChannel(roomId, userData);
		else
			setupLocalMedia(peerId, name, function () {
				joinChatChannel(roomId, userData);
			});
	});

	signalingSocket.on("disconnect", function () {
		for (let peer_id in peerMediaElements) {
			document.getElementById("videos").removeChild(peerMediaElements[peer_id].parentNode);
			resizeVideos();
		}
		for (let peer_id in peers) {
			peers[peer_id].close();
		}

		peers = {};
		peerMediaElements = {};
	});

	signalingSocket.on("addPeer", function (config) {
		//console.log("addPeer", config);

		const peer_id = config.peer_id;
		if (peer_id in peers) return;

		channel = config.channel;
		console.log('[Join] - connected peers in the channel', JSON.stringify(channel, null, 2));

		const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
		peers[peer_id] = peerConnection;

		peerConnection.onicecandidate = function (event) {
			if (event.candidate) {
				signalingSocket.emit("relayICECandidate", {
					peer_id: peer_id,
					ice_candidate: {
						sdpMLineIndex: event.candidate.sdpMLineIndex,
						candidate: event.candidate.candidate,
					},
				});
			}
		};

		peerConnection.onaddstream = function (event) {
			if (!channel[peer_id]["userData"]["userAgent"]) return;
			//console.log("onaddstream", event);

			const remoteMedia = getVideoElement(peer_id);
			peerMediaElements[peer_id] = remoteMedia;
			attachMediaStream(remoteMedia, event.stream);
			resizeVideos();

			for (let peerId in channel) {
				const videoPeerName = document.getElementById(peerId + "_videoPeerName");
				const peerName = channel[peerId]["userData"]["peerName"];
				if (videoPeerName && peerName) {
					videoPeerName.innerHTML = peerName;
				}

			// 	const videoAvatarImg = document.getElementById(peerId + "_videoEnabled");
			// 	const videoEnabled = channel[peerId]["userData"]["videoEnabled"];
			// 	if (videoAvatarImg && !videoEnabled) {
			// 		videoAvatarImg.style.visibility = "visible";
			// 	}

				const audioEnabledEl = document.getElementById(peerId + "_audioEnabled");
				const audioEnabled = channel[peerId]["userData"]["audioEnabled"];
				if (audioEnabledEl) {
					audioEnabledEl.className = "audioEnabled icon-mic" + (audioEnabled ? "" : "-off");
				}
			}
		};

		peerConnection.ondatachannel = function (event) {
			console.log("Datachannel event" + peer_id, event);
			event.channel.onmessage = (msg) => {
				let dataMessage = {};
				try {
					dataMessage = JSON.parse(msg.data);
					console.log("dataMessage", dataMessage)
					//App.handleIncomingDataChannelMessage(dataMessage);
				} catch (err) {
					console.log(err);
				}
			};
		};

		/* Add our local stream */
		peerConnection.addStream(localMediaStream);
		dataChannels[peer_id] = peerConnection.createDataChannel("talk__data_channel");

		if (config.should_create_offer) {
			peerConnection.onnegotiationneeded = () => {
				peerConnection
					.createOffer()
					.then((localDescription) => {
						peerConnection
							.setLocalDescription(localDescription)
							.then(() => {
								signalingSocket.emit("relaySessionDescription", {
									peer_id: peer_id,
									session_description: localDescription,
								});
							})
							.catch(() => {
								alert("Offer setLocalDescription failed!");
							});
					})
					.catch((error) => {
						console.log("Error sending offer: ", error);
					});
			};
		}
	});

	signalingSocket.on("sessionDescription", function (config) {
		const peer_id = config.peer_id;
		const peer = peers[peer_id];
		const remoteDescription = config.session_description;

		const desc = new RTCSessionDescription(remoteDescription);
		peer.setRemoteDescription(
			desc,
			() => {
				if (remoteDescription.type == "offer") {
					peer.createAnswer(
						(localDescription) => {
							peer.setLocalDescription(
								localDescription,
								() => {
									signalingSocket.emit("relaySessionDescription", {
										peer_id: peer_id,
										session_description: localDescription,
									});
								},
								() => alert("Answer setLocalDescription failed!")
							);
						},
						(error) => console.log("Error creating answer: ", error)
					);
				}
			},
			(error) => console.log("setRemoteDescription error: ", error)
		);
	});

	signalingSocket.on("iceCandidate", function (config) {
		const peer = peers[config.peer_id];
		const iceCandidate = config.ice_candidate;
		peer.addIceCandidate(new RTCIceCandidate(iceCandidate)).catch((error) => {
			console.log("Error addIceCandidate", error);
		});
	});

	signalingSocket.on("removePeer", function (config) {
		const peer_id = config.peer_id;
		if (peer_id in peerMediaElements) {
			document.getElementById("videos").removeChild(peerMediaElements[peer_id].parentNode);
			resizeVideos();
		}
		if (peer_id in peers) {
			peers[peer_id].close();
		}
		delete dataChannels[peer_id];
		delete peers[peer_id];
		delete peerMediaElements[config.peer_id];

		delete channel[config.peer_id];
		//console.log('removePeer', JSON.stringify(channel, null, 2));
	});
}

export {
  initiateCall
}
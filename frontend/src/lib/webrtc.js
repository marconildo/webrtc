import IO from 'socket.io-client';
import promise from './socket.io-promise';
import Chromatism from 'chromatism';

const ICE_SERVERS = [
	{ urls: "stun:stun.l.google.com:19302" },
	{ urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
];
const USE_AUDIO = true;
const USE_VIDEO = true;

// const gapBetweenTiles = 5;
let peerId = null;
let signalingSocket = null; /* our socket.io connection to our webserver */
let localMediaStream = null; /* our own microphone / webcam */
let peers = {}; /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
let channel = {}; /* keep track of the peers Info in the channel, indexed by peer_id (aka socket.io id) */
let peerMediaElements = {}; /* keep track of our <video>/<audio> tags, indexed by peer_id */
let dataChannels = {};

const generateInitials = (
  name,
  size = 2,
  keepCase = false,
  allowSpecialCharacters = false
) => {
  let nameOrInitials = name.trim();

  if (!keepCase) {
    nameOrInitials = nameOrInitials.toUpperCase();
  }

  if (!allowSpecialCharacters) {
    nameOrInitials = nameOrInitials.replace(/[!@#$%^&*(),.?":{}|<>_]/g, "");
  }
  nameOrInitials = nameOrInitials.trim().trim("-");
  let names = nameOrInitials.split(" ");

  names = names.map(function (namePart) {
    return namePart.split("-");
  });
  let realNames = [];
  for (let namePart of names.flat()) {
    realNames.push(namePart);
  }
  names = realNames;

  let initials = nameOrInitials;
  let assignedNames = 0;
  if (names.length > 1) {
    initials = "";
    let start = 0;
    for (let i = 0; i < size; i++) {
      let index = i;
      if ((index === size - 1 && index > 0) || index > names.length - 1) {
        index = names.length - 1;
      }
      if (assignedNames >= names.length) {
        start++;
      }
      initials += names[index].substr(start, 1);
      assignedNames++;
    }
  }
  initials = initials.substr(0, size);
  return initials;
}

const drawCircle = (text, size, color) => {
  var textSize = Math.ceil(size / 2.5);
  var font = 'Proxima Nova, proxima-nova, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif';
  var colors = ["#1abc9c", "#16a085", "#f1c40f", "#f39c12", "#2ecc71", "#27ae60", "#e67e22", "#d35400", "#3498db", "#2980b9", "#e74c3c", "#c0392b", "#9b59b6", "#8e44ad", "#bdc3c7", "#34495e", "#2c3e50", "#95a5a6", "#7f8c8d", "#ec87bf", "#d870ad", "#f69785", "#9ba37e", "#b49255", "#b49255", "#a94136"];
  var colorIndex = Math.floor((text.charCodeAt(0) - 65) % colors.length);
	var finalColor = color || colors[colorIndex];

	// const size = options.size || 128
  // const background = options.background || '#'+Math.floor(Math.random()*16777215).toString(16)
  // const { hex: foreground } = Chromatism.contrastRatio(background)
  
  var template = [
    '<svg height="' + size + '" width="' + size + '">',
    '<circle fill="' + finalColor +'" width="' + size + '" height="' + size + '" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + size /2 + '"/>',
  	'<text text-anchor="middle" x="50%" y="50%" dy="0.35em" fill="white" font-size="' + textSize + '" font-family="' + font + '">' + generateInitials(text) + '</text>',
    '</svg>'
  ];
  
  return template.join('');
}

const attachMediaStream = (element, stream) => (element.srcObject = stream);

const getVideoElement = (name, isLocal) => {
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

	const videoAvatarImg = document.createElement("div");

	videoWrap.setAttribute("id", peerId);
	videoWrap.appendChild(media);
	videoWrap.appendChild(audioEnabled);
	videoWrap.appendChild(peerNameEle);
	document.getElementById("videos").appendChild(videoWrap);
	return media;
}

const setupLocalMedia = (name, callback, errorback) => {
	if (localMediaStream != null) {
		if (callback) callback();
		return;
	}

	navigator.mediaDevices
		.getUserMedia({ audio: USE_AUDIO, video: USE_VIDEO })
		.then((stream) => {
			localMediaStream = stream;
			const localMedia = getVideoElement(name, true);
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
		peerId = signalingSocket.id;
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
			setupLocalMedia(name, function () {
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
  initiateCall,
	localMediaStream,
	peerId
}
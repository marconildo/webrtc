import { 
  updateUserDataChannel,
  shareScreen,
  stopShareScreen,
  peerId,
  currentName
} from "./webrtc"

const updateUserData = (key, value, callback) => {
  if(key !== "screenShareEnabled") sendDataMessage(key, value);

  switch (key) {
    case "audioEnabled":
      document.getElementById(peerId + "_audioEnabled").className =
        "audioEnabled icon-mic" + (value ? "" : "-off");
      break;
    case "videoEnabled":
      document.getElementById(peerId + "_videoEnabled").style.visibility = value ? "hidden" : "visible";
      break;
    case "peerName":
      document.getElementById(peerId + "_videoPeerName").innerHTML = value + " (you)";
      break;
    case "screenShareEnabled":
      setShareScreen(value, callback);
      break;
    default:
      break;
  }
}

const setShareScreen = (screenShareEnabled, callback) => {
  let screenMediaPromise;

  if (screenShareEnabled) {
    if (navigator.getDisplayMedia) {
      screenMediaPromise = navigator.getDisplayMedia({ video: true });
    } else if (navigator.mediaDevices.getDisplayMedia) {
      screenMediaPromise = navigator.mediaDevices.getDisplayMedia({ video: true });
    } else {
      screenMediaPromise = navigator.mediaDevices.getUserMedia({
        video: { mediaSource: "screen" },
      });
    }
  } else {
    removeShareScreen(callback);
  }

  if(screenMediaPromise) {
    screenMediaPromise
      .then((screenStream) => {
        screenStream.getVideoTracks()[0].onended = function () {
          removeShareScreen(callback);
        };
        sendDataMessage("screenShareEnabled", true);
        shareScreen(screenStream);
      })
      .catch((e) => {
        removeShareScreen(callback);
        alert("Unable to share screen. Please use a supported browser.");
        console.error(e);
      });
  }
}

const removeShareScreen = (callback) => {
  sendDataMessage("screenShareEnabled", false);
  if (callback) callback(false);
  stopShareScreen();
}

const sendDataMessage = (key, value) => {
  const dataMessage = {
    type: key,
    name: currentName,
    id: peerId,
    message: value,
    date: new Date().toISOString(),
  };
  updateUserDataChannel(dataMessage);
}

export { updateUserData }
import { 
  updateUserDataChannel,
  currentName,
  peerId
} from "./webrtc"

const updateUserData = (key, value) => {
  sendDataMessage(key, value);

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
    default:
      break;
  }
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

export {
  updateUserData
}
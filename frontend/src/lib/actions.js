import { currentName, peerId, dataChannels } from "./webrtc"

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

  switch (key) {
    case "chat":
      // chats.push(dataMessage);
      // this.$nextTick(this.scrollToBottom);
      break;
    default:
      break;
  }

  Object.keys(dataChannels).map((peer_id) => dataChannels[peer_id].send(JSON.stringify(dataMessage)));
}

export {
  updateUserData
}
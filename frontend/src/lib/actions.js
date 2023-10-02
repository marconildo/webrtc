import { peerId } from "./webrtc"

const updateUserData = (key, value) => {
  //this.sendDataMessage(key, value);

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

export {
  updateUserData
}
import { useContext } from "react";
import "./RoomActions.css";
import RoomContext from "../context/RoomContext";
import {
  localMediaStream
} from "../lib/webrtc"
import {
  updateUserData
} from "../lib/actions"

const RoomActions = () => {
  const { 
    audioEnabled, setAudioEnabled,
    videoEnabled, setVideoEnabled,
    showChat, setShowChat
  } = useContext(RoomContext);

  const audioToggle = (e) => {
    e.stopPropagation();
    localMediaStream.getAudioTracks()[0].enabled = !localMediaStream.getAudioTracks()[0].enabled;
    updateUserData("audioEnabled", !audioEnabled);
    setAudioEnabled(!audioEnabled);
  }

  const videoToggle = (e) => {
    e.stopPropagation();
    localMediaStream.getVideoTracks()[0].enabled = !localMediaStream.getVideoTracks()[0].enabled;
    setVideoEnabled(!videoEnabled);
  }

  return <div id="actionsWrap">
    <div id="actions">
      <button 
        className={`icon-mic${audioEnabled ? "" : "-off"}`}
        onClick={(e) => audioToggle(e)} />
      <button 
        className={`icon-video${videoEnabled ? "" : "-off"}`} 
        onClick={(e) => videoToggle(e)}  />
      <button className={`icon-message-square`} />
      <button className={`icon-monitor`} />
      <button className="icon-exit" />
      <button className={`icon-more-horizontal`} />
    </div>
  </div>
}

export default RoomActions;
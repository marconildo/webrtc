import { useContext } from "react";
import "./RoomActions.css";
import RoomContext from "../context/RoomContext";
import { localMediaStream, endCall } from "../utils/webrtc"
import { updateUserData } from "../utils/actions"
import { useNavigate } from "react-router-dom";

const RoomActions = () => {
  const navigate = useNavigate();
  const { 
    audioEnabled, setAudioEnabled,
    videoEnabled, setVideoEnabled,
    screenShareEnabled, setScreenShareEnabled
    // showChat, setShowChat
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
    updateUserData("videoEnabled", !videoEnabled);
    setVideoEnabled(!videoEnabled);
  }

  const screenShareToggle = (e) => { 
    e.stopPropagation();
    updateUserData("screenShareEnabled", !screenShareEnabled, setScreenShareEnabled);
    setScreenShareEnabled(!screenShareEnabled);
  }

  const exit = () => {
    endCall();
    window.sessionStorage.clear();
    navigate("/");
  }

  return <div id="controls">
    <div id="actions">
      <button 
        className={`icon-mic${audioEnabled ? "" : "-off"}`}
        onClick={(e) => audioToggle(e)} />
      <button 
        className={`icon-video${videoEnabled ? "" : "-off"}`} 
        onClick={(e) => videoToggle(e)}  />
      <button className={`icon-message-square`} />
      <button 
        className={`icon-monitor`}
        onClick={(e) => screenShareToggle(e)}/>
      <button className="icon-exit" onClick={() => exit()} />
      <button className={`icon-more-horizontal`} />
    </div>
  </div>
}

export default RoomActions;
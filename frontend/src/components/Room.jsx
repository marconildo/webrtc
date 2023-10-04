import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoomContext from '../context/RoomContext';
import {
  initiateCall
} from "../utils/webrtc"
import "./Room.css";
import RoomActions from './RoomActions';

const Room = () => {
  let { room } = useParams();
  const navigate = useNavigate();

  const [name] = useState(() => {
    return window.sessionStorage.getItem("name");
  });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);

  useEffect(() => {
    if(!room || !name) {
      navigate("/")
      return;
    }

    if(callInitiated) return;

    setCallInitiated(true);
    initiateCall(name, room);
  }, []);

  return <RoomContext.Provider
    value={{
      audioEnabled, setAudioEnabled,
      videoEnabled, setVideoEnabled,
      showChat, setShowChat,
      screenShareEnabled, setScreenShareEnabled
    }}>
    <div id="room">
      <div id="conference">
        <div id="videos" />
      </div>
      <RoomActions />
    </div>    
  </RoomContext.Provider>;
}

export default Room;
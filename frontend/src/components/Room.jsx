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
    }}>
    <section id="videos" />
    <RoomActions />
  </RoomContext.Provider>;
}

export default Room;
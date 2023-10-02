import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  initiateCall
} from "./lib/webrtc"
import "./Room.css";

const Room = () => {
  let { room } = useParams();
  const navigate = useNavigate();

  const [name] = useState(() => {
    return window.sessionStorage.getItem("name");
  });
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

  return <>
    <section id="videos" />
  </>;
}

export default Room;
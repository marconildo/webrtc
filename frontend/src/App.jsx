import { Routes, Route } from "react-router-dom";
import MainPage from "./MainPage";
import Room from "./Room";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/:room" element={<Room />} />
    </Routes>
  )
}

export default App

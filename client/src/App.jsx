import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Quiz from './pages/Quiz';
import ParentDashboard from './pages/ParentDashboard';
import SongLand from './pages/SongLand';
import GameLand from './pages/GameLand';
import MoleGame from './pages/games/MoleGame';
import MemoryGame from './pages/games/MemoryGame';
import Sketchbook from './pages/games/Sketchbook';
import RhythmGame from './pages/games/RhythmGame';
import MyRoom from './pages/MyRoom';
import Store from './pages/Store';
import StoryLand from './pages/StoryLand';
import VideoLand from './pages/VideoLand';
import EnglishTalk from './pages/EnglishTalk';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Lobby />} />
          <Route path="/songs" element={<SongLand />} />
          <Route path="/games" element={<GameLand />} />
          <Route path="/games/mole" element={<MoleGame />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/sketchbook" element={<Sketchbook />} />
          <Route path="/games/rhythm" element={<RhythmGame />} />
          <Route path="/store" element={<Store />} />
          <Route path="/stories" element={<StoryLand />} />
          <Route path="/videos" element={<VideoLand />} />
          <Route path="/myroom" element={<MyRoom />} />
          <Route path="/english-talk" element={<EnglishTalk />} />
          <Route path="/quiz/:levelId" element={<Quiz />} />
          <Route path="/parent" element={<ParentDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;

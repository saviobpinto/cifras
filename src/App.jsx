import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SongEditor from './components/SongEditor';
import SongViewer from './components/SongViewer';
import SetlistDetail from './components/SetlistDetail';
import Library from './components/Library';
import Settings from './components/Settings';
import { SongProvider } from './contexts/SongContext';

function App() {
  return (
    <SongProvider>
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/song/new" element={<SongEditor />} />
          <Route path="/song/edit/:id" element={<SongEditor />} />
          <Route path="/song/viewer" element={<SongViewer />} />
          <Route path="/setlist/:id" element={<SetlistDetail />} />
          <Route path="/settings" element={<Settings />} />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </SongProvider>
  );
}

export default App;

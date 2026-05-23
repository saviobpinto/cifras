import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SongEditor from './components/SongEditor';
import SongViewer from './components/SongViewer';
import SetlistDetail from './components/SetlistDetail';
import Library from './components/Library';
import Settings from './components/Settings';
import { SongProvider } from './contexts/SongContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';

function App() {
  return (
    <AuthProvider>
      <SongProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/song/new" element={<ProtectedRoute><SongEditor /></ProtectedRoute>} />
            <Route path="/song/edit/:id" element={<ProtectedRoute><SongEditor /></ProtectedRoute>} />
            <Route path="/song/viewer" element={<ProtectedRoute><SongViewer /></ProtectedRoute>} />
            <Route path="/setlist/:id" element={<ProtectedRoute><SetlistDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SongProvider>
    </AuthProvider>
  );
}

export default App;

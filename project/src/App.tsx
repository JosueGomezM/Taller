import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PendingComments from './pages/PendingComments';
import Repairs from './pages/Repairs';
import History from './pages/History';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { ConnectionProvider } from './contexts/ConnectionContext';

export default function App() {
  // Prevenir el unload accidental
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (document.querySelector('form')?.checkValidity() === false) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectionProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/pending-comments" element={<PendingComments />} />
                        <Route path="/repairs" element={<Repairs />} />
                        <Route path="/history" element={<History />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import api from './utils/api';
import Navbar from './components/common/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import FormList from './components/forms/FormList';
import FormBuilder from './components/forms/FormBuilder';
import FormResponse from './components/forms/FormResponse';
import ResponseList from './components/forms/ResponseList';

const theme = createTheme({
  // You can customize the theme here
});

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status when app loads
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/');
        if (response.data.isAuthenticated) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const PrivateRoute = ({ children }) => {
    if (loading) return null;
    return user ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Navbar user={user} setUser={setUser} />
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route
            path="/forms"
            element={
              <PrivateRoute>
                <FormList />
              </PrivateRoute>
            }
          />
          <Route
            path="/forms/create"
            element={
              <PrivateRoute>
                <FormBuilder />
              </PrivateRoute>
            }
          />
          <Route
            path="/forms/:id/edit"
            element={
              <PrivateRoute>
                <FormBuilder />
              </PrivateRoute>
            }
          />
          <Route
            path="/forms/:id/respond"
            element={<FormResponse />}
          />
          <Route
            path="/forms/:id/responses"
            element={
              <PrivateRoute>
                <ResponseList />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/forms" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
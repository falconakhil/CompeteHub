import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Stack,
} from '@mui/material';
import Logo from './Logo';
import authService from '../services/authService';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/dashboard');
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <Logo size="small" />
        </Box>
        
        {user ? (
          // Logged in: Show Profile and Logout buttons
          <Stack direction="row" spacing={2}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/profile')}
            >
              Profile
            </Button>
            <Button 
              color="inherit"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Stack>
        ) : (
          // Not logged in: Show Login and Signup buttons
          <Stack direction="row" spacing={2}>
            <Button 
              color="inherit"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              color="inherit"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 
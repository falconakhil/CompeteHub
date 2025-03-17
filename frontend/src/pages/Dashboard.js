import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box, AppBar, Toolbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import Logo from '../components/Logo';

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(1, 3),
  fontSize: '1.1rem',
}));

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated (you'll need to implement this based on your auth system)
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  const handleAuthAction = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  const handleButtonClick = (path) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Logo size="medium" />
          <Button 
            color="inherit"
            onClick={handleAuthAction}
          >
            {isAuthenticated ? 'Profile' : 'Login'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container 
        maxWidth="md" 
        sx={{ 
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}
      >
        <Logo size="large" />
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          width: '100%',
          justifyContent: 'center'
        }}>
          <StyledButton
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => handleButtonClick('/create-contest')}
            sx={{ maxWidth: 300 }}
          >
            Create Contest
          </StyledButton>
          
          <StyledButton
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => handleButtonClick('/problem-set')}
            sx={{ maxWidth: 300 }}
          >
            Problem Set
          </StyledButton>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 
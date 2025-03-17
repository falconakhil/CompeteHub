import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Logo from '../components/Logo';
import authService from '../services/authService';

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2),
  padding: theme.spacing(1, 3),
  fontSize: '1.1rem',
}));

const Dashboard = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!authService.getCurrentUser();

  const handleButtonClick = (path) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        mt: 4,
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
  );
};

export default Dashboard; 
import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const HubText = styled(Typography)(({ theme }) => ({
  backgroundColor: '#ff9000',
  color: 'black',
  padding: '2px 4px',
  borderRadius: '4px',
  fontWeight: 'bold',
}));

const Logo = ({ size = 'medium' }) => {
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return { fontSize: '1.2rem' };
      case 'large':
        return { fontSize: '2.5rem' };
      default:
        return { fontSize: '1.8rem' };
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <Typography
        component="span"
        sx={{
          ...getFontSize(),
          fontWeight: 'bold',
          color: 'white',
        }}
      >
        Compete
      </Typography>
      <HubText
        component="span"
        sx={getFontSize()}
      >
        Hub
      </HubText>
    </Box>
  );
};

export default Logo; 
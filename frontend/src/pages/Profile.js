import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import authService from '../services/authService';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await authService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      navigate('/login');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount(password);
      authService.logout();
      navigate('/login');
    } catch (error) {
      setError(error.detail || 'Failed to delete account. Please try again.');
    }
  };

  if (!userProfile) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Username
              </Typography>
              <Typography variant="h6" gutterBottom>
                {userProfile.username}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="text.secondary">
                Email
              </Typography>
              <Typography variant="h6" gutterBottom>
                {userProfile.email}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" color="text.secondary">
                Contests Participated
              </Typography>
              <Typography variant="h6" gutterBottom>
                {userProfile.contests_participated || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" color="text.secondary">
                Contests Hosted
              </Typography>
              <Typography variant="h6" gutterBottom>
                {userProfile.contests_hosted || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" color="text.secondary">
                Problems Solved
              </Typography>
              <Typography variant="h6" gutterBottom>
                {userProfile.problems_solved || 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLogout}
          >
            Log Out
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </Box>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography color="error" paragraph>
            Warning: This action cannot be undone. All your data will be permanently deleted.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Confirm Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 
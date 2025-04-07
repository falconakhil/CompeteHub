import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import contestService from '../services/contestService';

const ContestDetailsView = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setLoading(true);
        const data = await contestService.getContestDetails(contestId);
        setContest(data);
      } catch (error) {
        console.error('Error fetching contest details:', error);
        navigate('/contests'); // Redirect to contests list on error
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
  }, [contestId, navigate]);

  const handleRegister = async () => {
    try {
      await contestService.registerForContest(contestId);
      // Refresh contest details after registration
      const updatedData = await contestService.getContestDetails(contestId);
      setContest(updatedData);
    } catch (error) {
      console.error('Error registering for contest:', error);
    }
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!contest) {
    return (
      <Container>
        <Typography>Contest not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {contest.title}
              </Typography>
              <Chip 
                label={contest.status} 
                color={contest.status === 'active' ? 'success' : contest.status === 'future' ? 'primary' : 'default'} 
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Contest Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Start Time
              </Typography>
              <Typography variant="body1">
                {new Date(contest.start_time).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Duration
              </Typography>
              <Typography variant="body1">
                {formatDuration(contest.duration)}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Description
              </Typography>
              <Typography variant="body1">
                {contest.description}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Additional Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Created By
              </Typography>
              <Typography variant="body1">
                {contest.created_by}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="textSecondary">
                Registration Status
              </Typography>
              <Typography variant="body1">
                {contest.is_registered ? 'Registered' : 'Not Registered'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/contests')}
              >
                Back to Contests
              </Button>
              {contest.status === 'future' && !contest.is_registered && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                >
                  Register for Contest
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ContestDetailsView; 
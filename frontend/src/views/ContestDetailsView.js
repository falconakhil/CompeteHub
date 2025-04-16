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
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import contestService from '../services/contestService';

const ContestDetailsView = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [showProblems, setShowProblems] = useState(false);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setLoading(true);
        const data = await contestService.getContestDetails(contestId);
        setContest(data);
        setIsRegistered(data.is_registered);
      } catch (error) {
        console.error('Error fetching contest details:', error);
        setError(error.detail || 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
  }, [contestId]);

  const handleRegister = async () => {
    try {
      setRegistrationError(null);
      await contestService.registerForContest(contestId);
      // Refresh contest details after registration
      const updatedData = await contestService.getContestDetails(contestId);
      setContest(updatedData);
      setIsRegistered(true);
    } catch (error) {
      console.error('Error registering for contest:', error);
      setRegistrationError(error.detail || 'Failed to register for the contest');
    }
  };

  const handleUnregister = async () => {
    try {
      setRegistrationError(null);
      await contestService.unregisterFromContest(contestId);
      // Refresh contest details after unregistration
      const updatedData = await contestService.getContestDetails(contestId);
      setContest(updatedData);
      setIsRegistered(false);
    } catch (error) {
      console.error('Error unregistering from contest:', error);
      setRegistrationError(error.detail || 'Failed to unregister from the contest');
    }
  };

  const handleViewProblems = async () => {
    try {
      setProblemsLoading(true);
      const data = await contestService.getContestProblems(contestId);
      setProblems(data.results || data);
      setShowProblems(true);
    } catch (error) {
      console.error('Error fetching contest problems:', error);
    } finally {
      setProblemsLoading(false);
    }
  };

  const formatDuration = (duration) => {
    // Convert duration from seconds to hours and minutes
    const totalSeconds = duration;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getContestStatus = () => {
    if (!contest) return null;
    const now = new Date();
    const startTime = new Date(contest.starting_time);
    const endTime = new Date(startTime.getTime() + contest.duration * 1000);

    if (now < startTime) {
      return {
        status: 'Upcoming',
        color: 'info',
        time: `Starts in ${Math.ceil((startTime - now) / (1000 * 60 * 60))} hours`
      };
    } else if (now < endTime) {
      return {
        status: 'Active',
        color: 'success',
        time: `Ends in ${Math.ceil((endTime - now) / (1000 * 60))} minutes`
      };
    } else {
      return {
        status: 'Completed',
        color: 'default',
        time: 'Contest has ended'
      };
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
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

  const status = getContestStatus();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {contest.name}
                </Typography>
                <Chip
                  label={status.status}
                  color={status.color}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {status.time}
                </Typography>
              </Box>
              <Box>
                {status.status === 'Upcoming' && (
                  isRegistered ? (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleUnregister}
                    >
                      Unregister
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleRegister}
                    >
                      Register
                    </Button>
                  )
                )}
                {status.status === 'Active' && isRegistered && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/contests/${contestId}/problems`)}
                  >
                    Enter Contest
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>

          {registrationError && (
            <Grid item xs={12}>
              <Alert severity="error">{registrationError}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contest Details
            </Typography>
            <Typography variant="body1" paragraph>
              {contest.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created by: {contest.creator_username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration: {Math.floor(contest.duration / 60)}h {contest.duration % 60}m
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {contest.genres?.map((genre) => (
                <Chip
                  key={genre.id}
                  label={genre.name}
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contest Problems
            </Typography>
            {showProblems ? (
              problemsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              ) : problems.length > 0 ? (
                <List>
                  {problems.map((problem) => (
                    <ListItem key={problem.id} button onClick={() => navigate(`/problems/${problem.id}`)}>
                      <ListItemText
                        primary={problem.title}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No problems found for this contest.</Typography>
              )
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleViewProblems}
              >
                View Problems
              </Button>
            )}
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {!isRegistered ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                >
                  Register
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleUnregister}
                >
                  Unregister
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
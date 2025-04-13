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
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [unregistrationError, setUnregistrationError] = useState(null);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setLoading(true);
        const data = await contestService.getContestDetails(contestId);
        setContest(data);
        
        // Check if user is registered for this contest
        if (data.is_registered !== undefined) {
          setIsRegistered(data.is_registered);
        } else {
          // If the backend doesn't provide this info, we'll assume they're not registered
          setIsRegistered(false);
        }
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
      setUnregistrationError(null);
      await contestService.unregisterFromContest(contestId);
      // Refresh contest details after unregistration
      const updatedData = await contestService.getContestDetails(contestId);
      setContest(updatedData);
      setIsRegistered(false);
    } catch (error) {
      console.error('Error unregistering from contest:', error);
      setUnregistrationError(error.detail || 'Failed to unregister from the contest');
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
    if (!contest) return 'unknown';
    const now = new Date();
    const startTime = new Date(contest.starting_time);
    const endTime = new Date(startTime.getTime() + contest.duration * 1000); // Convert seconds to milliseconds

    if (now < startTime) return 'future';
    if (now > endTime) return 'completed';
    return 'active';
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

  const status = getContestStatus();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {contest.name}
              </Typography>
              <Chip 
                label={status} 
                color={status === 'active' ? 'success' : status === 'future' ? 'primary' : 'default'} 
              />
            </Box>
          </Grid>

          {registrationError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {registrationError}
              </Alert>
            </Grid>
          )}

          {unregistrationError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {unregistrationError}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Contest Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Start Time"
                  secondary={new Date(contest.starting_time).toLocaleString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Duration"
                  secondary={formatDuration(contest.duration)}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Description"
                  secondary={contest.description}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created By"
                  secondary={contest.creator_username}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Registration Status"
                  secondary={isRegistered ? "Registered" : "Not Registered"}
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Contest Genres
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {contest.genres.map((genre) => (
                <Chip key={genre.id} label={genre.name} />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {showProblems && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contest Problems
              </Typography>
              {problemsLoading ? (
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
              )}
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              {isRegistered ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/contests/${contestId}/problems`)}
                    disabled={status !== 'active'}
                  >
                    Enter Contest
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleUnregister}
                  >
                    Unregister
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                >
                  Register
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
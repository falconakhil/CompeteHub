import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import contestService from '../services/contestService';

const ActiveContestView = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  useEffect(() => {
    const fetchContestAndProblems = async () => {
      try {
        setLoading(true);
        const contestData = await contestService.getContestDetails(contestId);
        setContest(contestData);
        setIsRegistered(contestData.is_registered);

        if (contestData.is_registered) {
          const problemsData = await contestService.getContestProblems(contestId);
          setProblems(problemsData.results || problemsData);
        }
      } catch (error) {
        console.error('Error fetching contest details:', error);
        setError(error.detail || 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    fetchContestAndProblems();
  }, [contestId]);

  const handleRegister = async () => {
    try {
      setRegistrationError(null);
      await contestService.registerForContest(contestId);
      // Refresh contest details and problems after registration
      const updatedData = await contestService.getContestDetails(contestId);
      setContest(updatedData);
      setIsRegistered(true);
      const problemsData = await contestService.getContestProblems(contestId);
      setProblems(problemsData.results || problemsData);
    } catch (error) {
      console.error('Error registering for contest:', error);
      setRegistrationError(error.detail || 'Failed to register for the contest');
    }
  };

  const handleProblemClick = (index) => {
    navigate(`/contests/${contestId}/problems/${index + 1}`);
  };

  const getTimeRemaining = () => {
    if (!contest) return null;
    const now = new Date();
    const endTime = new Date(new Date(contest.starting_time).getTime() + contest.duration * 1000);
    const diff = endTime - now;
    
    if (diff <= 0) return 'Contest ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
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
                label={getTimeRemaining()} 
                color="primary" 
                variant="outlined"
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

          {!isRegistered ? (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  You are not registered for this contest
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                  sx={{ mt: 2 }}
                >
                  Register Now
                </Button>
              </Box>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contest Problems
              </Typography>
              <List>
                {problems.map((problem, index) => (
                  <ListItem 
                    key={problem.id} 
                    button 
                    onClick={() => handleProblemClick(index)}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={`Problem ${index + 1}: ${problem.title}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/contests')}
              >
                Back to Contests
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ActiveContestView; 
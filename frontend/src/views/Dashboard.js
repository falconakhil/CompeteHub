import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import contestService from '../services/contestService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeContests, setActiveContests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const [activeData, upcomingData] = await Promise.all([
          contestService.getActiveContests(),
          contestService.getUpcomingContests()
        ]);

        setActiveContests(activeData.results || activeData);
        setUpcomingContests(upcomingData.results || upcomingData);

        // Fetch registration status for upcoming contests
        const statusPromises = (upcomingData.results || upcomingData).map(contest =>
          contestService.getContestDetails(contest.id)
            .then(data => ({ id: contest.id, is_registered: data.is_registered }))
            .catch(() => ({ id: contest.id, is_registered: false }))
        );

        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, { id, is_registered }) => {
          acc[id] = is_registered;
          return acc;
        }, {});
        setRegistrationStatus(statusMap);
      } catch (error) {
        console.error('Error fetching contests:', error);
        setError(error.detail || 'Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

  const handleRegister = async (contestId) => {
    try {
      await contestService.registerForContest(contestId);
      setRegistrationStatus(prev => ({
        ...prev,
        [contestId]: true
      }));
    } catch (error) {
      console.error('Error registering for contest:', error);
      // Handle error appropriately
    }
  };

  const handleUnregister = async (contestId) => {
    try {
      await contestService.unregisterFromContest(contestId);
      setRegistrationStatus(prev => ({
        ...prev,
        [contestId]: false
      }));
    } catch (error) {
      console.error('Error unregistering from contest:', error);
      // Handle error appropriately
    }
  };

  const getContestStatus = (contest) => {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Active Contests */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Active Contests
          </Typography>
          {activeContests.length === 0 ? (
            <Typography color="text.secondary">
              No active contests at the moment
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {activeContests.map((contest) => {
                const status = getContestStatus(contest);
                return (
                  <Grid item xs={12} md={6} key={contest.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {contest.name}
                          </Typography>
                          <Chip
                            label={status.status}
                            color={status.color}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {contest.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Created by: {contest.creator_username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {status.time}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {contest.genres?.map((genre) => (
                            <Chip
                              key={genre.id}
                              label={genre.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/contests/${contest.id}`)}
                        >
                          View Details
                        </Button>
                        {status.status === 'Active' && (
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            onClick={() => navigate(`/contests/${contest.id}/problems`)}
                          >
                            Enter Contest
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>

        {/* Upcoming Contests */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Upcoming Contests
          </Typography>
          {upcomingContests.length === 0 ? (
            <Typography color="text.secondary">
              No upcoming contests
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {upcomingContests.map((contest) => {
                const status = getContestStatus(contest);
                const isRegistered = registrationStatus[contest.id];
                return (
                  <Grid item xs={12} md={6} key={contest.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div">
                            {contest.name}
                          </Typography>
                          <Chip
                            label={status.status}
                            color={status.color}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {contest.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Created by: {contest.creator_username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {status.time}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {contest.genres?.map((genre) => (
                            <Chip
                              key={genre.id}
                              label={genre.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/contests/${contest.id}`)}
                        >
                          View Details
                        </Button>
                        {isRegistered ? (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleUnregister(contest.id)}
                          >
                            Unregister
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            color="primary"
                            variant="contained"
                            onClick={() => handleRegister(contest.id)}
                          >
                            Register
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 
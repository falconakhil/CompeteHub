import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Logo from '../components/Logo';
import authService from '../services/authService';

const Dashboard = () => {
  const navigate = useNavigate();
  const [upcomingContests, setUpcomingContests] = useState([]);
  const isAuthenticated = !!authService.getCurrentUser();

  useEffect(() => {
    fetchUpcomingContests();
  }, []);

  const fetchUpcomingContests = async () => {
    try {
      // Get the auth token
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:8000/contest/list/future/', {
        method: 'GET',
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched contests:', data);
      // Check if response has results property (paginated response)
      const contests = data.results || data;
      setUpcomingContests(contests);
    } catch (error) {
      console.error('Error fetching upcoming contests:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleButtonClick = (path) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleButtonClick('/create-contest')}
                  size="large"
                >
                  Create Contest
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ListAltIcon />}
                  onClick={() => handleButtonClick('/problem-set')}
                  size="large"
                >
                  Problem Set
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Upcoming Contests */}
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
              Upcoming Contests
            </Typography>
            <Grid container spacing={3}>
              {upcomingContests.map((contest) => (
                <Grid item xs={12} md={6} lg={4} key={contest.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {contest.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        Start: {formatDate(contest.starting_time)}
                      </Typography>
                      <Typography color="textSecondary">
                        Duration: {contest.duration} minutes
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Problems: {Array.isArray(contest.problems) ? contest.problems.length : '?'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/contests/${contest.id}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {upcomingContests.length === 0 && (
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="textSecondary">
                      No upcoming contests at the moment
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 
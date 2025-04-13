import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Logo from '../components/Logo';
import authService from '../services/authService';
import contestService from '../services/contestService';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [activeContests, setActiveContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!authService.getCurrentUser();

  useEffect(() => {
    fetchContests();
  }, [location.state?.refresh]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      // Fetch upcoming contests
      const upcomingData = await contestService.getContests('future');
      setUpcomingContests(upcomingData.results || upcomingData);
      
      // Fetch active contests
      const activeData = await contestService.getContests('active');
      setActiveContests(activeData.results || activeData);
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
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

  const renderContestCards = (contests, emptyMessage) => {
    if (loading) {
      return (
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Grid>
      );
    }

    if (contests.length === 0) {
      return (
        <Grid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              {emptyMessage}
            </Typography>
          </Paper>
        </Grid>
      );
    }

    return contests.map((contest) => (
      <Grid item xs={12} md={6} lg={4} key={contest.id}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2">
              {contest.name}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              Start: {formatDate(contest.starting_time)}
            </Typography>
            <Typography variant="body2" paragraph>
              Duration: {formatDuration(contest.duration)}
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
            {contest.is_registered && (
              <Button
                size="small"
                color="secondary"
                onClick={() => navigate(`/contests/${contest.id}/problems`)}
              >
                Enter Contest
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<ListAltIcon />}
                  onClick={() => handleButtonClick('/contests')}
                  size="large"
                >
                  All Contests
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Active Contests */}
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
              Active Contests
            </Typography>
            <Grid container spacing={3}>
              {renderContestCards(activeContests, 'No active contests at the moment')}
            </Grid>
          </Grid>

          {/* Upcoming Contests */}
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
              Upcoming Contests
            </Typography>
            <Grid container spacing={3}>
              {renderContestCards(upcomingContests, 'No upcoming contests at the moment')}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 
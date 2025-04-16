import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Pagination,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Paper,
  Alert,
} from '@mui/material';
import contestService from '../services/contestService';

const ContestListView = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contestType, setContestType] = useState('active');
  const [loading, setLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState(null);

  const fetchContests = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (contestType) {
        case 'active':
          response = await contestService.getActiveContests();
          break;
        case 'future':
          response = await contestService.getUpcomingContests();
          break;
        case 'completed':
          response = await contestService.getPastContests();
          break;
        default:
          response = { results: [], count: 0 };
      }
      
      setContests(Array.isArray(response) ? response : response.results || []);
      setTotalPages(Math.ceil((response.count || response.length || 0) / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching contests:', error);
      setContests([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [page, contestType]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleContestTypeChange = (event, newValue) => {
    setContestType(newValue);
    setPage(1);
  };

  const handleViewDetails = (contestId) => {
    navigate(`/contests/${contestId}`);
  };

  const handleRegister = async (contestId) => {
    try {
      setRegistrationError(null);
      await contestService.registerForContest(contestId);
      // Refresh the contests list after registration
      await fetchContests();
    } catch (error) {
      console.error('Error registering for contest:', error);
      setRegistrationError(error.detail || 'Failed to register for the contest');
    }
  };

  const handleDelete = async (contestId) => {
    try {
      await contestService.deleteContest(contestId);
      fetchContests(); // Refresh the list
    } catch (error) {
      console.error('Error deleting contest:', error);
    }
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getContestTypeColor = (type) => {
    switch (type) {
      case 'active':
        return 'success';
      case 'future':
        return 'primary';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contests
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs value={contestType} onChange={handleContestTypeChange}>
          <Tab value="active" label="Active Contests" />
          <Tab value="future" label="Upcoming Contests" />
          <Tab value="completed" label="Past Contests" />
        </Tabs>
      </Box>

      {registrationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {registrationError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {contests.map((contest) => (
              <Grid item xs={12} md={6} key={contest.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {contest.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Starts: {new Date(contest.starting_time).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {contest.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {contest.genres.map((genre) => (
                        <Chip
                          key={genre.id}
                          label={genre.name}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewDetails(contest.id)}
                    >
                      View Details
                    </Button>
                    {contestType === 'future' && !contest.is_registered && (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleRegister(contest.id)}
                      >
                        Register
                      </Button>
                    )}
                    {contestType === 'active' && contest.is_registered && (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/contests/${contest.id}/problems`)}
                      >
                        Enter Contest
                      </Button>
                    )}
                    {contest.is_registered && contestType === 'future' && (
                      <Chip 
                        label="Registered" 
                        color="success" 
                        size="small" 
                      />
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {contests.length === 0 && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No {contestType} contests found
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ContestListView; 
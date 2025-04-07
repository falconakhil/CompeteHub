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
} from '@mui/material';
import contestService from '../services/contestService';

const ContestListView = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contestType, setContestType] = useState('active');
  const [loading, setLoading] = useState(true);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await contestService.getContests(contestType, page);
      setContests(response.results);
      setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page
    } catch (error) {
      console.error('Error fetching contests:', error);
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
      await contestService.registerForContest(contestId);
      fetchContests(); // Refresh the list
    } catch (error) {
      console.error('Error registering for contest:', error);
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
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
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
      <Typography variant="h4" component="h1" gutterBottom>
        Contests
      </Typography>

      <Tabs
        value={contestType}
        onChange={handleContestTypeChange}
        sx={{ mb: 3 }}
      >
        <Tab label="Active" value="active" />
        <Tab label="Future" value="future" />
        <Tab label="Completed" value="completed" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {contests.map((contest) => (
              <Grid item xs={12} md={6} key={contest.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      {contest.title}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {new Date(contest.start_time).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Duration: {formatDuration(contest.duration)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={contestType} 
                        color={getContestTypeColor(contestType)} 
                      />
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
                    {contestType === 'future' && (
                      <>
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={() => handleRegister(contest.id)}
                        >
                          Register
                        </Button>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(contest.id)}
                        >
                          Delete
                        </Button>
                      </>
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
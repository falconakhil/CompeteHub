import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
} from '@mui/material';
import axios from 'axios';

const ContestProblemsView = () => {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContestAndProblems = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        // Fetch contest details
        const contestResponse = await axios.get(
          `http://localhost:8000/contest/${contestId}/`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        setContest(contestResponse.data);

        // Fetch problems
        const problemsResponse = await axios.get(
          `http://localhost:8000/contest/problems/list/${contestId}/`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (problemsResponse.data.results) {
          setProblems(problemsResponse.data.results);
        } else if (Array.isArray(problemsResponse.data)) {
          setProblems(problemsResponse.data);
        } else {
          setError('Invalid response format for problems');
        }
      } catch (error) {
        console.error('Error fetching contest data:', error);
        if (error.response?.status === 403) {
          setError('You must be registered for this contest to view problems.');
        } else {
          setError(error.response?.data?.detail || 'Failed to load contest problems');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContestAndProblems();
  }, [contestId]);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {contest && (
          <Box sx={{ mb: 4 }}>
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
            <Typography variant="body1" color="text.secondary" paragraph>
              {contest.description}
            </Typography>
          </Box>
        )}

        <Typography variant="h5" gutterBottom>
          Contest Problems
        </Typography>

        <Paper elevation={1}>
          {problems.map((problem, index) => (
            <React.Fragment key={problem.id}>
              {index > 0 && <Divider />}
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Problem {index + 1}: {problem.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {problem.question.length > 200 
                        ? `${problem.question.substring(0, 200)}...` 
                        : problem.question}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {problem.genres?.map((genre) => (
                        <Chip 
                          key={genre.id} 
                          label={genre.name} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                  <Button 
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/contests/${contestId}/problems/${index + 1}`)}
                    sx={{ ml: 2 }}
                  >
                    Solve Problem
                  </Button>
                </Box>
              </Box>
            </React.Fragment>
          ))}
        </Paper>

        {problems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No problems found in this contest
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContestProblemsView; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Divider,
} from '@mui/material';
import contestService from '../services/contestService';

const ContestProblemView = () => {
  const { contestId, problemOrder } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const data = await contestService.getContestProblemByOrder(contestId, problemOrder);
        setProblem(data);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setError(error.detail || 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [contestId, problemOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      await contestService.submitContestProblem(contestId, problemOrder, answer);
      navigate(`/contests/${contestId}/problems`);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setSubmitError(error.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
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

  if (!problem) {
    return (
      <Container>
        <Typography>Problem not found</Typography>
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
                Problem {problemOrder}: {problem?.title}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {problem?.question}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Your Answer"
                multiline
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/contests/${contestId}/problems`)}
                >
                  Back to Contest
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ContestProblemView; 
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
  Chip,
} from '@mui/material';
import axios from 'axios';

const ProblemDetailView = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchProblemAndSubmissions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        // Fetch problem details
        const problemResponse = await axios.get(
          `http://localhost:8000/problem/${problemId}/`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        setProblem(problemResponse.data);

        // Fetch submissions
        const submissionsResponse = await axios.get(
          `http://localhost:8000/problem/submission/list/${problemId}/`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        setSubmissions(submissionsResponse.data);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setError(error.response?.data?.error || 'Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemAndSubmissions();
  }, [problemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setSubmitError(null);
      const token = localStorage.getItem('access_token');
      
      const response = await axios.post(
        `http://localhost:8000/problem/submission/create/${problemId}/`,
        { content: answer },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      // Refresh submissions after successful submission
      const submissionsResponse = await axios.get(
        `http://localhost:8000/problem/submission/list/${problemId}/`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSubmissions(submissionsResponse.data);
      setAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
      setSubmitError(error.response?.data?.error || 'Failed to submit answer');
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
                {problem.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
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
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {problem.question}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Submit Your Answer
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer here..."
                variant="outlined"
                disabled={submitting}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </form>
          </Grid>

          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Your Submissions
            </Typography>
            {submissions.length === 0 ? (
              <Typography color="text.secondary">
                No submissions yet
              </Typography>
            ) : (
              <Box>
                {submissions.map((submission, index) => (
                  <Paper
                    key={submission.id}
                    elevation={1}
                    sx={{ p: 2, mb: 2, bgcolor: submission.evaluation_status === 'Correct' ? '#e8f5e9' : '#ffebee' }}
                  >
                    <Typography variant="subtitle1">
                      Submission {index + 1} - {new Date(submission.created_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Your answer: {submission.content}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={submission.evaluation_status === 'Correct' ? 'success.main' : 'error.main'}
                      sx={{ mt: 1 }}
                    >
                      Status: {submission.evaluation_status}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProblemDetailView; 
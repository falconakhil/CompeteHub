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
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const data = await contestService.getContestProblemByOrder(contestId, problemOrder);
        setProblem(data);
        // Check if the problem is already solved
        const submissions = await contestService.getProblemSubmissions(contestId, problemOrder);
        const hasCorrectSubmission = submissions.some(sub => sub.evaluation_status === 'Correct');
        setIsSolved(hasCorrectSubmission);
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
      setSubmitSuccess(null);
      
      const response = await contestService.submitContestProblem(contestId, problemOrder, answer);
      
      if (response.correct) {
        setSubmitSuccess({
          message: "Correct answer!",
          correct: true,
          points: response.points_awarded
        });
        setIsSolved(true);
      } else {
        setSubmitSuccess({
          message: "Wrong answer, try again!",
          correct: false,
          points: 0
        });
      }
      
      // Don't clear the answer if it was wrong
      if (response.correct) {
        setAnswer('');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setSubmitError(error.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAnswerInput = () => {
    // Check if the question contains "Options:" to determine if it's MCQ
    const isMCQ = problem?.question.includes('Options:');
    
    if (isMCQ) {
      // Extract options from the question
      const optionsText = problem.question.split('Options:')[1];
      const options = optionsText.split(/\d+\./).filter(opt => opt.trim());
      
      return (
        <FormControl component="fieldset">
          <RadioGroup
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          >
            {options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option.trim()}
                control={<Radio />}
                label={option.trim()}
                disabled={submitting}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }
    
    return (
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
    );
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" component="h1">
                  Problem {problemOrder}: {problem.title}
                </Typography>
                {isSolved && (
                  <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {problem.question.split('Options:')[0]}
            </Typography>
            {problem.question.includes('Options:') && (
              <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
                Options:
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Submit Your Answer
            </Typography>
            <form onSubmit={handleSubmit}>
              {renderAnswerInput()}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
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
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </form>
          </Grid>

          {submitError && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            </Grid>
          )}

          {submitSuccess && (
            <Grid item xs={12}>
              <Alert 
                severity={submitSuccess.correct ? "success" : "error"}
                sx={{ mt: 2 }}
              >
                {submitSuccess.message}
                {submitSuccess.correct && ` (+${submitSuccess.points} points)`}
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
};

export default ContestProblemView; 
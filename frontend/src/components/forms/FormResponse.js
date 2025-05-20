import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getForm, submitResponse } from '../../utils/api';

const FormResponse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  const loadForm = async () => {
    setLoading(true);
    try {
      const response = await getForm(id);
      setForm(response.data);
      initializeResponses(response.data.questions);
    } catch (err) {
      setError('Failed to load form: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const initializeResponses = (questions) => {
    const initialResponses = {};
    questions.forEach((question) => {
      if (question.type === 'multiple_choice') {
        initialResponses[question.id] = [];
      } else {
        initialResponses[question.id] = '';
      }
    });
    setResponses(initialResponses);
  };

  const handleInputChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  const handleCheckboxChange = (questionId, optionId) => {
    const currentResponses = responses[questionId] || [];
    const newResponses = currentResponses.includes(optionId)
      ? currentResponses.filter((id) => id !== optionId)
      : [...currentResponses, optionId];
    setResponses({
      ...responses,
      [questionId]: newResponses,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await submitResponse(id, { response_data: responses });
      // Show success message
      alert('Response submitted successfully!');
      navigate('/forms');
    } catch (err) {
      console.error('Submit error:', err);
      setError(
        'Failed to submit response: ' + 
        (err.response?.data?.error || 'Unknown error')
      );
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
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Form not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {form.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {form.description}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {form.questions.map((question) => (
            <Box key={question.id} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {question.label}
                {question.required && (
                  <Typography
                    component="span"
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    *
                  </Typography>
                )}
              </Typography>

              {question.type === 'short_text' && (
                <TextField
                  fullWidth
                  value={responses[question.id] || ''}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  required={question.required}
                  disabled={submitting}
                />
              )}

              {question.type === 'long_text' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={responses[question.id] || ''}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  required={question.required}
                  disabled={submitting}
                />
              )}

              {question.type === 'single_choice' && (
                <RadioGroup
                  value={responses[question.id] || ''}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                >
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id.toString()}
                      control={<Radio disabled={submitting} />}
                      label={option.text}
                    />
                  ))}
                </RadioGroup>
              )}

              {question.type === 'multiple_choice' && (
                <FormGroup>
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      control={
                        <Checkbox
                          checked={(responses[question.id] || []).includes(
                            option.id.toString()
                          )}
                          onChange={() =>
                            handleCheckboxChange(
                              question.id,
                              option.id.toString()
                            )
                          }
                          disabled={submitting}
                        />
                      }
                      label={option.text}
                    />
                  ))}
                </FormGroup>
              )}

              {question.type === 'date' && (
                <TextField
                  type="date"
                  fullWidth
                  value={responses[question.id] || ''}
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.value)
                  }
                  required={question.required}
                  disabled={submitting}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}

              {question.type === 'file' && (
                <TextField
                  type="file"
                  fullWidth
                  onChange={(e) =>
                    handleInputChange(question.id, e.target.files[0])
                  }
                  required={question.required}
                  disabled={submitting}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              )}
            </Box>
          ))}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Response'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default FormResponse;
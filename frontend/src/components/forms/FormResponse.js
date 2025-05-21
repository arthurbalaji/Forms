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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  
  Title as TitleIcon,
} from '@mui/icons-material';
import { getForm, submitResponse } from '../../utils/api';

const FormResponse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState({});
  const [fileInputs, setFileInputs] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForm();
    // eslint-disable-next-line
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
    setFileInputs({});
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

  const handleFileChange = (questionId, file) => {
    setFileInputs({
      ...fileInputs,
      [questionId]: file,
    });
    setResponses({
      ...responses,
      [questionId]: file ? file.name : '',
    });
  };

  const validateResponses = () => {
    const errors = [];
    if (!form) return errors;
    form.questions.forEach((question) => {
      if (question.required) {
        const response = responses[question.id];
        if (!response ||
          (Array.isArray(response) && response.length === 0) ||
          (typeof response === 'string' && response.trim() === '')
        ) {
          errors.push(`"${question.label}" is required`);
        }
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateResponses();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    setSubmitting(true);
    try {
      // For file uploads use FormData
      const formData = new FormData();
      formData.append('response_data', JSON.stringify(responses));
      Object.entries(fileInputs).forEach(([qid, file]) => {
        if (file) formData.append(qid, file);
      });
      await submitResponse(id, formData, true); // true for multipart
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

  if (error && !form) {
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
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper
        elevation={8}
        sx={{
          borderRadius: 4,
          p: 4,
          bgcolor: '#f8f9fa',
          boxShadow: '0 4px 24px rgba(60,64,67,0.12)',
          minHeight: 800,
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <TitleIcon fontSize="large" color="primary" />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              mb: 0,
              letterSpacing: 0.5,
              color: '#222'
            }}
            gutterBottom
          >
            {form.title}
          </Typography>
          {form.description && (
            <Typography
              variant="body1"
              sx={{
                color: '#555',
                textAlign: 'center',
                maxWidth: 500,
              }}
              gutterBottom
            >
              {form.description}
            </Typography>
          )}
        </Stack>
        <Divider sx={{ mb: 3 }} />
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {form.questions.map((question, idx) => (
              <Card
                key={question.id}
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  boxShadow: '0 2px 10px rgba(60,64,67,0.08)',
                  border: '1.5px solid #e0e0e0',
                  transition: 'box-shadow .2s',
                  '&:hover': { boxShadow: '0 6px 24px rgba(60,64,67,0.14)' },
                  px: 1,
                  background: '#fff',
                }}
              >
                <CardContent sx={{ pb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      color: '#333',
                      fontSize: 18,
                    }}
                    gutterBottom
                  >
                    {idx + 1}. {question.label}
                    {question.required && (
                      <Typography
                        component="span"
                        color="error"
                        sx={{ ml: 1, fontWeight: 600 }}
                      >
                        *
                      </Typography>
                    )}
                  </Typography>
                  {question.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {question.description}
                    </Typography>
                  )}

                  {question.type === 'short_text' && (
                    <TextField
                      variant="standard"
                      fullWidth
                      value={responses[question.id] || ''}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                      required={question.required}
                      disabled={submitting}
                      placeholder="Short answer"
                      sx={{ mt: 1 }}
                    />
                  )}

                  {question.type === 'long_text' && (
                    <TextField
                      variant="standard"
                      fullWidth
                      multiline
                      rows={4}
                      value={responses[question.id] || ''}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                      required={question.required}
                      disabled={submitting}
                      placeholder="Paragraph"
                      sx={{ mt: 1 }}
                    />
                  )}

                  {question.type === 'single_choice' && (
                    <RadioGroup
                      value={responses[question.id] || ''}
                      onChange={(e) =>
                        handleInputChange(question.id, e.target.value)
                      }
                      sx={{ mt: 1 }}
                    >
                      {question.options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          value={option.id.toString()}
                          control={<Radio color="primary" disabled={submitting} />}
                          label={option.text}
                          sx={{
                            ml: 0,
                            '& .MuiFormControlLabel-label': { fontSize: 16 }
                          }}
                        />
                      ))}
                    </RadioGroup>
                  )}

                  {question.type === 'multiple_choice' && (
                    <FormGroup sx={{ mt: 1 }}>
                      {question.options.map((option) => (
                        <FormControlLabel
                          key={option.id}
                          control={
                            <Checkbox
                              color="primary"
                              checked={(responses[question.id] || []).includes(option.id.toString())}
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
                          sx={{
                            ml: 0,
                            '& .MuiFormControlLabel-label': { fontSize: 16 }
                          }}
                        />
                      ))}
                    </FormGroup>
                  )}

                  {question.type === 'dropdown' && (
                    <FormControl variant="standard" fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Select an option</InputLabel>
                      <Select
                        value={responses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        required={question.required}
                        disabled={submitting}
                        label="Select an option"
                      >
                        {question.options.map((option) => (
                          <MenuItem key={option.id} value={option.id.toString()}>
                            {option.text}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {question.type === 'date' && (
                    <TextField
                      variant="standard"
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
                      sx={{ mt: 1 }}
                    />
                  )}

                  {question.type === 'time' && (
                    <TextField
                      variant="standard"
                      type="time"
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
                      sx={{ mt: 1 }}
                    />
                  )}

                  {question.type === 'file' && (
                    <TextField
                      variant="standard"
                      type="file"
                      fullWidth
                      onChange={(e) =>
                        handleFileChange(question.id, e.target.files[0])
                      }
                      required={question.required}
                      disabled={submitting}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error.split('\n').map((err, index) => (
                  <div key={index}>{err}</div>
                ))}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                mt: 2,
                fontWeight: 700,
                fontSize: 18,
                bgcolor: '#4285f4',
                '&:hover': { bgcolor: '#1a73e8' },
                borderRadius: 999,
                boxShadow: '0 2px 12px rgba(66,133,244,0.09)',
                py: 1.5,
              }}
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : 'Submit Response'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default FormResponse;
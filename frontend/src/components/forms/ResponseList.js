import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { getForm, getFormResponses, exportResponses } from '../../utils/api';

const ResponseList = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadFormAndResponses();
  }, [id]);

  const loadFormAndResponses = async () => {
    setLoading(true);
    try {
      const [formResponse, responsesResponse] = await Promise.all([
        getForm(id),
        getFormResponses(id),
      ]);
      setForm(formResponse.data);
      setResponses(responsesResponse.data);
    } catch (err) {
      setError('Failed to load responses: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await exportResponses(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form.title}_responses_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export responses: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  const renderResponse = (value, type, question) => {
    if (!value) return '-';

    switch (type) {
      case 'multiple_choice':
        if (!Array.isArray(value)) return value;
        return value
          .map(optionId => 
            question.options.find(opt => opt.id.toString() === optionId)?.text || optionId
          )
          .filter(text => text) // Remove any undefined values
          .join(', ');
      
      case 'single_choice':
        return question.options.find(opt => opt.id.toString() === value)?.text || value;
      
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch (err) {
          return value;
        }
      
      case 'file':
        return 'File uploaded'; // You might want to add a download link here
      
      default:
        return value;
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
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 4 }}>Form not found</Alert>
      </Container>
    );
  }

  if (responses.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2 }}>
          <Typography variant="h4">{form.title} - Responses</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
        <Alert severity="info">No responses yet</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2 }}>
        <Typography variant="h4">{form.title} - Responses</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exportLoading}
        >
          {exportLoading ? <CircularProgress size={24} /> : 'Export CSV'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Respondent</TableCell>
              <TableCell>Submitted At</TableCell>
              {form.questions.map((question) => (
                <TableCell key={question.id}>{question.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {responses.map((response) => (
              <TableRow key={response.id}>
                <TableCell>
                  {response.respondent?.username || 'Anonymous'}
                </TableCell>
                <TableCell>
                  {new Date(response.submitted_at).toLocaleString()}
                </TableCell>
                {form.questions.map((question) => (
                  <TableCell key={question.id}>
                    {renderResponse(
                      response.response_data[question.id],
                      question.type,
                      question
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ResponseList;
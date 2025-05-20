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
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { getForm, getFormResponses, exportResponses } from '../../utils/api';

const ResponseList = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFormAndResponses();
  }, [id]);

  const loadFormAndResponses = async () => {
    try {
      const [formResponse, responsesResponse] = await Promise.all([
        getForm(id),
        getFormResponses(id),
      ]);
      setForm(formResponse.data);
      setResponses(responsesResponse.data);
    } catch (err) {
      setError('Failed to load responses');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportResponses(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form.title}_responses.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export responses');
    }
  };

  if (!form) {
    return <Typography>Loading...</Typography>;
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
        >
          Export CSV
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
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
                      question.type
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

const renderResponse = (value, type) => {
  if (!value) return '-';

  switch (type) {
    case 'multiple_choice':
      return Array.isArray(value) ? value.join(', ') : value;
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'file':
      return 'File uploaded'; // You might want to add a download link here
    default:
      return value;
  }
};

export default ResponseList;
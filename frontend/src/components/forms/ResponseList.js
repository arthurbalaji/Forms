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
  Tooltip,
  IconButton,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { getForm, getFormResponses, exportResponses } from '../../utils/api';

const ResponseList = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadFormAndResponses();
  }, [id]);

  const loadFormAndResponses = async () => {
    setLoading(true);
    setError('');
    try {
      const [formResponse, responsesResponse] = await Promise.all([
        getForm(id),
        getFormResponses(id),
      ]);
      setForm(formResponse.data);
      setResponses(responsesResponse.data);
    } catch (err) {
      setError(
        'Failed to load responses: ' + (err.response?.data?.error || 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const responsesResponse = await getFormResponses(id);
      setResponses(responsesResponse.data);
    } catch (err) {
      setError(
        'Failed to refresh responses: ' + (err.response?.data?.error || 'Unknown error')
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await exportResponses(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute(
        'download',
        `${form.title}_responses_${timestamp}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        'Failed to export responses: ' + (err.response?.data?.error || 'Unknown error')
      );
    } finally {
      setExportLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (err) {
      return dateString;
    }
  };

  const renderResponse = (value, type, question) => {
    if (!value) return '-';

    switch (type) {
      case 'multiple_choice':
        if (!Array.isArray(value)) return value;
        return (
          <Box>
            {value.map((optionId) => {
              const optionText = question.options.find(
                (opt) => opt.id.toString() === optionId
              )?.text;
              return (
                <Chip
                  key={optionId}
                  label={optionText || optionId}
                  size="small"
                  sx={{ m: 0.5 }}
                />
              );
            })}
          </Box>
        );

      case 'single_choice':
      case 'dropdown':
        const optionText = question.options.find(
          (opt) => opt.id.toString() === value
        )?.text;
        return optionText || value;

      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch (err) {
          return value;
        }

      case 'time':
        return value;

      case 'file':
        return value ? 'File uploaded' : '-';

      case 'long_text':
        return (
          <Tooltip title={value}>
            <Typography
              sx={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value}
            </Typography>
          </Tooltip>
        );

      default:
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (response) => {
    setSelectedResponse(response);
    setDetailDialogOpen(true);
  };

  const ResponseDetailDialog = () => (
    <Dialog
      open={detailDialogOpen}
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Response Details</DialogTitle>
      <DialogContent>
        {selectedResponse && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Submitted by: {selectedResponse.respondent_username || 'Anonymous'}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Submitted at: {formatDateTime(selectedResponse.submitted_at)}
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Response</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <Typography variant="body2">{question.label}</Typography>
                        {question.description && (
                          <Typography variant="caption" color="textSecondary">
                            {question.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {renderResponse(
                          selectedResponse.response_data[question.id],
                          question.type,
                          question
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

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
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!form) {
    return (
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mt: 4 }}>
          Form not found
        </Alert>
      </Container>
    );
  }

  if (responses.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: 4,
            mb: 2,
          }}
        >
          <Typography variant="h4">{form.title} - Responses</Typography>
          <Box>
            <Tooltip title="Refresh responses">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ mr: 1 }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
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
        </Box>
        <Alert severity="info">No responses yet</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 4,
          mb: 2,
        }}
      >
        <Typography variant="h4">{form.title} - Responses</Typography>
        <Box>
          <Tooltip title="Refresh responses">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportLoading}
            sx={{ mr: 1 }}
          >
            {exportLoading ? <CircularProgress size={24} /> : 'Export CSV'}
          </Button>
        </Box>
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
              <TableCell>
                Respondent
                <Tooltip title="Username of the person who submitted the response">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              <TableCell>
                Submitted At
                <Tooltip title="Submission time in UTC">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
              {form.questions.map((question) => (
                <TableCell key={question.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>
                      {question.label}
                      {question.required && (
                        <Typography
                          component="span"
                          color="error"
                          sx={{ ml: 0.5 }}
                        >
                          *
                        </Typography>
                      )}
                    </Typography>
                    <Tooltip title="View full details">
                      <IconButton size="small">
                        <FullscreenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {responses
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((response) => (
                <TableRow
                  key={response.id}
                  hover
                  onClick={() => handleViewDetails(response)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Tooltip
                      title={`Submitted by: ${
                        response.respondent_username || 'Anonymous'
                      }`}
                    >
                      <span>
                        {response.respondent_username || 'Anonymous'}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={`Full timestamp: ${formatDateTime(
                        response.submitted_at
                      )}`}
                    >
                      <span>
                        {formatDateTime(response.submitted_at)}
                      </span>
                    </Tooltip>
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

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={responses.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <ResponseDetailDialog />
    </Container>
  );
};

export default ResponseList;
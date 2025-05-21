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
  Stack,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Fullscreen as FullscreenIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadFormAndResponses();
    // eslint-disable-next-line
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
      setSnackbar({ open: true, message: 'Responses refreshed!', severity: 'success' });
    } catch (err) {
      setError(
        'Failed to refresh responses: ' + (err.response?.data?.error || 'Unknown error')
      );
      setSnackbar({ open: true, message: 'Failed to refresh responses', severity: 'error' });
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
      setSnackbar({ open: true, message: 'CSV exported!', severity: 'success' });
    } catch (err) {
      setError(
        'Failed to export responses: ' + (err.response?.data?.error || 'Unknown error')
      );
      setSnackbar({ open: true, message: 'Failed to export CSV', severity: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (err) {
      return dateString;
    }
  };

  const renderResponse = (value, type, question, file_urls) => {
    if (!value) return <Typography color="text.secondary">-</Typography>;

    switch (type) {
      case 'multiple_choice':
        if (!Array.isArray(value)) return value;
        return (
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {value.map((optionId) => {
              const optionText = question.options.find(
                (opt) => opt.id.toString() === optionId
              )?.text;
              return (
                <Chip
                  key={optionId}
                  label={optionText || optionId}
                  size="small"
                  sx={{ bgcolor: "#e3e7ea" }}
                />
              );
            })}
          </Stack>
        );

      case 'single_choice':
      case 'dropdown': {
        const optionText = question.options.find(
          (opt) => opt.id.toString() === value
        )?.text;
        return optionText || value;
      }

      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch (err) {
          return value;
        }

      case 'file':
        if (file_urls && file_urls[question.id]) {
          return (
            <Button
              href={file_urls[question.id]}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 500 }}
              download
            >
              Download
            </Button>
          );
        }
        return value ? 'File uploaded' : '-';

      case 'long_text':
        return (
          <Tooltip title={value}>
            <Typography
              sx={{
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 15
              }}
              color="text.primary"
            >
              {value}
            </Typography>
          </Tooltip>
        );

      default:
        return typeof value === 'string'
          ? <Typography color="text.primary">{value}</Typography>
          : JSON.stringify(value);
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

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const ResponseDetailDialog = () => (
    <Dialog
      open={detailDialogOpen}
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 2 }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, letterSpacing: 0.2, pb: 1 }}>
        Response Details
      </DialogTitle>
      <DialogContent>
        {selectedResponse && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <AssignmentTurnedInIcon color="primary" />
              <Typography variant="subtitle1">
                Submitted by: <b>{selectedResponse.respondent_username || 'Anonymous'}</b>
              </Typography>
              <Chip
                size="small"
                label={formatDateTime(selectedResponse.submitted_at)}
                sx={{ bgcolor: "#e3e7ea" }}
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Question</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Response</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell sx={{ minWidth: 160, maxWidth: 240 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{question.label}</Typography>
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
                          question,
                          selectedResponse.file_urls // Pass file_urls for dialog
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
        <Button onClick={() => setDetailDialogOpen(false)} color="primary" variant="contained" sx={{ borderRadius: 999, px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 7 }}>
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
            mt: 6,
            mb: 2,
            alignItems: 'center',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <AssignmentTurnedInIcon color="primary" fontSize="large" />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{form.title} - Responses</Typography>
          </Stack>
          <Box>
            <Tooltip title="Refresh responses">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ mr: 1 }}
                size="large"
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
              sx={{
                borderRadius: 999,
                px: 3,
                fontWeight: 600,
                bgcolor: "#4285f4",
                '&:hover': { bgcolor: "#1a73e8" }
              }}
            >
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </Button>
          </Box>
        </Box>
        <Alert severity="info" sx={{ mt: 4, fontSize: 18, borderRadius: 3 }}>
          No responses yet
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 6,
          mb: 2,
          alignItems: 'center',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <AssignmentTurnedInIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{form.title} - Responses</Typography>
        </Stack>
        <Box>
          <Tooltip title="Refresh responses">
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{ mr: 1 }}
                size="large"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportLoading}
            sx={{
              borderRadius: 999,
              px: 3,
              fontWeight: 600,
              bgcolor: "#4285f4",
              '&:hover': { bgcolor: "#1a73e8" }
            }}
          >
            {exportLoading ? <CircularProgress size={20} color="inherit" /> : 'Export CSV'}
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={4} sx={{ borderRadius: 4, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f1f3f4" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>
                  Respondent
                  <Tooltip title="Username of the person who submitted the response">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 15 }}>
                  Submitted At
                  <Tooltip title="Submission time in your timezone">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                {form.questions.map((question) => (
                  <TableCell key={question.id} sx={{ fontWeight: 700, fontSize: 15 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 0.5 }}>
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
                    sx={{
                      cursor: 'pointer',
                      transition: "background .15s",
                      "&:hover": { bgcolor: "#eaf2fd" }
                    }}
                  >
                    <TableCell>
                      <Tooltip
                        title={`Submitted by: ${response.respondent_username || 'Anonymous'}`}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {response.respondent_username || 'Anonymous'}
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Full timestamp: ${formatDateTime(response.submitted_at)}`}
                      >
                        <span>{formatDateTime(response.submitted_at)}</span>
                      </Tooltip>
                    </TableCell>
                    {form.questions.map((question) => (
                      <TableCell key={question.id}>
                        {renderResponse(
                          response.response_data[question.id],
                          question.type,
                          question,
                          response.file_urls // Pass file_urls here
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
          sx={{ bgcolor: "#f8f9fa", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}
        />
      </Paper>
      <ResponseDetailDialog />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbar.message}
      />
    </Container>
  );
};

export default ResponseList;
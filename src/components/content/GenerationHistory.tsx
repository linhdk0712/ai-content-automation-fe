import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress,
  Tooltip,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import {
  ArrowBack,
  Visibility,
  Refresh,
  ContentCopy,
  Download,
  FilterList,
  Search,
  TrendingUp,
  MonetizationOn,
  Timer,
  Assessment,
  CheckCircle,
  Error,
  SendToMobile
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useGenerationHistory } from '../../hooks/useGenerationHistory';
import { triggerAiAvatarWorkflow } from '../../services/n8n.service';
import { generateContentId } from '../../utils/uuid';
import { useI18n } from '../../hooks/useI18n';
import SendToWorkflowButton from './SendToWorkflowButton';

interface GenerationHistoryProps {
  onRegenerateContent: (historyEntry: any) => void;
  onBackToCreate: () => void;
}

const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  onRegenerateContent,
  onBackToCreate
}) => {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [filterProvider, setFilterProvider] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    history,
    monthlyStats,
    isLoading,
    error,
    loadHistory,
    loadMonthlyStats,
    regenerateContent
  } = useGenerationHistory();

  useEffect(() => {
    loadHistory(page, rowsPerPage);
    loadMonthlyStats();
  }, [page, rowsPerPage, loadHistory, loadMonthlyStats]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRegenerate = async (entry: any) => {
    await regenerateContent(entry.requestId);
    onRegenerateContent(entry);
  };

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('info');

  const handleWorkflowSuccess = (runId: string) => {
    setToastSeverity('success');
    setToastMsg(t('sendToWorkflow.sentToWorkflow'));
    setToastOpen(true);
  };

  const handleWorkflowError = (error: Error) => {
    setToastSeverity('error');
    setToastMsg(t('sendToWorkflow.failedToSendWorkflow'));
    setToastOpen(true);
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show success toast
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle color="success" fontSize="small" />
    ) : (
      <Error color="error" fontSize="small" />
    );
  };

  const getQualityColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const filteredHistory = history.filter((entry) => {
    const matchesSearch = !searchQuery ||
      entry.generatedContent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.generatedTitle?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = !filterProvider || entry.aiProvider?.includes(filterProvider);
    const matchesIndustry = !filterIndustry || entry.industry === filterIndustry;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'success' && entry.success) ||
      (filterStatus === 'failed' && !entry.success);

    return matchesSearch && matchesProvider && matchesIndustry && matchesStatus;
  });

  const renderStatsCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {monthlyStats?.totalGenerations || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Generations
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <MonetizationOn color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              ${monthlyStats?.totalCost?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cost
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Assessment color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {monthlyStats?.averageQualityScore?.toFixed(1) || '0.0'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Quality Score
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Timer color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">
              {monthlyStats?.averageResponseTime ?
                `${(monthlyStats.averageResponseTime / 1000).toFixed(1)}s` :
                '0.0s'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Response Time
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                label="Provider"
              >
                <MenuItem value="">All Providers</MenuItem>
                <MenuItem value="OpenAI">OpenAI</MenuItem>
                <MenuItem value="Gemini">Gemini</MenuItem>
                <MenuItem value="Claude">Claude</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                label="Industry"
              >
                <MenuItem value="">All Industries</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="E-commerce">E-commerce</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="success">Successful</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredHistory.length} of {history.length} entries
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderHistoryTable = () => (
    <Card>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Content</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Industry</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Generated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton /></TableCell>
                </TableRow>
              ))
            ) : (
              filteredHistory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry) => (
                  <TableRow key={entry.requestId} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(entry.success)}
                        <Box sx={{ ml: 1, maxWidth: 300 }}>
                          {entry.generatedTitle && (
                            <Typography variant="subtitle2" noWrap>
                              {entry.generatedTitle}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {entry.generatedContent?.substring(0, 100)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.aiProvider?.split(' ')[0] || 'Unknown'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.industry}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {entry.qualityScore ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress
                            variant="determinate"
                            value={entry.qualityScore * 10}
                            color={getQualityColor(entry.qualityScore)}
                            sx={{ width: 60, mr: 1 }}
                          />
                          <Typography variant="body2">
                            {entry.qualityScore}/10
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ${entry.generationCost?.toFixed(4) || '0.0000'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(entry.createdAt), 'MMM dd, HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedEntry(entry as any)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {entry.success && (
                          <>
                            <Tooltip title="Copy content">
                              <IconButton
                                size="small"
                                onClick={() => handleCopyContent(entry.generatedContent)}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                            <SendToWorkflowButton
                              content={entry.generatedContent}
                              title={`Generated Content - ${format(new Date(entry.createdAt), 'MMM dd, yyyy')}`}
                              metadata={{
                                industry: entry.industry,
                                contentType: entry.contentType,
                                language: entry.language,
                                tone: entry.tone,
                                targetAudience: entry.targetAudience,
                                aiProvider: entry.aiProvider,
                                aiModel: entry.aiModel
                              }}
                              variant="outlined"
                              size="small"
                              onSuccess={handleWorkflowSuccess}
                              onError={handleWorkflowError}
                            />
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredHistory.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBackToCreate} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" gutterBottom>
            Generation History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your content generation history
          </Typography>
        </Box>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Monthly Stats */}
      {monthlyStats && renderStatsCards()}

      {/* Filters */}
      {renderFilters()}

      {/* History Table */}
      {renderHistoryTable()}

      {/* Entry Detail Dialog */}
      <Dialog
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null as any)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Generation Details
            </Typography>
            {selectedEntry && getStatusIcon(selectedEntry.success)}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              {/* Basic Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Provider
                  </Typography>
                  <Typography variant="body1">
                    {selectedEntry.aiProvider}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Industry
                  </Typography>
                  <Typography variant="body1">
                    {selectedEntry.industry}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Content Type
                  </Typography>
                  <Typography variant="body1">
                    {selectedEntry.contentType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Generated At
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedEntry.createdAt), 'PPpp')}
                  </Typography>
                </Grid>
              </Grid>

              {/* Metrics */}
              {selectedEntry.success && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quality Score
                    </Typography>
                    <Typography variant="h6">
                      {selectedEntry.qualityScore}/10
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cost
                    </Typography>
                    <Typography variant="h6">
                      ${selectedEntry.generationCost?.toFixed(4)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tokens Used
                    </Typography>
                    <Typography variant="h6">
                      {selectedEntry.tokensUsed}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Response Time
                    </Typography>
                    <Typography variant="h6">
                      {(selectedEntry.responseTimeMs / 1000).toFixed(1)}s
                    </Typography>
                  </Grid>
                </Grid>
              )}

              {/* Content */}
              <Typography variant="subtitle2" gutterBottom>
                {selectedEntry.success ? 'Generated Content:' : 'Error Message:'}
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: selectedEntry.success ? 'grey.50' : 'error.light',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  maxHeight: 300,
                  overflow: 'auto'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedEntry.success ? selectedEntry.generatedContent : selectedEntry.errorMessage}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEntry(null as any)}>
            Close
          </Button>
          {selectedEntry?.success && (
            <>
              <Button
                onClick={() => handleCopyContent(selectedEntry.generatedContent)}
                startIcon={<ContentCopy />}
              >
                Copy Content
              </Button>
              <SendToWorkflowButton
                content={selectedEntry.generatedContent}
                title={`Generated Content - ${format(new Date(selectedEntry.createdAt), 'MMM dd, yyyy')}`}
                metadata={{
                  industry: selectedEntry.industry,
                  contentType: selectedEntry.contentType,
                  language: selectedEntry.language,
                  tone: selectedEntry.tone,
                  targetAudience: selectedEntry.targetAudience,
                  aiProvider: selectedEntry.aiProvider,
                  aiModel: selectedEntry.aiModel
                }}
                variant="contained"
                onSuccess={(runId) => {
                  handleWorkflowSuccess(runId);
                  setSelectedEntry(null as any);
                }}
                onError={handleWorkflowError}
              />
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" onClose={() => setToastOpen(false)} severity={toastSeverity}>
          {toastMsg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default GenerationHistory;
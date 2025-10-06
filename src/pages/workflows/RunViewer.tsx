import { Box, Chip, CircularProgress, Container, Alert as MuiAlert, Snackbar, Typography, Card, CardContent, Grid, Divider } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import type { N8nWorkflowRunDto } from '../../services/n8n.service'
import ContentWorkflowStatus from '../../components/ContentWorkflowStatus'
import styles from './RunViewer.module.css'

const POLL_INTERVAL_MS = 3000

const statusColor = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'RUNNING': return 'warning'
    case 'COMPLETED': return 'success'
    case 'FAILED': return 'error'
    case 'QUEUED': return 'default'
    case 'CANCELLED': return 'default'
    default: return 'default'
  }
}

const RunViewer: React.FC = () => {
  const { runId } = useParams<{ runId: string }>()
  const [searchParams] = useSearchParams()
  const contentId = searchParams.get('contentId')
  
  const [run, setRun] = useState<N8nWorkflowRunDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Mock user ID - in real app, get from auth context
  const userId = 1

  useEffect(() => {
    let timer: number | undefined
    let mounted = true

    const fetchRun = async () => {
      const data = await apiRequest.get<N8nWorkflowRunDto>(`/n8n/runs/${runId}`)
      if (!mounted) return
      setRun(data)
      setLoading(false)
      if (data.status && ['RUNNING','QUEUED'].includes(data.status.toUpperCase())) {
        timer = window.setTimeout(fetchRun, POLL_INTERVAL_MS)
      }
    }

    fetchRun().catch(() => {
      if (!mounted) return
      setErrorMsg('Failed to load workflow run')
      setLoading(false)
    })
    return () => {
      mounted = false
      if (timer) window.clearTimeout(timer)
    }
  }, [runId])

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          Workflow Run Details
        </Typography>
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography>Loading...</Typography>
          </Box>
        )}
        
        {!loading && run && (
          <Grid container spacing={3}>
            {/* Content Workflow Status (if contentId is available) */}
            {contentId && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Content Workflow Overview
                </Typography>
                <ContentWorkflowStatus
                  contentId={parseInt(contentId)}
                  userId={userId}
                  showDetails={true}
                />
                <Divider sx={{ my: 3 }} />
              </Grid>
            )}
            
            {/* Run Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Run Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Run ID:</strong> {run.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Workflow:</strong> {run.workflowKey}
                    </Typography>
                    <Typography variant="body2">
                      <strong>External Run ID:</strong> {run.runId || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Content ID:</strong> {run.contentId || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>User ID:</strong> {run.userId || 'N/A'}
                    </Typography>
                    <Box sx={{ my: 1 }}>
                      <Chip label={run.status} color={statusColor(run.status) as any} />
                    </Box>
                    <Typography variant="body2">
                      <strong>Started:</strong> {new Date(run.startedAt).toLocaleString()}
                    </Typography>
                    {run.finishedAt && (
                      <Typography variant="body2">
                        <strong>Finished:</strong> {new Date(run.finishedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Input Data */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Input Data
                  </Typography>
                  <Box
                    component="pre"
                    className={styles.preOutput}
                    sx={{
                      maxHeight: 300,
                      overflow: 'auto',
                      backgroundColor: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    {run.input ? JSON.stringify(JSON.parse(run.input), null, 2) : 'No input data'}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Error Message */}
            {run.errorMessage && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error" gutterBottom>
                      Error Details
                    </Typography>
                    <Typography color="error" variant="body2">
                      {run.errorMessage}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Output Data */}
            {run.output && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Output Data
                    </Typography>
                    <Box
                      component="pre"
                      className={styles.preOutput}
                      sx={{
                        maxHeight: 400,
                        overflow: 'auto',
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {JSON.stringify(JSON.parse(run.output), null, 2)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
      
      <Snackbar 
        open={!!errorMsg} 
        autoHideDuration={3000} 
        onClose={() => setErrorMsg(null)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" severity="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  )
}

export default RunViewer



import { Box, Chip, CircularProgress, Container, Alert as MuiAlert, Snackbar, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import type { N8nWorkflowRunDto } from '../../services/n8n.service'
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
  const [run, setRun] = useState<N8nWorkflowRunDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    <Container maxWidth="md">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" gutterBottom>Workflow Run</Typography>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography>Loading...</Typography>
          </Box>
        )}
        {!loading && run && (
          <Box>
            <Typography variant="subtitle1">Run ID: {run.id}</Typography>
            <Typography variant="subtitle1">Workflow: {run.workflowKey}</Typography>
            <Box sx={{ my: 1 }}>
              <Chip label={run.status} color={statusColor(run.status) as any} />
            </Box>
            <Typography variant="body2">Started: {run.startedAt}</Typography>
            {run.finishedAt && <Typography variant="body2">Finished: {run.finishedAt}</Typography>}
            {run.errorMessage && (
              <Box sx={{ mt: 2 }}>
                <Typography color="error">Error: {run.errorMessage}</Typography>
              </Box>
            )}
            {run.output && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Output</Typography>
                <pre className={styles.preOutput}>
{JSON.stringify(JSON.parse(run.output), null, 2)}
                </pre>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" severity="error" onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </MuiAlert>
      </Snackbar>
    </Container>
  )
}

export default RunViewer



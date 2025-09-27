import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import {
  useAvailableCategories,
  useBulkListOfValues,
  useSearchListOfValues,
} from '../../hooks/useListOfValues'
import { ListOfValuesDemo } from '../../components/demo/ListOfValuesDemo'
import { useQueryClient } from '@tanstack/react-query'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

/**
 * Admin page for managing List of Values system
 */
export const ListOfValuesManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCacheDialog, setShowCacheDialog] = useState(false)

  const queryClient = useQueryClient()

  // Hooks
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useAvailableCategories()
  const { data: bulkData, isLoading: bulkLoading, refetch: refetchBulk } = useBulkListOfValues(
    selectedCategories.length > 0 ? selectedCategories : categories || []
  )
  const { data: searchResults, isLoading: searchLoading } = useSearchListOfValues(
    searchQuery,
    undefined,
    { enabled: searchQuery.length >= 2 }
  )

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSelectAllCategories = () => {
    setSelectedCategories(categories || [])
  }

  const handleClearCategories = () => {
    setSelectedCategories([])
  }

  const handleRefreshCache = () => {
    queryClient.invalidateQueries({ queryKey: ['listOfValues'] })
    refetchCategories()
    refetchBulk()
    setShowCacheDialog(false)
  }

  const handleExportData = () => {
    if (bulkData) {
      const dataStr = JSON.stringify(bulkData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `list-of-values-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          List of Values Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setShowCacheDialog(true)}
          >
            Refresh Cache
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
            disabled={!bulkData}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Categories" />
        <Tab label="Search" />
        <Tab label="Demo" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="System Status" />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Total Categories:</Typography>
                    <Chip label={categories?.length || 0} color="primary" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Total Values:</Typography>
                    <Chip 
                      label={bulkData ? Object.values(bulkData).reduce((sum, values) => sum + values.length, 0) : 0} 
                      color="secondary" 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Cache Status:</Typography>
                    <Chip label="Active" color="success" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Categories Overview" />
              <CardContent>
                {categoriesLoading ? (
                  <CircularProgress />
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {categories?.map(category => (
                      <Chip
                        key={category}
                        label={`${category} (${bulkData?.[category]?.length || 0})`}
                        variant="outlined"
                        onClick={() => handleCategoryToggle(category)}
                        color={selectedCategories.includes(category) ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" onClick={handleSelectAllCategories}>
                  Select All Categories
                </Button>
                <Button size="small" onClick={handleClearCategories}>
                  Clear Selection
                </Button>
                <Button size="small" onClick={() => refetchBulk()}>
                  Reload Data
                </Button>
              </Box>
            </Alert>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Categories Tab */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Category Details
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Detailed view of all categories and their values
          </Typography>
        </Box>

        {bulkLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {Object.entries(bulkData || {}).map(([category, values]) => (
              <Accordion key={category}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {category} ({values.length} items)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Value</TableCell>
                          <TableCell>Label</TableCell>
                          <TableCell>Display Label</TableCell>
                          <TableCell>Sort Order</TableCell>
                          <TableCell>Active</TableCell>
                          <TableCell>Icon</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {values.map((value) => (
                          <TableRow key={value.value}>
                            <TableCell>
                              <code>{value.value}</code>
                            </TableCell>
                            <TableCell>{value.label}</TableCell>
                            <TableCell>{value.displayLabel}</TableCell>
                            <TableCell>{value.sortOrder}</TableCell>
                            <TableCell>
                              <Chip
                                label={value.active ? 'Yes' : 'No'}
                                color={value.active ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {value.iconUrl && (
                                <img
                                  src={value.iconUrl}
                                  alt={value.label}
                                  style={{ width: 20, height: 20 }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Search Tab */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Values
          </Typography>
          <TextField
            fullWidth
            placeholder="Search across all categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {searchLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {searchResults && Object.keys(searchResults).length > 0 && (
          <Grid container spacing={2}>
            {Object.entries(searchResults).map(([category, values]) => (
              <Grid item xs={12} md={6} key={category}>
                <Card>
                  <CardHeader title={category} />
                  <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {values.map((value) => (
                        <Chip
                          key={value.value}
                          label={value.displayLabel || value.label}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {searchQuery.length >= 2 && searchResults && Object.keys(searchResults).length === 0 && (
          <Alert severity="info">
            No results found for "{searchQuery}"
          </Alert>
        )}

        {searchQuery.length < 2 && searchQuery.length > 0 && (
          <Alert severity="warning">
            Please enter at least 2 characters to search
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Demo Tab */}
        <ListOfValuesDemo />
      </TabPanel>

      {/* Cache Refresh Dialog */}
      <Dialog open={showCacheDialog} onClose={() => setShowCacheDialog(false)}>
        <DialogTitle>Refresh Cache</DialogTitle>
        <DialogContent>
          <Typography>
            This will clear all cached List of Values data and reload from the server.
            Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCacheDialog(false)}>Cancel</Button>
          <Button onClick={handleRefreshCache} variant="contained">
            Refresh
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ListOfValuesManagement
import {
    Add as AddIcon,
    SmartToy as AIIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service.js';

interface AIProviderConfig {
    id?: number;
    name: string;
    displayName: string;
    description?: string;
    apiEndpoint: string;
    apiKey?: string;
    apiVersion?: string;
    maxTokens?: number;
    supportedModels?: string[];
    supportedContentTypes?: string[];
    isEnabled: boolean;
    isAvailable?: boolean;
    providerType: string;
    priorityOrder?: number;
    requestsPerMinute?: number;
    tokensPerMinute?: number;
    maxConcurrentRequests?: number;
    configuration?: Record<string, any>;
    capabilities?: Record<string, any>;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const AdminSettings: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
    const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const [providerForm, setProviderForm] = useState<AIProviderConfig>({
        name: '',
        displayName: '',
        description: '',
        apiEndpoint: '',
        apiKey: '',
        apiVersion: '',
        maxTokens: 4000,
        isEnabled: true,
        isAvailable: true,
        providerType: 'TEXT_GENERATION',
        priorityOrder: 100,
        requestsPerMinute: 60,
        tokensPerMinute: 100000,
        maxConcurrentRequests: 10
    });

    useEffect(() => {
        loadAIProviders();
    }, []);

    const loadAIProviders = async () => {
        try {
            setLoading(true);
            const providers = await adminService.getAIProviders();
            setAiProviders(providers);
        } catch (error) {
            console.error('Failed to load AI providers:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load AI providers',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleAddProvider = () => {
        setEditingProvider(null);
        setProviderForm({
            name: '',
            displayName: '',
            description: '',
            apiEndpoint: '',
            apiKey: '',
            apiVersion: '',
            maxTokens: 4000,
            isEnabled: true,
            isAvailable: true,
            providerType: 'TEXT_GENERATION',
            priorityOrder: 100,
            requestsPerMinute: 60,
            tokensPerMinute: 100000,
            maxConcurrentRequests: 10
        });
        setDialogOpen(true);
    };

    const handleEditProvider = (provider: AIProviderConfig) => {
        setEditingProvider(provider);
        setProviderForm({ ...provider });
        setDialogOpen(true);
    };

    const handleSaveProvider = async () => {
        try {
            setLoading(true);
            if (editingProvider) {
                await adminService.updateAIProvider(editingProvider.id!, providerForm);
                setSnackbar({
                    open: true,
                    message: 'AI Provider updated successfully',
                    severity: 'success'
                });
            } else {
                await adminService.createAIProvider(providerForm);
                setSnackbar({
                    open: true,
                    message: 'AI Provider created successfully',
                    severity: 'success'
                });
            }
            setDialogOpen(false);
            loadAIProviders();
        } catch (error) {
            console.error('Failed to save AI provider:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save AI provider',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProvider = async (providerId: number) => {
        if (!window.confirm('Are you sure you want to delete this AI provider?')) {
            return;
        }

        try {
            setLoading(true);
            await adminService.deleteAIProvider(providerId);
            setSnackbar({
                open: true,
                message: 'AI Provider deleted successfully',
                severity: 'success'
            });
            loadAIProviders();
        } catch (error) {
            console.error('Failed to delete AI provider:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete AI provider',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleApiKeyVisibility = (providerId: string) => {
        setShowApiKey(prev => ({
            ...prev,
            [providerId]: !prev[providerId]
        }));
    };

    return (
        <>
        <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                        <Tab label="AI Providers" icon={<AIIcon />} />
                    </Tabs>
                </Box>

                {/* AI Providers Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6">
                            AI Provider Configuration
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddProvider}
                        >
                            Add Provider
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        {aiProviders.map((provider) => (
                            <Grid item xs={12} md={6} key={provider.id}>
                                <Card variant="outlined">
                                    <CardHeader
                                        title={provider.displayName}
                                        subheader={provider.name}
                                        action={
                                            <Box>
                                                <IconButton onClick={() => handleEditProvider(provider)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDeleteProvider(provider.id!)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Endpoint:</strong> {provider.apiEndpoint}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Max Tokens:</strong> {provider.maxTokens || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            <strong>Type:</strong> {provider.providerType}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>API Key:</strong>
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {showApiKey[provider.id!]
                                                    ? provider.apiKey
                                                    : '••••••••••••••••'
                                                }
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleApiKeyVisibility(provider.id!.toString())}
                                            >
                                                {showApiKey[provider.id!] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            color={provider.isEnabled ? 'success.main' : 'error.main'}
                                            sx={{ mt: 1 }}
                                        >
                                            Status: {provider.isEnabled ? 'Enabled' : 'Disabled'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {aiProviders.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No AI providers configured. Click "Add Provider" to get started.
                            </Typography>
                        </Box>
                    )}
                </TabPanel>
            </Card>

            {/* Add/Edit Provider Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingProvider ? 'Edit AI Provider' : 'Add AI Provider'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Provider Name"
                            value={providerForm.name}
                            onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                            fullWidth
                            required
                            helperText="Internal name (e.g., openai, gemini, claude)"
                        />
                        <TextField
                            label="Display Name"
                            value={providerForm.displayName}
                            onChange={(e) => setProviderForm({ ...providerForm, displayName: e.target.value })}
                            fullWidth
                            required
                            helperText="User-friendly name"
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Provider Type</InputLabel>
                            <Select
                                value={providerForm.providerType}
                                onChange={(e) => setProviderForm({ ...providerForm, providerType: e.target.value })}
                                label="Provider Type"
                            >
                                <MenuItem value="TEXT_GENERATION">Text Generation</MenuItem>
                                <MenuItem value="IMAGE_GENERATION">Image Generation</MenuItem>
                                <MenuItem value="AUDIO_GENERATION">Audio Generation</MenuItem>
                                <MenuItem value="MULTIMODAL">Multimodal</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="API Endpoint"
                            value={providerForm.apiEndpoint}
                            onChange={(e) => setProviderForm({ ...providerForm, apiEndpoint: e.target.value })}
                            fullWidth
                            required
                            helperText="Base URL for the API"
                        />
                        <TextField
                            label="API Key"
                            type={showApiKey['form'] ? 'text' : 'password'}
                            value={providerForm.apiKey}
                            onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                            fullWidth
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => toggleApiKeyVisibility('form')}
                                            edge="end"
                                        >
                                            {showApiKey['form'] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            helperText="API key for authentication"
                        />
                        <TextField
                            label="Description"
                            value={providerForm.description || ''}
                            onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                            helperText="Description of the AI provider"
                        />
                        <TextField
                            label="API Version"
                            value={providerForm.apiVersion || ''}
                            onChange={(e) => setProviderForm({ ...providerForm, apiVersion: e.target.value })}
                            fullWidth
                            helperText="API version (optional)"
                        />
                        <TextField
                            label="Max Tokens"
                            type="number"
                            value={providerForm.maxTokens || 4000}
                            onChange={(e) => setProviderForm({ ...providerForm, maxTokens: parseInt(e.target.value) })}
                            fullWidth
                            helperText="Maximum tokens per request"
                        />
                        <TextField
                            label="Priority Order"
                            type="number"
                            value={providerForm.priorityOrder || 100}
                            onChange={(e) => setProviderForm({ ...providerForm, priorityOrder: parseInt(e.target.value) })}
                            fullWidth
                            helperText="Priority order (lower number = higher priority)"
                        />
                        <TextField
                            label="Requests Per Minute"
                            type="number"
                            value={providerForm.requestsPerMinute || 60}
                            onChange={(e) => setProviderForm({ ...providerForm, requestsPerMinute: parseInt(e.target.value) })}
                            fullWidth
                            helperText="Rate limit: requests per minute"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={providerForm.isEnabled.toString()}
                                onChange={(e) => setProviderForm({ ...providerForm, isEnabled: e.target.value === 'true' })}
                                label="Status"
                            >
                                <MenuItem value="true">Enabled</MenuItem>
                                <MenuItem value="false">Disabled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSaveProvider}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                    >
                        {editingProvider ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AdminSettings;
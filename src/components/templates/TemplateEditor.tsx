import {
    Add,
    Delete,
    DragIndicator,
    Edit,
    Preview,
    Save
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import { templateService } from '../../services/template.service';
import {
    Template,
    TemplateCategory,
    TemplateLanguage,
    TemplateSection,
    TemplateVariable,
    UpdateTemplateRequest
} from '../../types/template.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-editor-tabpanel-${index}`}
      aria-labelledby={`template-editor-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TemplateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewTemplate = id === 'new';

  // State management
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(!isNewTemplate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [formData, setFormData] = useState<UpdateTemplateRequest>({
    name: '',
    description: '',
    promptTemplate: '',
    category: TemplateCategory.GENERAL,
    language: 'vi',
    tags: [],
    isPublic: false
  });

  // Variables and sections
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [sections, setSections] = useState<TemplateSection[]>([]);

  // Dialogs
  const [variableDialogOpen, setVariableDialogOpen] = useState(false);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  // Current editing variable/section
  const [editingVariable, setEditingVariable] = useState<TemplateVariable | null>(null);
  const [editingSection, setEditingSection] = useState<TemplateSection | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load template data
  useEffect(() => {
    if (!isNewTemplate && id) {
      loadTemplate(parseInt(id));
    }
  }, [id, isNewTemplate]);

  const loadTemplate = async (templateId: number) => {
    try {
      setLoading(true);
      const templateData = await templateService.getTemplateById(templateId);
      setTemplate(templateData);
      setFormData({
        name: templateData.name,
        description: templateData.description,
        promptTemplate: templateData.promptTemplate,
        category: templateData.category,
        language: templateData.language,
        tags: templateData.tags,
        isPublic: templateData.isPublic
      });
    } catch (err) {
      setError('Failed to load template');
      console.error('Error loading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData: UpdateTemplateRequest = {
        ...formData
      };

      let savedTemplate;
      if (isNewTemplate) {
        savedTemplate = await templateService.createTemplate(updateData as any);
        navigate(`/templates/${savedTemplate.id}/edit`);
      } else {
        savedTemplate = await templateService.updateTemplate(parseInt(id!), updateData);
        setTemplate(savedTemplate);
      }

      setHasChanges(false);
      setSnackbar({
        open: true,
        message: 'Template saved successfully',
        severity: 'success'
      });
    } catch (err) {
      setError('Failed to save template');
      setSnackbar({
        open: true,
        message: 'Failed to save template',
        severity: 'error'
      });
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!template) return;
    
    try {
      // Show preview in dialog or new tab
      setPreviewDialogOpen(true);
    } catch (err) {
      setError('Failed to generate preview');
    }
  };

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      id: `var_${Date.now()}`,
      name: '',
      type: 'TEXT',
      label: '',
      required: false,
      order: variables.length
    };
    setEditingVariable(newVariable);
    setVariableDialogOpen(true);
  };

  const handleEditVariable = (variable: TemplateVariable) => {
    setEditingVariable(variable);
    setVariableDialogOpen(true);
  };


  const handleDeleteVariable = (variableId: string) => {
    setVariables(prev => prev.filter(v => v.id !== variableId));
    setHasChanges(true);
  };

  const handleAddSection = () => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      name: '',
      type: 'CONTENT',
      content: '',
      variables: [],
      order: sections.length,
      isRequired: false,
      isRepeatable: false
    };
    setEditingSection(newSection);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: TemplateSection) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };


  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    setHasChanges(true);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'variables') {
      const newVariables = Array.from(variables);
      const [reorderedVariable] = newVariables.splice(source.index, 1);
      newVariables.splice(destination.index, 0, reorderedVariable);
      
      // Update order
      newVariables.forEach((variable, index) => {
        variable.order = index;
      });
      
      setVariables(newVariables);
      setHasChanges(true);
    } else if (type === 'sections') {
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      // Update order
      newSections.forEach((section, index) => {
        section.order = index;
      });
      
      setSections(newSections);
      setHasChanges(true);
    }
  };

  const renderBasicInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  setHasChanges(true);
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  setHasChanges(true);
                }}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, category: e.target.value as TemplateCategory }));
                    setHasChanges(true);
                  }}
                  label="Category"
                >
                  {Object.values(TemplateCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={formData.language}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, language: e.target.value as TemplateLanguage }));
                    setHasChanges(true);
                  }}
                  label="Language"
                >
                  {Object.values(TemplateLanguage).map((language) => (
                    <MenuItem key={language} value={language}>
                      {language}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                  setFormData(prev => ({ ...prev, tags }));
                  setHasChanges(true);
                }}
                placeholder="tag1, tag2, tag3"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.isPublic}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, isPublic: e.target.checked }));
                  setHasChanges(true);
                }}
              />
            }
            label="Make public"
          />
          
          {template && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Template Statistics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uses: {template.usageCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate: {template.successRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated: {new Date(template.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderContentTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Template Content
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={20}
        value={formData.promptTemplate}
        onChange={(e) => {
          setFormData(prev => ({ ...prev, promptTemplate: e.target.value }));
          setHasChanges(true);
        }}
        placeholder="Enter your template prompt here... Use {{variable_name}} for variables"
        sx={{ fontFamily: 'monospace' }}
      />
    </Paper>
  );

  const renderVariablesTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Template Variables
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddVariable}
        >
          Add Variable
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="variables" type="variables">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {variables.map((variable, index) => (
                <Draggable key={variable.id} draggableId={variable.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 2,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton {...provided.dragHandleProps}>
                            <DragIndicator />
                          </IconButton>
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">
                              {variable.label || variable.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type: {variable.type} | Required: {variable.required ? 'Yes' : 'No'}
                            </Typography>
                            {variable.description && (
                              <Typography variant="body2" color="text.secondary">
                                {variable.description}
                              </Typography>
                            )}
                          </Box>
                          
                          <IconButton onClick={() => handleEditVariable(variable)}>
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteVariable(variable.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );

  const renderSectionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Template Sections
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddSection}
        >
          Add Section
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections" type="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 2,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton {...provided.dragHandleProps}>
                            <DragIndicator />
                          </IconButton>
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6">
                              {section.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type: {section.type} | Required: {section.isRequired ? 'Yes' : 'No'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {section.content.substring(0, 100)}...
                            </Typography>
                          </Box>
                          
                          <IconButton onClick={() => handleEditSection(section)}>
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteSection(section.id)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading template...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isNewTemplate ? 'Create Template' : 'Edit Template'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={handlePreview}
            disabled={!template}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Basic Info" />
          <Tab label="Content" />
          <Tab label="Variables" />
          <Tab label="Sections" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderBasicInfoTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderContentTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderVariablesTab()}
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        {renderSectionsTab()}
      </TabPanel>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateEditor;

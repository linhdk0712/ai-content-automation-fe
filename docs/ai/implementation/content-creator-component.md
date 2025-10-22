# Knowledge Documentation: ContentCreator Component

## Overview

The `ContentCreator` component is a comprehensive AI-powered content generation interface that serves as the core feature of the AI Content Automation platform. It provides users with an intuitive, multi-step workflow for creating high-quality content using various AI providers.

**Location**: `src/components/content/ContentCreator.tsx`  
**Type**: React Functional Component with TypeScript  
**Architecture**: Form-based content generation with real-time preview  
**Dependencies**: Material-UI, React Hook Form patterns, Custom hooks

## Core Features

### 1. **Multi-Provider AI Content Generation**
- Support for multiple AI providers (OpenAI, Gemini, Claude)
- Dynamic provider selection with optimization criteria
- Configurable AI parameters (temperature, max tokens)
- Provider-specific model auto-selection

### 2. **Comprehensive Form Interface**
- **Content Prompt**: Multi-line text input with character limits (2000 chars)
- **Industry Selection**: Dynamic industry categories via List of Values system
- **Content Type**: Various content types (articles, social posts, etc.)
- **Language Support**: Multi-language content generation
- **Tone Selection**: Professional, casual, friendly, etc.
- **Target Audience**: Demographic and psychographic targeting

### 3. **Optimization Criteria System**
```typescript
const optimizationOptions = [
  { value: 'QUALITY', label: 'Highest Quality', description: 'Best AI models' },
  { value: 'COST', label: 'Cost Effective', description: 'Optimize for lowest cost' },
  { value: 'SPEED', label: 'Fastest Response', description: 'Prioritize quick generation' },
  { value: 'BALANCED', label: 'Balanced', description: 'Good balance of all factors' }
];
```

### 4. **Advanced Settings Panel**
- **Max Tokens**: Configurable output length (50-4000 tokens)
- **Temperature**: Creativity control (0-2 scale)
- **Collapsible Interface**: Toggle advanced settings visibility
- **Real-time Parameter Updates**: Immediate feedback on changes

### 5. **Template Integration**
- **Template Library**: Pre-built templates for various use cases
- **Template Selection**: One-click template application
- **Template Variables**: Dynamic template customization
- **Template Metadata**: Industry, content type, language matching

### 6. **Tabbed Interface**
- **Create Tab**: Main content generation interface
- **Templates Tab**: Template library and selection  
- **History Tab**: Generation history and regeneration options

#### Tab Navigation
The component features a centered tab navigation bar with Material-UI buttons:
- Clean, consistent styling with contained/outlined variants
- Icon integration for visual clarity (AutoAwesome, Settings, History)
- Responsive design with minimum widths for mobile compatibility
- Internationalized labels using translation keys:
  - `t('contentCreator.create')` for the main creation interface
  - `t('contentCreator.templates')` for template library access
  - `t('contentCreator.history')` for generation history

## State Management

### Core State Variables
```typescript
const [prompt, setPrompt] = useState('');
const [industry, setIndustry] = useState('');
const [contentType, setContentType] = useState('');
const [language, setLanguage] = useState('vi');
const [tone, setTone] = useState('');
const [targetAudience, setTargetAudience] = useState('');
const [maxTokens, setMaxTokens] = useState(500);
const [temperature, setTemperature] = useState(0.7);
const [selectedProvider, setSelectedProvider] = useState('');
const [optimizationCriteria, setOptimizationCriteria] = useState('BALANCED');
const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
const [activeTab, setActiveTab] = useState('create');
```

### UI State Management
```typescript
const [isTriggering, setIsTriggering] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isSendingToBackend, setIsSendingToBackend] = useState(false);
const [lastContentId, setLastContentId] = useState<number | null>(null);
const [toastOpen, setToastOpen] = useState(false);
const [toastMsg, setToastMsg] = useState('');
const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('info');
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

## Custom Hooks Integration

### Content Generation Hook
```typescript
const {
  generateContent,
  isGenerating,
  generationResult,
  error: generationError,
  clearError
} = useContentGeneration();
```

### Template Management Hook
```typescript
const { loadTemplates } = useTemplates();
```

### Internationalization Hook
```typescript
const { t } = useI18n();
```

## Validation System

### Form Validation Rules
- **Required Fields**: Prompt, industry, content type, language, tone, target audience, optimization criteria
- **Prompt Length**: Minimum 10 characters, maximum 2000 characters
- **Real-time Validation**: Errors cleared as user types
- **Validation Error Display**: Field-specific error messages with summary

### Validation Implementation
```typescript
const validateForm = () => {
  const errors: Record<string, string> = {};
  
  if (!prompt.trim()) {
    errors.prompt = t('contentCreator.contentPromptRequired');
  }
  
  if (prompt.trim() && prompt.trim().length < 10) {
    errors.prompt = t('contentCreator.promptTooShort');
  }
  
  if (prompt.trim() && prompt.trim().length > 2000) {
    errors.prompt = t('contentCreator.promptTooLong');
  }
  
  // Additional validation rules...
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

## Content Generation Workflow

### 1. **Form Submission Process**
```typescript
const handleGenerate = async () => {
  // Clear previous validation errors
  setValidationErrors({});
  
  // Validate form
  if (!validateForm()) {
    setToastSeverity('error');
    setToastMsg(t('contentCreator.fillRequiredFields'));
    setToastOpen(true);
    return;
  }
  
  // Prepare generation request
  const request = {
    prompt: prompt.trim(),
    industry,
    contentType,
    language,
    tone,
    targetAudience,
    maxTokens,
    temperature,
    workspaceId,
    preferredProvider: selectedProvider || null,
    optimizationCriteria,
    // Template data if selected
    templateId: selectedTemplate?.id,
    // AI provider configuration
    aiProvider: selectedProvider || undefined,
    aiParameters: {
      temperature: temperature,
      maxTokens: maxTokens
    }
  };
  
  await generateContent(request);
};
```

### 2. **Post-Generation Actions**
- **Send to Workflow**: Trigger N8N workflow with generated content
- **Save to Library**: Persist content to content management system
- **Send to Backend**: Additional backend processing

## UI Architecture

### Layout Structure
```typescript
// Two-panel layout: Form (left) + Preview (right)
<Box className="content-creator-layout" sx={{
  display: 'flex',
  flexDirection: { xs: 'column', lg: 'row' },
  gap: 3,
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '100%',
}}>
  {/* Left Panel - Input Form */}
  <Box className="content-creator-form" sx={{
    flex: { lg: '0 0 500px' },
    width: { xs: '100%', lg: '500px' },
    maxWidth: '100%'
  }}>
    {/* Form Content */}
  </Box>
  
  {/* Right Panel - Preview */}
  <Box className="content-creator-preview" sx={{
    flex: 1,
    width: { xs: '100%', lg: 'auto' },
    maxWidth: '100%',
    minWidth: 0
  }}>
    <ContentPreview />
  </Box>
</Box>
```

### Form Sections
1. **Header Section**: Gradient header with title and description
2. **Template Alert**: Active template notification with clear option
3. **Main Prompt**: Multi-line text input with character counter
4. **Content Settings**: Industry and content type selection
5. **Style & Language**: Language and tone selection
6. **Target Audience**: Audience demographic selection
7. **Optimization**: AI optimization criteria selection
8. **AI Provider**: Provider selection with optimization integration
9. **Advanced Settings**: Collapsible advanced parameter controls
10. **Action Buttons**: Generate button and quick action chips

#### Quick Action Chips
The component includes streamlined navigation chips for quick access to key features:
- **Templates**: Direct access to template library (`t('contentCreator.templates')`)
- **History**: Quick navigation to generation history (`t('contentCreator.history')`)

These chips provide intuitive navigation between the main content creation interface and supporting features, improving user workflow efficiency.

## Component Dependencies

### Internal Components
- `AIProviderSelector`: AI provider selection interface
- `ContentPreview`: Real-time content preview and actions
- `GenerationHistory`: Historical generation management
- `TemplateLibrary`: Template browsing and selection
- `ListOfValuesSelect` components: Industry, ContentType, Language, Tone, TargetAudience selects

### Services Integration
- `contentService`: Content persistence and management
- `n8nService`: Workflow automation integration
- `useContentGeneration`: AI content generation logic
- `useTemplates`: Template management
- `useI18n`: Internationalization support

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **Error Announcements**: Screen reader accessible error messages
- **High Contrast**: Support for high contrast mode

### Accessibility Implementation
```typescript
// Form controls with proper labeling
<TextField
  fullWidth
  multiline
  rows={4}
  label={t('contentCreator.contentPrompt')}
  placeholder={t('contentCreator.contentPromptPlaceholder')}
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  error={!!validationErrors.prompt}
  helperText={validationErrors.prompt || `${prompt.length}/2000 characters`}
  aria-describedby="prompt-helper-text"
  inputProps={{ 
    maxLength: 2000,
    'aria-label': t('contentCreator.contentPrompt')
  }}
/>
```

## Performance Optimizations

### Debounced Template Loading
```typescript
const debouncedFilters = useMemo(() => ({ industry, contentType }), [industry, contentType]);

useEffect(() => {
  if (debouncedFilters.industry || debouncedFilters.contentType) {
    const timeoutId = setTimeout(() => {
      loadTemplates({
        industry: debouncedFilters.industry,
        contentType: debouncedFilters.contentType,
        limit: 10
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }
}, [debouncedFilters.industry, debouncedFilters.contentType]);
```

### Memoized Options
- Optimization options are defined as constants to prevent re-renders
- Form validation is optimized with early returns
- State updates are batched where possible

## Internationalization Support

### Translation Keys Structure
```typescript
// Content Creator specific translations
'contentCreator.contentGeneration'
'contentCreator.createAiPoweredContent'
'contentCreator.contentPrompt'
'contentCreator.contentPromptPlaceholder'
'contentCreator.selectIndustry'
'contentCreator.selectContentType'
'contentCreator.styleAndLanguage'
'contentCreator.targetAudience'
'contentCreator.optimization'
'contentCreator.advancedSettings'
'contentCreator.generateContent'
'contentCreator.generatingContent'

// Tab navigation and quick actions
'contentCreator.create'
'contentCreator.templates'
'contentCreator.history'
```

### Multi-language Form Support
- All form labels and placeholders are internationalized
- Validation error messages support multiple languages
- Help text and descriptions are localized
- Right-to-left (RTL) language support for Arabic

## Error Handling

### Validation Error Management
- Field-level validation with real-time feedback
- Form-level validation summary
- User-friendly error messages
- Graceful error recovery

### Generation Error Handling
```typescript
{generationError && (
  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
    {generationError}
  </Alert>
)}
```

### Toast Notification System
```typescript
const showToast = (severity: 'success' | 'error' | 'info', message: string) => {
  setToastSeverity(severity);
  setToastMsg(message);
  setToastOpen(true);
};
```

## Integration Points

### N8N Workflow Integration
```typescript
const handleSendToWorkflow = async () => {
  if (!generationResult?.content) return;
  
  setIsTriggering(true);
  try {
    const contentData = {
      title: generationResult.title,
      input: generationResult.content,
      metadata: {
        industry,
        contentType,
        language,
        tone,
        targetAudience
      }
    };
    
    const contentId = lastContentId || generateContentId();
    const run = await triggerAiAvatarWorkflow(contentId, contentData);
    
    // Navigate to workflow run page
    setTimeout(() => {
      window.location.href = `/workflows/run/${run.id}`;
    }, 1500);
  } catch (error) {
    showToast('error', t('contentCreator.failedToSendWorkflow'));
  } finally {
    setIsTriggering(false);
  }
};
```

### Content Library Integration
```typescript
const handleSaveToLibrary = async () => {
  if (!generationResult?.content) return;
  
  setIsSaving(true);
  try {
    const saved = await contentService.createContent({
      title: generationResult?.title || 'Untitled',
      textContent: generationResult?.content,
      contentType: ContentType.ARTICLE,
      industry,
      language,
      fromAiGeneration: true,
      aiProvider: generationResult?.provider,
      metadata: generationResult ? { ...generationResult } as Record<string, unknown> : undefined,
    });
    
    setLastContentId(saved?.id ?? 0);
    showToast('success', t('contentCreator.savedToLibrary'));
    
    // Navigate to content library
    setTimeout(() => {
      window.location.href = `/content/library`;
    }, 1500);
  } catch (error) {
    showToast('error', t('contentCreator.failedToSave'));
  } finally {
    setIsSaving(false);
  }
};
```

## Testing Considerations

### Unit Testing Areas
- Form validation logic
- State management functions
- Template selection and application
- Error handling scenarios
- Internationalization coverage

### Integration Testing
- AI provider integration
- Content generation workflow
- Template library integration
- Navigation and routing
- Accessibility compliance

### E2E Testing Scenarios
- Complete content generation flow
- Template selection and usage
- Multi-language interface testing
- Error recovery scenarios
- Mobile responsiveness

## Future Enhancements

### Planned Features
1. **Batch Content Generation**: Generate multiple variations
2. **Content Scheduling**: Direct scheduling from creator
3. **Collaborative Editing**: Real-time collaboration on prompts
4. **Advanced Analytics**: Generation success metrics
5. **Custom Templates**: User-created template system

### Performance Improvements
1. **Virtual Scrolling**: For large template libraries
2. **Progressive Loading**: Lazy load form sections
3. **Caching Strategy**: Cache generation results
4. **Offline Support**: Offline draft saving

### Accessibility Enhancements
1. **Voice Input**: Voice-to-text for prompts
2. **Keyboard Shortcuts**: Power user shortcuts
3. **Screen Reader Optimization**: Enhanced screen reader experience
4. **High Contrast Themes**: Better visual accessibility

## Metadata

- **Component Type**: Functional Component with Hooks
- **State Management**: Local useState with custom hooks
- **Styling**: Material-UI with sx prop styling
- **Accessibility**: WCAG 2.1 AA compliant
- **Internationalization**: Full i18n support with RTL
- **Performance**: Optimized with debouncing and memoization
- **Testing**: Unit and integration test ready
- **Documentation**: Comprehensive inline and external docs

## Related Components

- `ContentPreview`: Real-time content preview and actions
- `AIProviderSelector`: AI provider selection interface
- `TemplateLibrary`: Template browsing and selection
- `GenerationHistory`: Historical generation management
- `ListOfValuesSelect`: Dynamic form field components

## API Integration

- `useContentGeneration`: AI content generation hook
- `useTemplates`: Template management hook
- `contentService`: Content persistence service
- `n8nService`: Workflow automation service
- `useI18n`: Internationalization service
import {
  AutoAwesome,
  Download,
  Edit,
  ExpandMore,
  History,
  Image,
  Refresh,
  Save,
  Star,
  StarBorder
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useImageGenerator } from '../../hooks/useImageGenerator';

interface GeneratedImage {
  id: number;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string;
  style: string;
  aspectRatio: string;
  quality: string;
  seed: number;
  generatedAt: string;
  isStarred: boolean;
  downloadCount: number;
  usageCount: number;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    model: string;
    cost: number;
  };
}


const ImageGenerator: React.FC = () => {
  useAuth();
  const {
    generatedImages,
    stylePresets,
    loading,
    error,
    loadImages,
    saveImage,
    toggleStar,
    loadStylePresets
  } = useImageGenerator();

  // State management
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [quality, setQuality] = useState<string>('standard');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [seed, setSeed] = useState<number | null>(null);
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Style categories

  // Aspect ratio options
  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)', description: 'Perfect for social media posts' },
    { value: '16:9', label: 'Landscape (16:9)', description: 'Great for banners and headers' },
    { value: '9:16', label: 'Portrait (9:16)', description: 'Ideal for stories and mobile' },
    { value: '4:3', label: 'Standard (4:3)', description: 'Classic photo format' },
    { value: '3:2', label: 'Photo (3:2)', description: 'Traditional photography' },
    { value: '21:9', label: 'Ultrawide (21:9)', description: 'Cinematic format' }
  ];

  // Quality options
  const qualityOptions = [
    { value: 'draft', label: 'Draft', description: 'Fast generation, lower quality', cost: 0.01 },
    { value: 'standard', label: 'Standard', description: 'Balanced quality and speed', cost: 0.02 },
    { value: 'high', label: 'High', description: 'Better quality, slower generation', cost: 0.04 },
    { value: 'ultra', label: 'Ultra', description: 'Best quality, longest generation', cost: 0.08 }
  ];

  // Load data on mount
  useEffect(() => {
    loadImages();
    loadStylePresets();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setGenerationProgress(0);

    try {

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Reload images to show new generations
      loadImages();
      
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleSaveImage = async (imageId: number) => {
    try {
      await saveImage(imageId);
      loadImages();
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  };


  const handleToggleStar = async (imageId: number) => {
    try {
      await toggleStar(imageId);
      loadImages();
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleImageClick = (image: GeneratedImage) => {
    setSelectedImage(image);
    setDetailDialogOpen(true);
  };

  const handleUsePrompt = (image: GeneratedImage) => {
    setPrompt(image.prompt);
    setSelectedStyle(image.style);
    setAspectRatio(image.aspectRatio);
    setQuality(image.quality);
    if (image.metadata) {
      setSeed(image.seed);
      setUseRandomSeed(false);
    }
  };

  const getEstimatedCost = () => {
    const qualityOption = qualityOptions.find(q => q.value === quality);
    return (qualityOption?.cost || 0.02) * numberOfImages;
  };

  const renderPromptInput = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Image Generation
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Describe the image you want to generate"
          placeholder="A beautiful sunset over mountains with vibrant colors..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ mb: 2 }}
          helperText={`${prompt.length}/1000 characters`}
          inputProps={{ maxLength: 1000 }}
        />

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Style</InputLabel>
              <Select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                label="Style"
              >
                {stylePresets.map((style: any) => (
                  <MenuItem key={style.id} value={style.id}>
                    {style.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Aspect Ratio</InputLabel>
              <Select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                label="Aspect Ratio"
              >
                {aspectRatios.map((ratio) => (
                  <MenuItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Quality</InputLabel>
              <Select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                label="Quality"
              >
                {qualityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${option.cost.toFixed(3)} per image
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Number of Images"
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
              inputProps={{ min: 1, max: 4 }}
            />
          </Grid>
        </Grid>

        {/* Advanced Settings */}
        <Accordion expanded={showAdvancedSettings} onChange={() => setShowAdvancedSettings(!showAdvancedSettings)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2">Advanced Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useRandomSeed}
                      onChange={(e) => setUseRandomSeed(e.target.checked)}
                    />
                  }
                  label="Use random seed"
                />
              </Grid>
              
              {!useRandomSeed && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Seed"
                    value={seed || ''}
                    onChange={(e) => setSeed(parseInt(e.target.value) || null)}
                    helperText="Use the same seed to reproduce similar results"
                  />
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Generation Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Estimated cost: ${getEstimatedCost().toFixed(3)}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={!prompt.trim() || generating}
            startIcon={generating ? null : <AutoAwesome />}
          >
            {generating ? 'Generating...' : 'Generate Images'}
          </Button>
        </Box>

        {/* Generation Progress */}
        {generating && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={generationProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Generating images... {Math.round(generationProgress)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderStylePresets = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Style Presets
        </Typography>
        
        <Grid container spacing={2}>
          {stylePresets.slice(0, 8).map((style: any) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={style.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: selectedStyle === style.id ? 2 : 1,
                  borderColor: selectedStyle === style.id ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => setSelectedStyle(style.id)}
              >
                <CardMedia
                  component="img"
                  height="80"
                  image={style.thumbnail}
                  alt={style.name}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="caption" fontWeight="bold" noWrap>
                    {style.name}
                  </Typography>
                  {style.isPopular && (
                    <Chip label="Popular" size="small" color="primary" sx={{ ml: 0.5 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderGeneratedImages = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Generated Images ({generatedImages.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setHistoryDialogOpen(true)}
          >
            View All
          </Button>
        </Box>

        {generatedImages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Image sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No images generated yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first AI-generated image using the prompt above
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {generatedImages.slice(0, 8).map((image: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                  onClick={() => handleImageClick(image)}
                >
                  {/* Star Button */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(image.id);
                    }}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
                  >
                    {image.isStarred ? <Star color="warning" /> : <StarBorder />}
                  </IconButton>

                  <CardMedia
                    component="img"
                    height="200"
                    image={image.thumbnailUrl}
                    alt={image.prompt}
                  />

                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap title={image.prompt}>
                      {image.prompt}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Chip label={image.style} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(image.generatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                      <Tooltip title="Use this prompt">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUsePrompt(image);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Download">
                        <IconButton size="small">
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Save to library">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveImage(image.id);
                          }}
                        >
                          <Save fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading image generator...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => loadImages()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            AI Image Generator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create stunning images with AI using text descriptions
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => loadImages()}
        >
          Refresh
        </Button>
      </Box>

      {/* Prompt Input */}
      {renderPromptInput()}

      {/* Style Presets */}
      {renderStylePresets()}

      {/* Generated Images */}
      {renderGeneratedImages()}

      {/* Image Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Generated Image Details
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  style={{ width: '100%', height: 'auto', borderRadius: 8 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Prompt
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selectedImage.prompt}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Settings
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip label={`Style: ${selectedImage.style}`} size="small" />
                  <Chip label={`Ratio: ${selectedImage.aspectRatio}`} size="small" />
                  <Chip label={`Quality: ${selectedImage.quality}`} size="small" />
                  <Chip label={`Seed: ${selectedImage.seed}`} size="small" />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Image Info
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Size: {selectedImage.metadata.width} × {selectedImage.metadata.height}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  File Size: {(selectedImage.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Model: {selectedImage.metadata.model}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Cost: ${selectedImage.metadata.cost.toFixed(4)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Generated: {new Date(selectedImage.generatedAt).toLocaleString()}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => {
                      handleUsePrompt(selectedImage);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Use Prompt
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                  >
                    Download
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => {
                      handleSaveImage(selectedImage.id);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Save to Library
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Generation History
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {generatedImages.map((image: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                <Card 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedImage(image);
                    setHistoryDialogOpen(false);
                    setDetailDialogOpen(true);
                  }}
                >
                  <CardMedia
                    component="img"
                    height="150"
                    image={image.thumbnailUrl}
                    alt={image.prompt}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="caption" noWrap>
                      {image.prompt}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(image.generatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageGenerator;
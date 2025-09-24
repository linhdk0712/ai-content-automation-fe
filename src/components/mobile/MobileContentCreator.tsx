import {
  AutoAwesome as AIIcon,
  Camera as CameraIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  PhotoLibrary as PhotoIcon,
  Send as SendIcon,
  VolumeUp as SpeakIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  LinearProgress,
  Slide,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useContentGeneration } from '../../hooks/useContentGeneration';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface VoiceRecognition {
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

const MobileContentCreator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const theme = useTheme();
  const { generateContent, isGenerating: isGeneratingContent } = useContentGeneration();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  const steps = ['Input', 'Generate', 'Review', 'Publish'];

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setVoiceText(finalTranscript);
          if (finalTranscript) {
            setContent(prev => prev + ' ' + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          setIsRecording(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } else {
      setVoiceText('');
      recognitionRef.current.start();
      setIsRecording(true);
      setIsListening(true);
      
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCameraDialog(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(canvas.toDataURL());
            setShowCameraDialog(false);
            
            // Stop camera stream
            const stream = video.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('Please enter some content or use voice input');
      return;
    }

    setIsGeneratingLocal(true);
    setGenerationProgress(0);
    setActiveStep(1);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await generateContent({
        prompt: content,
        industry: 'GENERAL',
        contentType: 'SOCIAL_POST',
        aiProvider: 'openai',
      });

      setGenerationProgress(100);
      setTimeout(() => {
        setActiveStep(2);
        setIsGeneratingLocal(false);
      }, 500);
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGeneratingLocal(false);
      setActiveStep(0);
    }
  };

  const handlePublish = () => {
    setActiveStep(3);
    setShowSuccessMessage(true);
    
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const renderInputStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Create Your Content
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Tap the mic to use voice input..."
        variant="outlined"
        sx={{ mb: 2 }}
      />

      {voiceText && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Voice input: "{voiceText}"
        </Alert>
      )}

      {/* Voice Input Button */}
      <Box display="flex" justifyContent="center" mb={2}>
        <Fab
          color={isRecording ? "secondary" : "primary"}
          onClick={handleVoiceInput}
          sx={{
            width: 80,
            height: 80,
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.1)' },
              '100%': { transform: 'scale(1)' },
            },
          }}
        >
          {isRecording ? <MicOffIcon /> : <MicIcon />}
        </Fab>
      </Box>

      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
        {isRecording ? 'Listening... Tap to stop' : 'Tap to start voice input'}
      </Typography>

      {/* Image Upload Options */}
      <Box display="flex" gap={1} mb={3}>
        <Button
          variant="outlined"
          startIcon={<PhotoIcon />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          Gallery
        </Button>
        <Button
          variant="outlined"
          startIcon={<CameraIcon />}
          onClick={handleCameraCapture}
          fullWidth
        >
          Camera
        </Button>
      </Box>

      {imagePreview && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" fontWeight="medium">
                Selected Image
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <img
              src={imagePreview}
              alt="Selected"
              style={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleGenerate}
        disabled={!content.trim() || isGeneratingContent}
        startIcon={<AIIcon />}
        sx={{ py: 1.5 }}
      >
        Generate with AI
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        title="Image upload"
        placeholder="Upload image"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
        title="Camera capture"
        placeholder="Capture image"
      />
    </Box>
  );

  const renderGenerateStep = () => (
    <Box textAlign="center">
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Generating Content
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <AIIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="body1" color="text.secondary" mb={2}>
          AI is creating amazing content for you...
        </Typography>
        
        <LinearProgress 
          variant="determinate" 
          value={generationProgress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary" mt={1}>
          {generationProgress}% complete
        </Typography>
      </Box>
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Review Your Content
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Typography variant="body1" fontWeight="medium">
              Generated Content
            </Typography>
            <IconButton size="small" onClick={() => speakText(content)}>
              <SpeakIcon />
            </IconButton>
          </Box>
          
          <Typography variant="body1" paragraph>
            {content}
          </Typography>
          
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Content"
              style={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />
          )}
        </CardContent>
      </Card>

      <Box display="flex" gap={1} mb={2}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setActiveStep(0)}
          fullWidth
        >
          Edit
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handlePublish}
          fullWidth
        >
          Publish
        </Button>
      </Box>
    </Box>
  );

  const renderPublishStep = () => (
    <Box textAlign="center">
      <CheckIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Content Published!
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Your content has been successfully published to your selected platforms.
      </Typography>
      
      <Button
        variant="contained"
        onClick={() => {
          setActiveStep(0);
          setContent('');
          setSelectedImage(null);
          setImagePreview(null);
        }}
        fullWidth
      >
        Create New Content
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Content based on active step */}
      <Card>
        <CardContent>
          {activeStep === 0 && renderInputStep()}
          {activeStep === 1 && renderGenerateStep()}
          {activeStep === 2 && renderReviewStep()}
          {activeStep === 3 && renderPublishStep()}
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog
        fullScreen
        open={showCameraDialog}
        onClose={() => setShowCameraDialog(false)}
        TransitionComponent={Transition}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Take Photo</Typography>
            <IconButton onClick={() => setShowCameraDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
          <Fab
            color="primary"
            onClick={capturePhoto}
            sx={{ width: 80, height: 80 }}
          >
            <CameraIcon />
          </Fab>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccessMessage(false)}>
          Content published successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileContentCreator;
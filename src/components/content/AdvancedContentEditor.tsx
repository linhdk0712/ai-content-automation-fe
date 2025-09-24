import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Tooltip,
  Fab,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatListBulleted,
  FormatListNumbered,
  Link,
  Image,
  VideoLibrary,
  AudioFile,
  Code,
  TableChart as TableIcon,
  Undo,
  Redo,
  Save,
  Fullscreen,
  FullscreenExit,
  EmojiEmotions,
  AttachFile,
} from '@mui/icons-material';
import { Editor } from '@tinymce/tinymce-react';
import { useDropzone } from 'react-dropzone';
import EmojiPicker from 'emoji-picker-react';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  thumbnail?: string;
  name: string;
  size: number;
  alt?: string;
  caption?: string;
}

interface AdvancedContentEditorProps {
  initialContent?: string;
  onContentChange?: (content: string, metadata: any) => void;
  onSave?: (content: string, metadata: any) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  enableCollaboration?: boolean;
  contentId?: string;
}

const EditorContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const CustomToolbar = styled(Toolbar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '48px !important',
  padding: theme.spacing(0, 1),
  gap: theme.spacing(0.5),
}));

const EditorWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  '& .tox-tinymce': {
    border: 'none !important',
  },
  '& .tox-editor-header': {
    display: 'none !important',
  },
}));

const MediaGallery = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  maxHeight: 300,
  overflowY: 'auto',
}));

const DropZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.active': {
    borderColor: theme.palette.success.main,
    backgroundColor: theme.palette.success.light + '20',
  },
}));

const FloatingToolbar = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  zIndex: 1000,
}));

export const AdvancedContentEditor: React.FC<AdvancedContentEditorProps> = ({
  initialContent = '',
  onContentChange,
  onSave,
  readOnly = false,
  showToolbar = true,
  enableCollaboration = false,
  contentId,
}) => {
  const editorRef = useRef<any>(null);
  const [content, setContent] = useState(initialContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
    },
    onDrop: handleFileDrop,
  });

  const handleEditorChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Calculate statistics
    const textContent = newContent.replace(/<[^>]*>/g, '');
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = textContent.length;
    const reading = Math.ceil(words.length / 200); // Average reading speed
    
    setWordCount(words.length);
    setCharacterCount(characters);
    setReadingTime(reading);
    
    onContentChange?.(newContent, {
      wordCount: words.length,
      characterCount: characters,
      readingTime: reading,
      mediaCount: mediaItems.length,
    });
  }, [onContentChange, mediaItems.length]);

  function handleFileDrop(acceptedFiles: File[]) {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const mediaItem: MediaItem = {
          id: Date.now().toString(),
          type: getFileType(file.type),
          url: reader.result as string,
          name: file.name,
          size: file.size,
        };
        
        setMediaItems(prev => [...prev, mediaItem]);
      };
      reader.readAsDataURL(file);
    });
  }

  const getFileType = (mimeType: string): MediaItem['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const insertMedia = (mediaItem: MediaItem) => {
    const editor = editorRef.current;
    if (!editor) return;

    let html = '';
    switch (mediaItem.type) {
      case 'image':
        html = `<img src="${mediaItem.url}" alt="${mediaItem.alt || mediaItem.name}" style="max-width: 100%; height: auto;" />`;
        break;
      case 'video':
        html = `<video controls style="max-width: 100%; height: auto;">
          <source src="${mediaItem.url}" type="video/mp4">
          Your browser does not support the video tag.
        </video>`;
        break;
      case 'audio':
        html = `<audio controls style="width: 100%;">
          <source src="${mediaItem.url}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>`;
        break;
      default:
        html = `<a href="${mediaItem.url}" target="_blank">${mediaItem.name}</a>`;
    }

    editor.insertContent(html);
    setShowMediaDialog(false);
  };

  const insertLink = () => {
    const editor = editorRef.current;
    if (!editor || !linkUrl) return;

    const text = linkText || selectedText || linkUrl;
    const html = `<a href="${linkUrl}" target="_blank">${text}</a>`;
    
    editor.insertContent(html);
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertEmoji = (emojiData: any) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.insertContent(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const formatText = (command: string, value?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.execCommand(command, false, value);
  };

  const insertTable = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
        </tr>
      </table>
    `;
    
    editor.insertContent(tableHtml);
  };

  const insertCodeBlock = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const codeHtml = `<pre><code>// Your code here</code></pre>`;
    editor.insertContent(codeHtml);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSave = () => {
    onSave?.(content, {
      wordCount,
      characterCount,
      readingTime,
      mediaCount: mediaItems.length,
    });
  };

  const toolbarButtons = [
    { icon: <Undo />, action: () => formatText('Undo'), tooltip: 'Undo' },
    { icon: <Redo />, action: () => formatText('Redo'), tooltip: 'Redo' },
    { divider: true },
    { icon: <FormatBold />, action: () => formatText('Bold'), tooltip: 'Bold' },
    { icon: <FormatItalic />, action: () => formatText('Italic'), tooltip: 'Italic' },
    { icon: <FormatUnderlined />, action: () => formatText('Underline'), tooltip: 'Underline' },
    { divider: true },
    { icon: <FormatAlignLeft />, action: () => formatText('JustifyLeft'), tooltip: 'Align Left' },
    { icon: <FormatAlignCenter />, action: () => formatText('JustifyCenter'), tooltip: 'Align Center' },
    { icon: <FormatAlignRight />, action: () => formatText('JustifyRight'), tooltip: 'Align Right' },
    { divider: true },
    { icon: <FormatListBulleted />, action: () => formatText('InsertUnorderedList'), tooltip: 'Bullet List' },
    { icon: <FormatListNumbered />, action: () => formatText('InsertOrderedList'), tooltip: 'Numbered List' },
    { divider: true },
    { icon: <Link />, action: () => setShowLinkDialog(true), tooltip: 'Insert Link' },
    { icon: <Image />, action: () => setShowMediaDialog(true), tooltip: 'Insert Media' },
    { icon: <TableIcon />, action: insertTable, tooltip: 'Insert Table' },
    { icon: <Code />, action: insertCodeBlock, tooltip: 'Insert Code' },
    { icon: <EmojiEmotions />, action: () => setShowEmojiPicker(true), tooltip: 'Insert Emoji' },
  ];

  return (
    <EditorContainer 
      sx={{ 
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        zIndex: isFullscreen ? 9999 : 'auto',
      }}
    >
      {showToolbar && (
        <CustomToolbar>
          {toolbarButtons.map((button, index) => (
            button.divider ? (
              <Divider key={index} orientation="vertical" flexItem />
            ) : (
              <Tooltip key={index} title={button.tooltip}>
                <IconButton
                  size="small"
                  onClick={button.action}
                  disabled={readOnly}
                >
                  {button.icon}
                </IconButton>
              </Tooltip>
            )
          ))}
          
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="textSecondary">
              {wordCount} words • {characterCount} characters • {readingTime} min read
            </Typography>
            
            <Tooltip title="Save">
              <IconButton onClick={handleSave} color="primary">
                <Save />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <IconButton onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          </Box>
        </CustomToolbar>
      )}

      <EditorWrapper>
        <Editor
          onInit={(_evt: unknown, editor: any) => {
            editorRef.current = editor;
          }}
          initialValue={content}
          init={{
            height: '100%',
            menubar: false,
            toolbar: false,
            statusbar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
              'emoticons', 'template', 'paste', 'textcolor', 'colorpicker'
            ],
            content_style: `
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
                font-size: 14px; 
                line-height: 1.6;
                padding: 20px;
              }
              img { max-width: 100%; height: auto; }
              video { max-width: 100%; height: auto; }
              audio { width: 100%; }
              table { border-collapse: collapse; width: 100%; margin: 16px 0; }
              td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              pre { background-color: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
              code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
            `,
            paste_data_images: true,
            automatic_uploads: true,
            file_picker_types: 'image',
            setup: (editor: any) => {
              editor.on('input change', () => {
                handleEditorChange(editor.getContent());
              });
              
              editor.on('selectionchange', () => {
                const selection = editor.selection.getContent({ format: 'text' });
                setSelectedText(selection);
              });
            },
          }}
          disabled={readOnly}
        />

        {isFullscreen && (
          <FloatingToolbar>
            <Fab size="small" onClick={handleSave} color="primary">
              <Save />
            </Fab>
            <Fab size="small" onClick={toggleFullscreen}>
              <FullscreenExit />
            </Fab>
          </FloatingToolbar>
        )}
      </EditorWrapper>

      {/* Media Dialog */}
      <Dialog 
        open={showMediaDialog} 
        onClose={() => setShowMediaDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Insert Media</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <DropZone {...getRootProps()} className={isDragActive ? 'active' : ''}>
              <input {...getInputProps()} />
              <AttachFile sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports images, videos, audio, and documents
              </Typography>
            </DropZone>
          </Box>

          {mediaItems.length > 0 && (
            <MediaGallery>
              {mediaItems.map((item) => (
                <Card key={item.id} sx={{ cursor: 'pointer' }} onClick={() => insertMedia(item)}>
                  <CardMedia
                    component={item.type === 'image' ? 'img' : 'div'}
                    height="80"
                    image={item.type === 'image' ? item.url : undefined}
                    sx={{
                      backgroundColor: item.type !== 'image' ? 'grey.200' : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.type !== 'image' && (
                      <>
                        {item.type === 'video' && <VideoLibrary />}
                        {item.type === 'audio' && <AudioFile />}
                        {item.type === 'document' && <AttachFile />}
                      </>
                    )}
                  </CardMedia>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" noWrap>
                      {item.name}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </MediaGallery>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMediaDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onClose={() => setShowLinkDialog(false)}>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Link Text (optional)"
            fullWidth
            variant="outlined"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder={selectedText || linkUrl}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLinkDialog(false)}>Cancel</Button>
          <Button onClick={insertLink} variant="contained">Insert</Button>
        </DialogActions>
      </Dialog>

      {/* Emoji Picker */}
      <Dialog open={showEmojiPicker} onClose={() => setShowEmojiPicker(false)}>
        <DialogTitle>Insert Emoji</DialogTitle>
        <DialogContent>
          <EmojiPicker onEmojiClick={insertEmoji} />
        </DialogContent>
      </Dialog>
    </EditorContainer>
  );
};

export default AdvancedContentEditor;
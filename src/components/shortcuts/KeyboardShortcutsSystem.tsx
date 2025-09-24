import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Snackbar,
  Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Keyboard,
  Edit,
  Restore,
  Help,
  ExpandMore,
} from '@mui/icons-material';

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  category: string;
  keys: string[];
  action: () => void;
  enabled: boolean;
  customizable: boolean;
  global?: boolean;
}

interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: Omit<KeyboardShortcut, 'id'>) => string;
  unregisterShortcut: (id: string) => void;
  updateShortcut: (id: string, updates: Partial<KeyboardShortcut>) => void;
  executeShortcut: (keys: string[]) => boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

const ShortcutsContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 9999,
}));

const ShortcutDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: 800,
    width: '90vw',
    maxHeight: '80vh',
  },
}));

const KeyChip = styled(Chip)(({ theme }) => ({
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  height: 24,
  margin: theme.spacing(0, 0.25),
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.text.primary,
  '&.recording': {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
    animation: 'pulse 1s infinite',
  },
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.5 },
    '100%': { opacity: 1 },
  },
}));

const ShortcutRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.disabled': {
    opacity: 0.5,
  },
}));

// Default shortcuts configuration
const defaultShortcuts: Omit<KeyboardShortcut, 'id'>[] = [
  // Global shortcuts
  {
    name: 'Show Help',
    description: 'Display keyboard shortcuts help',
    category: 'Global',
    keys: ['?'],
    action: () => {},
    enabled: true,
    customizable: false,
    global: true,
  },
  {
    name: 'Search',
    description: 'Focus search input',
    category: 'Global',
    keys: ['Ctrl', 'K'],
    action: () => {},
    enabled: true,
    customizable: true,
    global: true,
  },
  {
    name: 'Settings',
    description: 'Open settings',
    category: 'Global',
    keys: ['Ctrl', ','],
    action: () => {},
    enabled: true,
    customizable: true,
    global: true,
  },
  
  // Content editing shortcuts
  {
    name: 'Save Content',
    description: 'Save current content',
    category: 'Content',
    keys: ['Ctrl', 'S'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  {
    name: 'New Content',
    description: 'Create new content',
    category: 'Content',
    keys: ['Ctrl', 'N'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  {
    name: 'Copy Content',
    description: 'Copy current content',
    category: 'Content',
    keys: ['Ctrl', 'C'],
    action: () => {},
    enabled: true,
    customizable: false,
  },
  {
    name: 'Undo',
    description: 'Undo last action',
    category: 'Content',
    keys: ['Ctrl', 'Z'],
    action: () => {},
    enabled: true,
    customizable: false,
  },
  {
    name: 'Redo',
    description: 'Redo last undone action',
    category: 'Content',
    keys: ['Ctrl', 'Y'],
    action: () => {},
    enabled: true,
    customizable: false,
  },
  
  // Media shortcuts
  {
    name: 'Upload Media',
    description: 'Open media upload dialog',
    category: 'Media',
    keys: ['Ctrl', 'U'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  {
    name: 'Generate Image',
    description: 'Generate AI image',
    category: 'Media',
    keys: ['Ctrl', 'I'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  
  // Workflow shortcuts
  {
    name: 'Run Workflow',
    description: 'Execute current workflow',
    category: 'Workflow',
    keys: ['Ctrl', 'R'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  {
    name: 'Stop Workflow',
    description: 'Stop running workflow',
    category: 'Workflow',
    keys: ['Ctrl', 'Shift', 'R'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  
  // View shortcuts
  {
    name: 'Toggle Fullscreen',
    description: 'Toggle fullscreen mode',
    category: 'View',
    keys: ['F11'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
  {
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    category: 'View',
    keys: ['Ctrl', 'B'],
    action: () => {},
    enabled: true,
    customizable: true,
  },
];

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Initialize shortcuts
  useEffect(() => {
    const savedShortcuts = localStorage.getItem('keyboardShortcuts');
    if (savedShortcuts) {
      try {
        const parsed = JSON.parse(savedShortcuts);
        setShortcuts(parsed);
      } catch {
        // If parsing fails, use defaults
        const initialShortcuts = defaultShortcuts.map((shortcut, index) => ({
          ...shortcut,
          id: `shortcut-${index}`,
        }));
        setShortcuts(initialShortcuts);
      }
    } else {
      const initialShortcuts = defaultShortcuts.map((shortcut, index) => ({
        ...shortcut,
        id: `shortcut-${index}`,
      }));
      setShortcuts(initialShortcuts);
    }
  }, []);

  // Save shortcuts to localStorage
  useEffect(() => {
    if (shortcuts.length > 0) {
      localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
    }
  }, [shortcuts]);

  // Keyboard event handlers
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const newPressedKeys = new Set(pressedKeys);
      
      // Add modifier keys
      if (event.ctrlKey) newPressedKeys.add('Ctrl');
      if (event.shiftKey) newPressedKeys.add('Shift');
      if (event.altKey) newPressedKeys.add('Alt');
      if (event.metaKey) newPressedKeys.add('Meta');
      
      // Add the actual key
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        newPressedKeys.add(key);
      }
      
      setPressedKeys(newPressedKeys);
      
      // Check for shortcut matches
      const keysArray = Array.from(newPressedKeys);
      const executed = executeShortcut(keysArray);
      
      if (executed) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const newPressedKeys = new Set(pressedKeys);
      
      // Remove modifier keys
      if (!event.ctrlKey) newPressedKeys.delete('Ctrl');
      if (!event.shiftKey) newPressedKeys.delete('Shift');
      if (!event.altKey) newPressedKeys.delete('Alt');
      if (!event.metaKey) newPressedKeys.delete('Meta');
      
      // Remove the actual key
      newPressedKeys.delete(event.key);
      
      setPressedKeys(newPressedKeys);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, pressedKeys]);

  const registerShortcut = useCallback((shortcut: Omit<KeyboardShortcut, 'id'>) => {
    const id = `shortcut-${Date.now()}-${Math.random()}`;
    const newShortcut: KeyboardShortcut = { ...shortcut, id };
    
    setShortcuts(prev => [...prev, newShortcut]);
    return id;
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateShortcut = useCallback((id: string, updates: Partial<KeyboardShortcut>) => {
    setShortcuts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const executeShortcut = useCallback((keys: string[]) => {
    const matchingShortcut = shortcuts.find(shortcut => {
      if (!shortcut.enabled) return false;
      
      const shortcutKeys = shortcut.keys.slice().sort();
      const inputKeys = keys.slice().sort();
      
      return shortcutKeys.length === inputKeys.length &&
             shortcutKeys.every((key, index) => key === inputKeys[index]);
    });

    if (matchingShortcut) {
      try {
        matchingShortcut.action();
        return true;
      } catch (error) {
        console.error('Error executing shortcut:', error);
      }
    }
    
    return false;
  }, [shortcuts]);

  const contextValue: KeyboardShortcutsContextType = {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    executeShortcut,
    isEnabled,
    setEnabled: setIsEnabled,
  };

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardShortcutsProvider');
  }
  return context;
};

export const KeyboardShortcutsManager: React.FC = () => {
  const {
    shortcuts,
    updateShortcut,
    isEnabled,
    setEnabled,
  } = useKeyboardShortcuts();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Group shortcuts by category
  const shortcutCategories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const startRecording = useCallback(() => {
    setRecordingKeys(true);
    setRecordedKeys([]);
    
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const keys: string[] = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.shiftKey) keys.push('Shift');
      if (event.altKey) keys.push('Alt');
      if (event.metaKey) keys.push('Meta');
      
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        keys.push(event.key);
      }
      
      setRecordedKeys(keys);
    };

    const handleKeyUp = () => {
      setRecordingKeys(false);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }, []);

  const saveShortcut = useCallback(() => {
    if (editingShortcut && recordedKeys.length > 0) {
      // Check for conflicts
      const conflictingShortcut = shortcuts.find(s => 
        s.id !== editingShortcut.id &&
        s.keys.length === recordedKeys.length &&
        s.keys.every((key, index) => key === recordedKeys[index])
      );

      if (conflictingShortcut) {
        setNotification(`Shortcut conflicts with "${conflictingShortcut.name}"`);
        return;
      }

      updateShortcut(editingShortcut.id, { keys: recordedKeys });
      setNotification('Shortcut updated successfully');
      setEditingShortcut(null);
      setRecordedKeys([]);
    }
  }, [editingShortcut, recordedKeys, shortcuts, updateShortcut]);

  const resetToDefaults = useCallback(() => {
    defaultShortcuts.forEach((defaultShortcut, index) => {
      const existingShortcut = shortcuts.find(s => s.name === defaultShortcut.name);
      if (existingShortcut) {
        updateShortcut(existingShortcut.id, { keys: defaultShortcut.keys });
      }
    });
    setNotification('Shortcuts reset to defaults');
  }, [shortcuts, updateShortcut]);

  const renderKeyChips = (keys: string[], isRecording = false) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {keys.map((key, index) => (
        <KeyChip
          key={index}
          label={key}
          size="small"
          className={isRecording ? 'recording' : ''}
        />
      ))}
      {keys.length === 0 && isRecording && (
        <KeyChip label="Press keys..." size="small" className="recording" />
      )}
    </Box>
  );

  return (
    <>
      <ShortcutsContainer>
        <Tooltip title="Keyboard Shortcuts">
          <Fab
            color="primary"
            size="small"
            onClick={() => setShowDialog(true)}
          >
            <Badge badgeContent={shortcuts.filter(s => s.enabled).length} color="secondary">
              <Keyboard />
            </Badge>
          </Fab>
        </Tooltip>
      </ShortcutsContainer>

      {/* Main Shortcuts Dialog */}
      <ShortcutDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Keyboard Shortcuts</Typography>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                }
                label="Enable Shortcuts"
              />
              <IconButton onClick={() => setShowHelp(true)}>
                <Help />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {Object.entries(shortcutCategories).map(([category, categoryShortcuts]) => (
            <Accordion key={category} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {category} ({categoryShortcuts.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Shortcut</TableCell>
                        <TableCell>Enabled</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categoryShortcuts.map((shortcut) => (
                        <ShortcutRow
                          key={shortcut.id}
                          className={!shortcut.enabled ? 'disabled' : ''}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {shortcut.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {shortcut.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {renderKeyChips(shortcut.keys)}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={shortcut.enabled}
                              onChange={(e) => updateShortcut(shortcut.id, { enabled: e.target.checked })}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {shortcut.customizable && (
                              <IconButton
                                size="small"
                                onClick={() => setEditingShortcut(shortcut)}
                              >
                                <Edit />
                              </IconButton>
                            )}
                          </TableCell>
                        </ShortcutRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={resetToDefaults} startIcon={<Restore />}>
            Reset to Defaults
          </Button>
          <Button onClick={() => setShowDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </ShortcutDialog>

      {/* Edit Shortcut Dialog */}
      <Dialog
        open={!!editingShortcut}
        onClose={() => setEditingShortcut(null)}
      >
        <DialogTitle>
          Edit Shortcut: {editingShortcut?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Current shortcut:
            </Typography>
            {editingShortcut && renderKeyChips(editingShortcut.keys)}
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
              New shortcut:
            </Typography>
            {renderKeyChips(recordedKeys, recordingKeys)}
            
            <Button
              variant="outlined"
              onClick={startRecording}
              disabled={recordingKeys}
              sx={{ mt: 2 }}
              fullWidth
            >
              {recordingKeys ? 'Recording... Press keys' : 'Record New Shortcut'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingShortcut(null)}>
            Cancel
          </Button>
          <Button
            onClick={saveShortcut}
            variant="contained"
            disabled={recordedKeys.length === 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Keyboard Shortcuts Help</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Keyboard shortcuts help you work faster and more efficiently. Here's how to use them:
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Using Shortcuts
          </Typography>
          <Typography variant="body2" paragraph>
            • Press the key combination shown for each action
            • Shortcuts work globally unless specified otherwise
            • Some shortcuts may be context-sensitive
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Customizing Shortcuts
          </Typography>
          <Typography variant="body2" paragraph>
            • Click the edit icon next to customizable shortcuts
            • Click "Record New Shortcut" and press your desired keys
            • Avoid conflicts with existing shortcuts
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Tips
          </Typography>
          <Typography variant="body2" paragraph>
            • Use Ctrl+? to show this help anytime
            • Disable shortcuts if they conflict with other apps
            • Reset to defaults if you make mistakes
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHelp(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        message={notification}
      />
    </>
  );
};

export default KeyboardShortcutsManager;
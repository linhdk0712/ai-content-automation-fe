/**
 * Voice Command Manager for Hands-free Operation
 * Provides comprehensive voice control functionality
 */

export interface VoiceCommand {
  phrases: string[];
  action: (params?: any) => void | Promise<void>;
  description: string;
  category: string;
  enabled: boolean;
  confidence?: number;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  wakeWord?: string;
  voiceFeedback: boolean;
}

type WebSpeechRecognition = typeof window extends { webkitSpeechRecognition: infer T }
  ? InstanceType<T & (new () => SpeechRecognition)>
  : SpeechRecognition;

export class VoiceCommandManager {
  private static instance: VoiceCommandManager;
  private recognition: WebSpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private commands: Map<string, VoiceCommand> = new Map();
  private settings: VoiceSettings;
  private isListening: boolean = false;
  private isInitialized: boolean = false;
  private listeners: Array<(event: string, data?: any) => void> = [];

  private constructor() {
    this.settings = this.loadSettings();
    this.initializeSpeechAPIs();
    this.setupDefaultCommands();
  }

  public static getInstance(): VoiceCommandManager {
    if (!VoiceCommandManager.instance) {
      VoiceCommandManager.instance = new VoiceCommandManager();
    }
    return VoiceCommandManager.instance;
  }

  /**
   * Initialize Speech Recognition and Synthesis APIs
   */
  private initializeSpeechAPIs(): void {
    // Check for Speech Recognition support
    const SpeechRecognitionCtor =
      (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition })
        .webkitSpeechRecognition;
    
    if (SpeechRecognitionCtor) {
      this.recognition = new SpeechRecognitionCtor() as WebSpeechRecognition;
      this.setupRecognition();
    } else {
      console.warn('Speech Recognition not supported in this browser');
    }

    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    } else {
      console.warn('Speech Synthesis not supported in this browser');
    }

    this.isInitialized = true;
  }

  /**
   * Setup Speech Recognition configuration
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;
    this.recognition.lang = this.settings.language;

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.notifyListeners('listening-started');
      this.speak('Voice commands activated');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.notifyListeners('listening-stopped');
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.notifyListeners('error', { error: event.error });
      
      if (event.error === 'not-allowed') {
        this.speak('Microphone access denied. Please enable microphone permissions.');
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleSpeechResult(event);
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results = Array.from(event.results);
    const lastResult = results[results.length - 1];
    
    if (!lastResult.isFinal) return;

    const transcript = lastResult[0].transcript.toLowerCase().trim();
    const confidence = lastResult[0].confidence;

    console.log('Voice input:', transcript, 'Confidence:', confidence);

    // Check confidence threshold
    if (confidence < this.settings.confidenceThreshold) {
      this.speak('Sorry, I didn\'t understand that clearly. Please try again.');
      return;
    }

    // Process command
    this.processVoiceCommand(transcript, confidence);
  }

  /**
   * Process voice command
   */
  private processVoiceCommand(transcript: string, confidence: number): void {
    let commandFound = false;

    // Check for wake word if configured
    if (this.settings.wakeWord && !transcript.includes(this.settings.wakeWord.toLowerCase())) {
      return;
    }

    // Remove wake word from transcript
    let cleanTranscript = transcript;
    if (this.settings.wakeWord) {
      cleanTranscript = transcript.replace(this.settings.wakeWord.toLowerCase(), '').trim();
    }

    // Find matching command
    for (const [key, command] of this.commands) {
      if (!command.enabled) continue;

      for (const phrase of command.phrases) {
        if (this.matchesPhrase(cleanTranscript, phrase)) {
          commandFound = true;
          this.executeCommand(command, cleanTranscript);
          break;
        }
      }

      if (commandFound) break;
    }

    if (!commandFound) {
      this.speak('Command not recognized. Say "help" to hear available commands.');
      this.notifyListeners('command-not-found', { transcript: cleanTranscript });
    }
  }

  /**
   * Check if transcript matches command phrase
   */
  private matchesPhrase(transcript: string, phrase: string): boolean {
    const transcriptWords = transcript.split(' ');
    const phraseWords = phrase.toLowerCase().split(' ');

    // Exact match
    if (transcript === phrase.toLowerCase()) {
      return true;
    }

    // Partial match (all phrase words must be present)
    return phraseWords.every(word => 
      transcriptWords.some(tWord => 
        tWord.includes(word) || word.includes(tWord)
      )
    );
  }

  /**
   * Execute voice command
   */
  private async executeCommand(command: VoiceCommand, transcript: string): Promise<void> {
    try {
      this.notifyListeners('command-executed', { 
        command: command.description, 
        transcript 
      });

      // Extract parameters from transcript if needed
      const params = this.extractParameters(transcript, command);
      
      await command.action(params);
      
      if (this.settings.voiceFeedback) {
        this.speak(`${command.description} executed`);
      }
    } catch (error) {
      console.error('Error executing voice command:', error);
      this.speak('Sorry, there was an error executing that command.');
    }
  }

  /**
   * Extract parameters from transcript
   */
  private extractParameters(transcript: string, command: VoiceCommand): any {
    // This is a simplified parameter extraction
    // In a real implementation, you'd use more sophisticated NLP
    const words = transcript.split(' ');
    const numbers = words.filter(word => !isNaN(Number(word))).map(Number);
    
    return {
      words,
      numbers,
      transcript
    };
  }

  /**
   * Setup default voice commands
   */
  private setupDefaultCommands(): void {
    // Navigation commands
    this.addCommand('navigate-home', {
      phrases: ['go home', 'navigate home', 'home page'],
      action: () => { window.location.href = '/'; },
      description: 'Navigate to home page',
      category: 'navigation',
      enabled: true
    });

    this.addCommand('navigate-dashboard', {
      phrases: ['go to dashboard', 'open dashboard', 'dashboard'],
      action: () => { window.location.href = '/dashboard'; },
      description: 'Navigate to dashboard',
      category: 'navigation',
      enabled: true
    });

    this.addCommand('navigate-content', {
      phrases: ['create content', 'new content', 'content creator'],
      action: () => { window.location.href = '/content/create'; },
      description: 'Navigate to content creator',
      category: 'navigation',
      enabled: true
    });

    // Content creation commands
    this.addCommand('generate-content', {
      phrases: ['generate content', 'create new content', 'ai generate'],
      action: () => {
        const button = document.querySelector('[data-action="generate-content"]') as HTMLButtonElement;
        if (button) button.click();
      },
      description: 'Generate new content with AI',
      category: 'content',
      enabled: true
    });

    this.addCommand('save-content', {
      phrases: ['save content', 'save draft', 'save this'],
      action: () => {
        const button = document.querySelector('[data-action="save-content"]') as HTMLButtonElement;
        if (button) button.click();
      },
      description: 'Save current content',
      category: 'content',
      enabled: true
    });

    this.addCommand('publish-content', {
      phrases: ['publish content', 'publish now', 'post content'],
      action: () => {
        const button = document.querySelector('[data-action="publish-content"]') as HTMLButtonElement;
        if (button) button.click();
      },
      description: 'Publish content',
      category: 'content',
      enabled: true
    });

    // UI control commands
    this.addCommand('open-menu', {
      phrases: ['open menu', 'show menu', 'menu'],
      action: () => {
        const button = document.querySelector('[data-action="toggle-menu"]') as HTMLButtonElement;
        if (button) button.click();
      },
      description: 'Open navigation menu',
      category: 'ui',
      enabled: true
    });

    this.addCommand('close-modal', {
      phrases: ['close modal', 'close dialog', 'close popup', 'cancel'],
      action: () => {
        const button = document.querySelector('[data-dismiss="modal"]') as HTMLButtonElement;
        if (button) button.click();
      },
      description: 'Close modal or dialog',
      category: 'ui',
      enabled: true
    });

    // Accessibility commands
    this.addCommand('increase-font', {
      phrases: ['increase font size', 'bigger text', 'larger font'],
      action: () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${Math.min(currentSize + 2, 24)}px`;
      },
      description: 'Increase font size',
      category: 'accessibility',
      enabled: true
    });

    this.addCommand('decrease-font', {
      phrases: ['decrease font size', 'smaller text', 'smaller font'],
      action: () => {
        const root = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(root).fontSize);
        root.style.fontSize = `${Math.max(currentSize - 2, 12)}px`;
      },
      description: 'Decrease font size',
      category: 'accessibility',
      enabled: true
    });

    this.addCommand('toggle-high-contrast', {
      phrases: ['toggle high contrast', 'high contrast mode', 'contrast mode'],
      action: () => {
        document.documentElement.classList.toggle('high-contrast');
      },
      description: 'Toggle high contrast mode',
      category: 'accessibility',
      enabled: true
    });

    // Help commands
    this.addCommand('help', {
      phrases: ['help', 'what can you do', 'available commands', 'voice commands'],
      action: () => this.speakAvailableCommands(),
      description: 'List available voice commands',
      category: 'help',
      enabled: true
    });

    this.addCommand('stop-listening', {
      phrases: ['stop listening', 'turn off voice', 'disable voice'],
      action: () => this.stopListening(),
      description: 'Stop voice recognition',
      category: 'control',
      enabled: true
    });
  }

  /**
   * Add new voice command
   */
  public addCommand(key: string, command: VoiceCommand): void {
    this.commands.set(key, command);
  }

  /**
   * Remove voice command
   */
  public removeCommand(key: string): void {
    this.commands.delete(key);
  }

  /**
   * Enable/disable command
   */
  public toggleCommand(key: string, enabled?: boolean): void {
    const command = this.commands.get(key);
    if (command) {
      command.enabled = enabled !== undefined ? enabled : !command.enabled;
    }
  }

  /**
   * Start listening for voice commands
   */
  public async startListening(): Promise<void> {
    if (!this.isInitialized || !this.recognition) {
      throw new Error('Voice recognition not available');
    }

    if (this.isListening) {
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Stop listening for voice commands
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Speak text using speech synthesis
   */
  public speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }): void {
    if (!this.synthesis || !this.settings.voiceFeedback) return;

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    if (options) {
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.voice = options.voice || null;
    }

    // Set language
    utterance.lang = this.settings.language;

    this.synthesis.speak(utterance);
  }

  /**
   * Speak available commands
   */
  private speakAvailableCommands(): void {
    const categories = new Map<string, VoiceCommand[]>();
    
    // Group commands by category
    for (const command of this.commands.values()) {
      if (!command.enabled) continue;
      
      if (!categories.has(command.category)) {
        categories.set(command.category, []);
      }
      categories.get(command.category)!.push(command);
    }

    let helpText = 'Available voice commands: ';
    
    for (const [category, commands] of categories) {
      helpText += `${category}: `;
      helpText += commands.map(cmd => cmd.phrases[0]).join(', ');
      helpText += '. ';
    }

    this.speak(helpText);
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return Array.from(this.synthesis.getVoices());
  }

  /**
   * Update voice settings
   */
  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    // Update recognition settings
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
      this.recognition.lang = this.settings.language;
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Check if voice recognition is supported
   */
  public isSupported(): boolean {
    return this.isInitialized && this.recognition !== null;
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: (event: string, data?: any) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of events
   */
  private notifyListeners(event: string, data?: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in voice command listener:', error);
      }
    });
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): VoiceSettings {
    try {
      const saved = localStorage.getItem('voice-settings');
      return saved ? { ...this.getDefaultSettings(), ...JSON.parse(saved) } : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem('voice-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save voice settings:', error);
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): VoiceSettings {
    return {
      enabled: false,
      language: 'en-US',
      continuous: true,
      interimResults: false,
      maxAlternatives: 1,
      confidenceThreshold: 0.7,
      wakeWord: 'hey assistant',
      voiceFeedback: true
    };
  }

  /**
   * Get all commands
   */
  public getCommands(): Map<string, VoiceCommand> {
    return new Map(this.commands);
  }

  /**
   * Test voice recognition
   */
  public async testVoiceRecognition(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const voiceCommandManager = VoiceCommandManager.getInstance();
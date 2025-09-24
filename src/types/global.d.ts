declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  // Minimal Web Speech API typings for recognition events
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend?: (this: SpeechRecognition, ev: Event) => any;
    onaudiostart?: (this: SpeechRecognition, ev: Event) => any;
    onend?: (this: SpeechRecognition, ev: Event) => any;
    onerror?: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
    onnomatch?: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
    onresult?: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
    onsoundend?: (this: SpeechRecognition, ev: Event) => any;
    onsoundstart?: (this: SpeechRecognition, ev: Event) => any;
    onspeechend?: (this: SpeechRecognition, ev: Event) => any;
    onspeechstart?: (this: SpeechRecognition, ev: Event) => any;
    onstart?: (this: SpeechRecognition, ev: Event) => any;
    abort(): void;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error:
      | 'no-speech'
      | 'aborted'
      | 'audio-capture'
      | 'network'
      | 'not-allowed'
      | 'service-not-allowed'
      | 'bad-grammar'
      | 'language-not-supported';
    readonly message?: string;
  }
}

export {};


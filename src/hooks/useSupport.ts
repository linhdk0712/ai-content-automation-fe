import { useCallback, useMemo, useState } from 'react';

export interface FaqItem {
  question: string;
  answer: string;
  links?: { label: string; url: string }[];
}

export interface ChatMessage {
  sender: 'user' | 'support';
  text: string;
  timestamp: number;
}

export interface SupportTicketInput {
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

interface UseSupportReturn {
  faqItems: FaqItem[];
  searchFAQ: (query: string) => FaqItem[];
  submitTicket: (ticket: SupportTicketInput) => Promise<void>;
  isSubmitting: boolean;
  unreadMessages: number;
  chatHistory: ChatMessage[];
}

// Minimal client-side implementation to satisfy HelpDesk usage.
export const useSupport = (): UseSupportReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadMessages] = useState(0);
  const [chatHistory] = useState<ChatMessage[]>([]);

  const faqItems: FaqItem[] = useMemo(
    () => [
      {
        question: 'How do I create my first post?',
        answer: 'Go to Content > Create New and follow the guided steps.',
        links: [{ label: 'Getting Started', url: '/docs/getting-started' }]
      },
      {
        question: 'How can I schedule content?',
        answer: 'Use the Schedule Manager to pick optimal times and set recurrence.'
      },
      {
        question: 'Who do I contact for billing issues?',
        answer: 'Open a support ticket via the Contact Support tab or email billing.'
      }
    ],
    []
  );

  const searchFAQ = useCallback(
    (query: string) => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) return faqItems;
      return faqItems.filter(
        (item) =>
          item.question.toLowerCase().includes(normalized) ||
          item.answer.toLowerCase().includes(normalized)
      );
    },
    [faqItems]
  );

  const submitTicket = useCallback(async (ticket: SupportTicketInput) => {
    setIsSubmitting(true);
    try {
      // Placeholder: integrate with backend service if available
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.info('Support ticket submitted', ticket);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    faqItems,
    searchFAQ,
    submitTicket,
    isSubmitting,
    unreadMessages,
    chatHistory
  };
};



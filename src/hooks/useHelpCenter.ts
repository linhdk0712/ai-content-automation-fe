import { useState, useEffect } from 'react';
import { helpCenterService } from '../services/helpCenter.service';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  lastUpdated: string;
  author: {
    name: string;
    avatar: string;
  };
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  views: number;
  rating: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

interface UseHelpCenterReturn {
  articles: HelpArticle[] | null;
  videos: VideoTutorial[] | null;
  faqs: FAQ[] | null;
  searchResults: (HelpArticle | VideoTutorial | FAQ)[] | null;
  loading: boolean;
  error: string | null;
  searchArticles: (query: string) => Promise<void>;
  rateArticle: (articleId: string, helpful: boolean) => Promise<void>;
  submitFeedback: (message: string) => Promise<void>;
}

export const useHelpCenter = (): UseHelpCenterReturn => {
  const [articles, setArticles] = useState<HelpArticle[] | null>(null);
  const [videos, setVideos] = useState<VideoTutorial[] | null>(null);
  const [faqs, setFaqs] = useState<FAQ[] | null>(null);
  const [searchResults, setSearchResults] = useState<(HelpArticle | VideoTutorial | FAQ)[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const [articlesData, videosData, faqsData] = await Promise.all([
        helpCenterService.getArticles(),
        helpCenterService.getVideos(),
        helpCenterService.getFAQs()
      ]);
      setArticles(articlesData);
      setVideos(videosData);
      setFaqs(faqsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch help content');
    } finally {
      setLoading(false);
    }
  };

  const searchArticles = async (query: string) => {
    try {
      setLoading(true);
      const results = await helpCenterService.search(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search articles');
    } finally {
      setLoading(false);
    }
  };

  const rateArticle = async (articleId: string, helpful: boolean) => {
    try {
      await helpCenterService.rateArticle(articleId, helpful);
      // Update local state
      setArticles(prev => 
        prev?.map(article => 
          article.id === articleId
            ? {
                ...article,
                helpful: helpful ? article.helpful + 1 : article.helpful,
                notHelpful: !helpful ? article.notHelpful + 1 : article.notHelpful
              }
            : article
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rate article');
      throw err;
    }
  };

  const submitFeedback = async (message: string) => {
    try {
      await helpCenterService.submitFeedback(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      throw err;
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  return {
    articles,
    videos,
    faqs,
    searchResults,
    loading,
    error,
    searchArticles,
    rateArticle,
    submitFeedback
  };
};
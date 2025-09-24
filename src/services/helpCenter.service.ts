import { api } from './api';

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

class HelpCenterService {
  async getArticles(): Promise<HelpArticle[]> {
    const response = await api.get('/help/articles');
    return response.data;
  }

  async getArticleById(id: string): Promise<HelpArticle> {
    const response = await api.get(`/help/articles/${id}`);
    return response.data;
  }

  async getVideos(): Promise<VideoTutorial[]> {
    const response = await api.get('/help/videos');
    return response.data;
  }

  async getFAQs(): Promise<FAQ[]> {
    const response = await api.get('/help/faqs');
    return response.data;
  }

  async search(query: string): Promise<(HelpArticle | VideoTutorial | FAQ)[]> {
    const response = await api.get(`/help/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async rateArticle(articleId: string, helpful: boolean): Promise<void> {
    await api.post(`/help/articles/${articleId}/rate`, { helpful });
  }

  async submitFeedback(message: string): Promise<void> {
    await api.post('/help/feedback', { message });
  }

  async getPopularArticles(): Promise<HelpArticle[]> {
    const response = await api.get('/help/articles/popular');
    return response.data;
  }

  async getRecentArticles(): Promise<HelpArticle[]> {
    const response = await api.get('/help/articles/recent');
    return response.data;
  }

  async getArticlesByCategory(category: string): Promise<HelpArticle[]> {
    const response = await api.get(`/help/articles?category=${encodeURIComponent(category)}`);
    return response.data;
  }
}

export const helpCenterService = new HelpCenterService();
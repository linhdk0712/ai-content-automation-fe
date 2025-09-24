import { useEffect, useState } from 'react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  platform: string;
  status: 'scheduled' | 'published' | 'failed';
  content?: string;
}

export const useSocialCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load calendar events
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Sample Post',
          start: new Date(),
          end: new Date(Date.now() + 60 * 60 * 1000),
          platform: 'facebook',
          status: 'scheduled'
        }
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent = {
      ...event,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: loadEvents
  };
};
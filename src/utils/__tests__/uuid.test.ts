import { generateUUID, generateShortUUID, generateContentId } from '../uuid';

describe('UUID Utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateShortUUID', () => {
    it('should generate an 8-character string', () => {
      const shortUuid = generateShortUUID();
      
      expect(shortUuid).toHaveLength(8);
      expect(shortUuid).toMatch(/^[0-9a-f]{8}$/i);
    });

    it('should generate unique short UUIDs', () => {
      const uuid1 = generateShortUUID();
      const uuid2 = generateShortUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateContentId', () => {
    it('should generate a numeric content ID', () => {
      const contentId = generateContentId();
      
      expect(typeof contentId).toBe('number');
      expect(contentId).toBeGreaterThan(0);
    });

    it('should generate unique content IDs', () => {
      const id1 = generateContentId();
      const id2 = generateContentId();
      
      expect(id1).not.toBe(id2);
    });

    it('should generate content IDs based on timestamp', () => {
      const beforeTime = Date.now();
      const contentId = generateContentId();
      const afterTime = Date.now();
      
      // Content ID should start with timestamp
      const contentIdStr = contentId.toString();
      const timestampPart = parseInt(contentIdStr.substring(0, 13));
      
      expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampPart).toBeLessThanOrEqual(afterTime);
    });
  });
});
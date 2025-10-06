import { generateUUID, generateShortUUID, generateContentId } from './uuid';

/**
 * Demo function to test UUID generation
 * Run this in browser console to verify UUID generation works
 */
export function testUUIDGeneration() {
  console.log('=== UUID Generation Test ===');
  
  // Test generateUUID
  console.log('\n1. Full UUID v4:');
  for (let i = 0; i < 3; i++) {
    const uuid = generateUUID();
    console.log(`  ${i + 1}. ${uuid}`);
  }
  
  // Test generateShortUUID
  console.log('\n2. Short UUID (8 chars):');
  for (let i = 0; i < 3; i++) {
    const shortUuid = generateShortUUID();
    console.log(`  ${i + 1}. ${shortUuid}`);
  }
  
  // Test generateContentId
  console.log('\n3. Content ID (numeric):');
  for (let i = 0; i < 3; i++) {
    const contentId = generateContentId();
    console.log(`  ${i + 1}. ${contentId} (length: ${contentId.toString().length})`);
  }
  
  // Test uniqueness
  console.log('\n4. Uniqueness Test:');
  const uuids = new Set();
  const shortUuids = new Set();
  const contentIds = new Set();
  
  for (let i = 0; i < 100; i++) {
    uuids.add(generateUUID());
    shortUuids.add(generateShortUUID());
    contentIds.add(generateContentId());
  }
  
  console.log(`  - Generated 100 UUIDs, unique: ${uuids.size}/100`);
  console.log(`  - Generated 100 Short UUIDs, unique: ${shortUuids.size}/100`);
  console.log(`  - Generated 100 Content IDs, unique: ${contentIds.size}/100`);
  
  console.log('\n=== Test Complete ===');
}

// Auto-run if in development mode
if (process.env.NODE_ENV === 'development') {
  // Make it available globally for console testing
  (window as any).testUUIDGeneration = testUUIDGeneration;
  console.log('UUID test function available: testUUIDGeneration()');
}
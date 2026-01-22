/**
 * Jest setup file
 * Provides polyfills for APIs not available in jsdom
 */

// Polyfill structuredClone for fake-indexeddb compatibility
// structuredClone is available in Node.js 17+ but jsdom doesn't expose it
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

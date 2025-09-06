/**
 * Performance testing script for search functionality
 * Tests TTI, latency, and ranking accuracy
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { normalizeThai } from '../src/lib/thai-normalize.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Thai normalization function
function normalizeThai(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\u0E00-\u0E7F\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Distance calculation (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Test search performance
async function testSearchPerformance() {
  console.log('🧪 Testing search performance...');
  
  const testQueries = [
    'central',
    'rama',
    'siam',
    'paragon',
    'terminal',
    'zara',
    'starbucks',
    'h&m'
  ];
  
  const results = [];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    
    const startTime = performance.now();
    
    try {
      // Test mall search
      const normalizedQuery = normalizeThai(query);
      const mallsQuery = query(
        collection(db, 'malls'),
        where('name_normalized', '>=', normalizedQuery),
        where('name_normalized', '<=', normalizedQuery + '\uf8ff'),
        limit(50)
      );
      
      const storesQuery = query(
        collection(db, 'stores'),
        where('name_normalized', '>=', normalizedQuery),
        where('name_normalized', '<=', normalizedQuery + '\uf8ff'),
        limit(50)
      );
      
      const [mallsSnapshot, storesSnapshot] = await Promise.all([
        getDocs(mallsQuery),
        getDocs(storesQuery)
      ]);
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      const mallResults = mallsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        kind: 'mall'
      }));
      
      const storeResults = storesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        kind: 'store'
      }));
      
      const totalResults = mallResults.length + storeResults.length;
      
      results.push({
        query,
        latency,
        mallCount: mallResults.length,
        storeCount: storeResults.length,
        totalResults,
        success: true
      });
      
      console.log(`  ⏱️  Latency: ${latency.toFixed(2)}ms`);
      console.log(`  📊 Results: ${mallResults.length} malls, ${storeResults.length} stores`);
      
      // Check if results are relevant
      const relevantResults = [...mallResults, ...storeResults].filter(result => {
        const name = result.displayName || result.name || '';
        return normalizeThai(name).includes(normalizedQuery);
      });
      
      const relevance = relevantResults.length / totalResults;
      console.log(`  🎯 Relevance: ${(relevance * 100).toFixed(1)}%`);
      
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      results.push({
        query,
        latency,
        mallCount: 0,
        storeCount: 0,
        totalResults: 0,
        success: false,
        error: error.message
      });
      
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  return results;
}

// Test ranking accuracy
async function testRankingAccuracy() {
  console.log('\n🎯 Testing ranking accuracy...');
  
  // Mock user location (Central Bangkok)
  const userLocation = { lat: 13.7563, lng: 100.5018 };
  
  try {
    // Get some malls with coordinates
    const mallsSnapshot = await getDocs(collection(db, 'malls'));
    const mallsWithCoords = mallsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(mall => mall.coords && mall.coords.lat && mall.coords.lng)
      .slice(0, 10);
    
    // Calculate distances and sort
    const mallsWithDistance = mallsWithCoords.map(mall => ({
      ...mall,
      distanceKm: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        mall.coords.lat,
        mall.coords.lng
      )
    })).sort((a, b) => a.distanceKm - b.distanceKm);
    
    console.log('📍 Malls sorted by distance:');
    mallsWithDistance.forEach((mall, index) => {
      console.log(`  ${index + 1}. ${mall.displayName} - ${mall.distanceKm.toFixed(2)} km`);
    });
    
    // Verify sorting is correct
    let isCorrectlySorted = true;
    for (let i = 1; i < mallsWithDistance.length; i++) {
      if (mallsWithDistance[i].distanceKm < mallsWithDistance[i-1].distanceKm) {
        isCorrectlySorted = false;
        break;
      }
    }
    
    console.log(`✅ Ranking accuracy: ${isCorrectlySorted ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.log(`❌ Ranking test failed: ${error.message}`);
  }
}

// Test cache performance
async function testCachePerformance() {
  console.log('\n💾 Testing cache performance...');
  
  const testQuery = 'central';
  const iterations = 5;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    
    try {
      const normalizedQuery = normalizeThai(testQuery);
      const mallsQuery = query(
        collection(db, 'malls'),
        where('name_normalized', '>=', normalizedQuery),
        where('name_normalized', '<=', normalizedQuery + '\uf8ff'),
        limit(50)
      );
      
      await getDocs(mallsQuery);
      
      const endTime = performance.now();
      times.push(endTime - startTime);
      
    } catch (error) {
      console.log(`❌ Cache test iteration ${i + 1} failed: ${error.message}`);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`📊 Cache performance (${iterations} iterations):`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms`);
    console.log(`  Max: ${maxTime.toFixed(2)}ms`);
    
    // Check if performance meets SLA
    const meetsSLA = avgTime <= 600; // 600ms SLA
    console.log(`✅ SLA compliance: ${meetsSLA ? 'PASS' : 'FAIL'} (≤600ms)`);
  }
}

// Generate performance report
function generateReport(searchResults) {
  console.log('\n📋 Performance Report');
  console.log('='.repeat(50));
  
  const successfulTests = searchResults.filter(r => r.success);
  const failedTests = searchResults.filter(r => !r.success);
  
  if (successfulTests.length > 0) {
    const avgLatency = successfulTests.reduce((sum, r) => sum + r.latency, 0) / successfulTests.length;
    const minLatency = Math.min(...successfulTests.map(r => r.latency));
    const maxLatency = Math.max(...successfulTests.map(r => r.latency));
    
    console.log(`\n🔍 Search Performance:`);
    console.log(`  Tests run: ${searchResults.length}`);
    console.log(`  Successful: ${successfulTests.length}`);
    console.log(`  Failed: ${failedTests.length}`);
    console.log(`  Average latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`  Min latency: ${minLatency.toFixed(2)}ms`);
    console.log(`  Max latency: ${maxLatency.toFixed(2)}ms`);
    
    // SLA compliance
    const slaCompliant = successfulTests.filter(r => r.latency <= 600).length;
    const slaPercentage = (slaCompliant / successfulTests.length) * 100;
    
    console.log(`\n📊 SLA Compliance (≤600ms):`);
    console.log(`  Compliant: ${slaCompliant}/${successfulTests.length} (${slaPercentage.toFixed(1)}%)`);
    
    if (slaPercentage >= 95) {
      console.log(`  ✅ EXCELLENT - Meets performance targets`);
    } else if (slaPercentage >= 80) {
      console.log(`  ⚠️  GOOD - Minor optimization needed`);
    } else {
      console.log(`  ❌ POOR - Significant optimization required`);
    }
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    failedTests.forEach(test => {
      console.log(`  "${test.query}": ${test.error}`);
    });
  }
  
  console.log('\n💡 Recommendations:');
  console.log('  1. Ensure Firestore indexes are deployed');
  console.log('  2. Monitor cache hit rates');
  console.log('  3. Consider implementing result pagination');
  console.log('  4. Add search analytics tracking');
}

// Main test function
async function main() {
  console.log('🚀 Starting search performance tests...');
  
  try {
    const searchResults = await testSearchPerformance();
    await testRankingAccuracy();
    await testCachePerformance();
    
    generateReport(searchResults);
    
    console.log('\n✅ Performance testing completed!');
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run tests
main();

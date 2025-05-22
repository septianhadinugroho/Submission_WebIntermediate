import fs from 'fs';
import path from 'path';

// Simple script to copy service worker to dist folder
const swSrc = 'public/sw.js';
const swDest = 'dist/sw.js';

async function copyServiceWorker() {
  try {
    console.log('Copying Service Worker...');
    
    // Check if source file exists
    if (!fs.existsSync(swSrc)) {
      console.error(`❌ Source SW file not found: ${swSrc}`);
      process.exit(1);
    }
    
    // Ensure dist directory exists
    const distDir = path.dirname(swDest);
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy the service worker file
    fs.copyFileSync(swSrc, swDest);
    
    // Verify the copy was successful
    if (fs.existsSync(swDest)) {
      const stats = fs.statSync(swDest);
      console.log(`✓ Service worker copied successfully!`);
      console.log(`  - Source: ${swSrc}`);
      console.log(`  - Destination: ${swDest}`);
      console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      throw new Error('Failed to copy service worker file');
    }

  } catch (error) {
    console.error('❌ Failed to copy service worker:', error.message);
    process.exit(1);
  }
}

// Run the copy operation
copyServiceWorker();
/**
 * Setup ML Model Script
 * Copies the ML model file to the correct location
 * Run: node setup-ml-model.js
 */

const fs = require('fs');
const path = require('path');

const modelSourcePath = path.join(__dirname, '../../FINAL_shortage_prediction (1).pkl');
const modelDestPath = path.join(__dirname, 'ml/shortage_prediction_model.pkl');

console.log('🔧 Setting up ML model...');
console.log(`Source: ${modelSourcePath}`);
console.log(`Destination: ${modelDestPath}`);

// Check if source exists
if (!fs.existsSync(modelSourcePath)) {
  console.log('❌ Model file not found at source path.');
  console.log('Please ensure the file "FINAL_shortage_prediction (1).pkl" is in the Downloads folder.');
  console.log('Or manually copy it to: backend/ml/shortage_prediction_model.pkl');
  process.exit(1);
}

// Ensure ml directory exists
const mlDir = path.join(__dirname, 'ml');
if (!fs.existsSync(mlDir)) {
  fs.mkdirSync(mlDir, { recursive: true });
}

// Copy the file
try {
  fs.copyFileSync(modelSourcePath, modelDestPath);
  console.log('✅ ML model file copied successfully!');
  console.log(`   Location: ${modelDestPath}`);
} catch (error) {
  console.error('❌ Error copying model file:', error.message);
  console.log('\n📋 Manual Setup Instructions:');
  console.log('1. Copy "FINAL_shortage_prediction (1).pkl" from your Downloads folder');
  console.log(`2. Paste it into: ${mlDir}`);
  console.log('3. Rename it to: shortage_prediction_model.pkl');
  process.exit(1);
}

console.log('\n✅ ML model setup complete!');
console.log('The prediction system will now use your trained model.');


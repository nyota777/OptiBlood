const { spawn } = require('child_process');
const path = require('path');

/**
 * Run Python ML model for blood shortage prediction
 * @param {Object} data - Input data containing inventory and donor information
 * @returns {Promise<Object>} - Prediction results
 */
const runPythonModel = (data) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../ml/predict_shortage.py');
    const dataString = JSON.stringify(data);

    console.log('📊 Sending data to Python model...');

    // Spawn Python process
    const python = spawn('python', [scriptPath, dataString]);

    let outputData = '';
    let errorData = '';

    // Collect stdout data
    python.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    // Collect stderr data
    python.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python stderr:', data.toString());
    });

    // Handle process completion
    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Python process exited with code ${code}`);
        console.error('Error output:', errorData);
        return reject(new Error(`Python script failed with code ${code}: ${errorData}`));
      }

      try {
        const result = JSON.parse(outputData);
        console.log('✅ Python model executed successfully');
        resolve(result);
      } catch (error) {
        console.error('❌ Failed to parse Python output:', outputData);
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });

    // Handle process errors
    python.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

module.exports = { runPythonModel };


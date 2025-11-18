# ML Model Integration Guide

## Setup Instructions

### Step 1: Copy Your ML Model File

Copy your trained model file to the backend:

```bash
# From the project root directory
copy "C:\Users\Arthur\Downloads\FINAL_shortage_prediction (1).pkl" backend\ml\shortage_prediction_model.pkl
```

Or manually:
1. Navigate to `backend/ml/` folder
2. Copy `FINAL_shortage_prediction (1).pkl` from your Downloads folder
3. Rename it to `shortage_prediction_model.pkl`

### Step 2: Install Python Dependencies

Make sure you have the required Python packages:

```bash
cd backend/ml
pip install -r requirements.txt
```

Or install manually:
```bash
pip install scikit-learn numpy pandas
```

### Step 3: Verify Model Integration

The system will automatically:
- ✅ Load the model when available
- ✅ Use ML predictions when model is loaded
- ✅ Fall back to rule-based predictions if model is not found
- ✅ Log model status in the backend console

### Step 4: Test the Integration

1. Start your backend server
2. Go to Inventory Management page
3. Click "Run Prediction"
4. Check the backend console for model loading messages

## Model Features

The model expects these features (adjust in `predict_shortage.py` if your model uses different features):
- Current inventory units
- Number of available donors
- Total donations
- Blood type (encoded)
- Units per donor ratio
- Average donations per donor

## Troubleshooting

### Model Not Loading
- Check that the file exists at: `backend/ml/shortage_prediction_model.pkl`
- Verify file permissions
- Check backend console for error messages

### Prediction Errors
- Ensure scikit-learn, numpy, and pandas are installed
- Check that your model's feature requirements match the code
- Review backend console for detailed error messages

### Fallback to Rule-Based
- If model fails to load, the system automatically uses rule-based predictions
- This ensures the system continues to work even without the ML model

## Current Status

✅ Backend route: `/api/predict-shortage`  
✅ Frontend integration: Updated to use real API  
✅ Model loading: Automatic with fallback  
✅ Real-time data: Uses current inventory and donors  


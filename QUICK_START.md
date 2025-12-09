# Quick Start - ML Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Start ML API Server (Terminal 1)
```bash
cd /path/to/your/ml/scripts  # Where api_server.py is located
python api_server.py
```
Expected output: `Uvicorn running on http://0.0.0.0:8000`

### Step 2: Start Ngrok (Terminal 2)
```bash
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Configure App
```bash
cd /Users/harsh/Downloads/Verfiflow-main/veriflow_app
./update-ml-api-url.sh https://abc123.ngrok-free.app  # Use your URL
```

### Step 4: Start Backend (Terminal 3)
```bash
cd /Users/harsh/Downloads/Verfiflow-main/backend
npm start
```

### Step 5: Start Mobile App (Terminal 4)
```bash
cd /Users/harsh/Downloads/Verfiflow-main/veriflow_app
npm start
```

---

## 📱 How to Use

1. **Login as Admin**
2. **Admin Dashboard** → "Record Field Data"
3. Click **"Verify with ML"** (green button)
4. Select a project → **"Run ML Analysis"**
5. Upload drone image
6. Click **"Run Analysis"** (wait 2-5 min)
7. Review results → Add notes → **"Approve"**

---

## ⚠️ Important Notes

- **Ngrok URL changes** every restart - re-run step 3
- **ML analysis takes 2-5 minutes** - don't close app
- **Projects need field verification first**
- **Keep all 4 terminals running**

---

## 🔧 Troubleshooting

### "ML API is not configured"
→ Run step 3 again with correct Ngrok URL

### "ML analysis failed"
→ Check terminals 1 & 2 are still running
→ Restart Ngrok and update URL

### "No projects pending verification"
→ Projects need field verification first

---

## 📄 Full Documentation

- **Complete Setup:** `veriflow_app/ML_INTEGRATION_GUIDE.md`
- **Integration Details:** `INTEGRATION_SUMMARY.md`
- **This Guide:** `QUICK_START.md`

---

## ✅ Files Modified

- ✅ `veriflow_app/screen/VerificationScreen.jsx` - NEW
- ✅ `veriflow_app/services/projectsService.js` - MODIFIED
- ✅ `veriflow_app/screen/RecordFieldDataScreen.jsx` - MODIFIED
- ✅ `veriflow_app/App.js` - MODIFIED
- ✅ `backend/models/Project.js` - MODIFIED
- ✅ `backend/controllers/projectController.js` - MODIFIED

**No existing functionality was broken! ✨**

@echo off
echo 🚀 Cattle Breed Recognition - Complete Setup
echo ===============================================

echo.
echo 📦 Step 1: Installing Flask API dependencies...
pip install -r flask_requirements.txt

echo.
echo 🔧 Step 2: Setting up Express.js Backend...
cd backend
call npm install

echo.
echo 📊 Step 3: Setting up Database...
call npm run db:generate
call npm run db:push

echo.
echo 📱 Step 4: Setting up Mobile App...
cd ..\mobile\pashumitra
call npm install

echo.
echo ✅ Setup Complete!
echo.
echo 🏃‍♂️ To run the complete system:
echo.
echo 1. Start Flask ML API:
echo    python flask_api.py
echo.
echo 2. Start Express.js Backend (in new terminal):
echo    cd backend && npm run dev
echo.
echo 3. Start Mobile App (in new terminal):
echo    cd mobile/pashumitra && npm start
echo.
echo 🔧 Configuration needed:
echo 1. Update backend/.env with your Firebase credentials
echo 2. Update mobile/pashumitra/config/firebase.js with your Firebase config
echo 3. Update API URLs in mobile app if running on different ports
echo.
echo 📖 Check README.md files for detailed configuration instructions
pause
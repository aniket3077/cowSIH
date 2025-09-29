# Project Structure Overview

This project is organized into three main components:

## 📁 Directory Structure

```
MISSION/
├── backend-express/          # Node.js Express.js Backend
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── types/           # TypeScript definitions
│   ├── prisma/              # Database schema
│   ├── package.json
│   └── docker-compose.yml
│
├── flask-api/               # Python Flask ML API
│   ├── app.py              # Main Flask application
│   ├── models/             # ML model files
│   ├── breed_info.py       # Breed data
│   ├── gemini_integration.py
│   ├── test_*.py           # Test files
│   └── flask_requirements.txt
│
├── mobile/pashumitra/       # React Native/Expo Mobile App
│   ├── app/                # Expo Router pages
│   ├── components/         # UI components
│   ├── contexts/           # React contexts
│   ├── config/             # App configuration
│   └── package.json
│
└── docs/                   # Documentation
    ├── backend.md          # Express.js backend guide
    ├── ml.md              # Flask API guide
    └── mobile.md          # Mobile app guide
```

## 🚀 Quick Start

### 1. Backend (Express.js)
```powershell
cd backend-express
npm install
npm run dev
```

### 2. ML API (Flask)
```powershell
cd flask-api
pip install -r flask_requirements.txt
python app.py
```

### 3. Mobile App (Expo)
```powershell
cd mobile/pashumitra
npm install
npm start
```

## 📖 Detailed Documentation

- **Backend**: See [docs/backend.md](docs/backend.md)
- **ML Service**: See [docs/ml.md](docs/ml.md)  
- **Mobile App**: See [docs/mobile.md](docs/mobile.md)

## 🔧 Development Workflow

1. Start the Express.js backend server
2. Start the Flask ML API server
3. Start the Expo mobile development server
4. Use demo accounts for testing authentication flows

## 📝 Notes

- The Express.js backend handles authentication, user management, and API routing
- The Flask API provides machine learning predictions for cattle breed identification
- The mobile app connects to both services and provides the user interface
- All services can run independently for development and testing
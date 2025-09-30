@echo off
echo 🚀 Setting up Cattle Breed Recognition Backend...

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node -v

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Copy environment file if it doesn't exist
if not exist .env (
    echo 📄 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update .env file with your configuration before proceeding
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update .env file with your database URL and Firebase credentials
echo 2. Run 'npm run db:push' to create database tables
echo 3. Start development server with 'npm run dev'
echo.
echo Happy coding! 🎉
pause
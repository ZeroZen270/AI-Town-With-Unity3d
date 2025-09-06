@echo off
echo 🏘️ Setting up AI Town for local development with Ollama and RAG...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    echo # Local development configuration > .env.local
    echo NODE_ENV=development >> .env.local
    echo CONVEX_DEPLOYMENT=local >> .env.local
    echo CONVEX_URL=http://localhost:8080 >> .env.local
    echo OLLAMA_BASE_URL=http://localhost:11434 >> .env.local
    echo CHROMA_URL=http://localhost:8000 >> .env.local
    echo ✅ Created .env.local
)

REM Build and start containers
echo 🐳 Building and starting containers...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

echo 📥 Setting up Ollama models...
npm run setup:ollama

echo.
echo 🎉 AI Town Local is ready!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Convex API: http://localhost:8080
echo 🦙 Ollama API: http://localhost:11434
echo 🔍 ChromaDB: http://localhost:8000
echo 🎮 Unity API: http://localhost:3000/unity/*
echo.
echo 🚀 Next steps:
echo 1. Visit http://localhost:3000 to see the AI Town interface
echo 2. The agents will start acting autonomously using local AI
echo 3. Check the logs: docker-compose logs -f
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f

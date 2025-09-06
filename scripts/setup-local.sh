#!/bin/bash

echo "🏘️ Setting up AI Town for local development with Ollama and RAG..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Local development configuration
NODE_ENV=development
CONVEX_DEPLOYMENT=local
CONVEX_URL=http://localhost:8080
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_URL=http://localhost:8000
EOF
    echo "✅ Created .env.local"
fi

# Build and start containers
echo "🐳 Building and starting containers..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "🔍 Checking services..."

if curl -f http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Convex local server is running"
else
    echo "❌ Convex local server failed to start"
fi

if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running"
else
    echo "❌ Ollama failed to start"
fi

if curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
    echo "✅ ChromaDB is running"
else
    echo "❌ ChromaDB failed to start"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ AI Town frontend is running"
else
    echo "❌ AI Town frontend failed to start"
fi

echo ""
echo "📥 Setting up Ollama models..."
npm run setup:ollama

echo ""
echo "🎉 AI Town Local is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Convex API: http://localhost:8080"
echo "🦙 Ollama API: http://localhost:11434"
echo "🔍 ChromaDB: http://localhost:8000"
echo "🎮 Unity API: http://localhost:3000/unity/*"
echo ""
echo "🚀 Next steps:"
echo "1. Visit http://localhost:3000 to see the AI Town interface"
echo "2. The agents will start acting autonomously using local AI"
echo "3. Check the logs: docker-compose logs -f"
echo ""
echo "To stop: docker-compose down"
echo "To view logs: docker-compose logs -f"

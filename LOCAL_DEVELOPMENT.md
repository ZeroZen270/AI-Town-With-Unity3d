# 🏠 Local Development Guide - AI Town with Ollama & RAG

This guide explains how to run AI Town completely locally with Ollama for AI and ChromaDB for RAG.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

**Windows:**
```cmd
scripts\setup-local.bat
```

### Option 2: Manual Setup

1. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Start all containers:**
   ```bash
   docker-compose up --build -d
   ```

3. **Setup Ollama models:**
   ```bash
   npm run setup:ollama
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Ollama: http://localhost:11434
   - ChromaDB: http://localhost:8000
   - Convex: http://localhost:8080

## 🐳 Container Services

### AI Town App (Port 3000)
- React frontend with real-time updates
- Convex integration for data synchronization
- Unity API endpoints

### Convex Local (Port 8080)
- Local Convex database and functions
- Real-time subscriptions
- Authentication system

### Ollama (Port 11434)
- Local LLM inference
- Models: llama3.2:3b, nomic-embed-text
- No external API calls

### ChromaDB (Port 8000)
- Vector database for RAG
- Agent memories and world knowledge
- Similarity search for context retrieval

## 🤖 AI Models

### Required Models
The setup script automatically downloads:

1. **llama3.2:3b** (~2GB)
   - Main conversational AI
   - Agent decision making
   - Dialogue generation

2. **nomic-embed-text** (~274MB)
   - Text embeddings
   - Memory similarity search
   - Knowledge retrieval

### Manual Model Management
```bash
# List available models
docker-compose exec ollama ollama list

# Pull additional models
docker-compose exec ollama ollama pull llama3.2:7b

# Remove models
docker-compose exec ollama ollama rm llama3.2:1b

# Test model
docker-compose exec ollama ollama run llama3.2:3b "Hello!"
```

## 🧠 RAG System

### Memory Collections
- **agent_memories**: Personal experiences and decisions
- **world_knowledge**: General information about locations and activities
- **conversation_history**: Past conversations for context

### Memory Storage Flow
1. Agent makes a decision
2. Generate embedding with nomic-embed-text
3. Store in ChromaDB with metadata
4. Retrieve similar memories for future decisions

### Testing RAG
```bash
# Check ChromaDB collections
curl http://localhost:8000/api/v1/collections

# View collection details
curl http://localhost:8000/api/v1/collections/agent_memories
```

## 🔧 Development Commands

### Docker Management
```bash
# Start all services
docker-compose up -d

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ai-town
docker-compose logs -f ollama
docker-compose logs -f chroma
docker-compose logs -f convex-local

# Restart specific service
docker-compose restart ai-town

# Stop all services
docker-compose down

# Remove all data (reset)
docker-compose down -v
```

### Development Workflow
```bash
# Make code changes (auto-reload enabled)
# Test at http://localhost:3000

# Check agent behavior
curl http://localhost:3000/unity/agents

# Trigger agent action
curl -X POST http://localhost:3000/unity/trigger-action \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Alice"}'

# View recent activities
curl http://localhost:3000/unity/activities?limit=5
```

## 🧪 Testing & Debugging

### Health Checks
```bash
# Test all services
curl http://localhost:3000/health          # AI Town
curl http://localhost:8080                 # Convex
curl http://localhost:11434/api/tags       # Ollama
curl http://localhost:8000/api/v1/heartbeat # ChromaDB
```

### AI Testing
```bash
# Test Ollama chat
curl http://localhost:11434/api/generate \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "You are Alice, a librarian. What would you do next?",
    "stream": false
  }'

# Test embeddings
curl http://localhost:11434/api/embeddings \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "I love reading books in the library"
  }'
```

### RAG Testing
```bash
# Check ChromaDB status
curl http://localhost:8000/api/v1/version

# List collections
curl http://localhost:8000/api/v1/collections

# Query memories (requires data)
curl -X POST http://localhost:8000/api/v1/collections/agent_memories/query \
  -H "Content-Type: application/json" \
  -d '{
    "query_texts": ["What should I do in the library?"],
    "n_results": 3
  }'
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check Docker resources
docker system df
docker system prune -f

# Check port conflicts
lsof -i :3000
lsof -i :8080
lsof -i :11434
lsof -i :8000

# Restart Docker daemon
sudo systemctl restart docker  # Linux
# or restart Docker Desktop
```

### Ollama Issues
```bash
# Check Ollama logs
docker-compose logs ollama

# Verify models are downloaded
docker-compose exec ollama ollama list

# Test model directly
docker-compose exec ollama ollama run llama3.2:3b "test"

# Re-download models
docker-compose exec ollama ollama pull llama3.2:3b
docker-compose exec ollama ollama pull nomic-embed-text
```

### ChromaDB Issues
```bash
# Check ChromaDB logs
docker-compose logs chroma

# Reset ChromaDB data
docker-compose stop chroma
docker volume rm ai-town_chroma-data
docker-compose up chroma -d

# Test ChromaDB connection
curl http://localhost:8000/api/v1/heartbeat
```

### Agent Behavior Issues
```bash
# Check agent generation logs
docker-compose logs ai-town | grep "generateAgentAction"

# Verify RAG is working
docker-compose logs ai-town | grep "retrieveRelevantMemories"

# Test agent endpoint
curl http://localhost:3000/unity/agents | jq '.agents[0]'
```

### Memory Issues
If you're running out of memory:

1. **Reduce model size:**
   ```bash
   # Use smaller model
   docker-compose exec ollama ollama pull llama3.2:1b
   # Update convex/llm.ts to use llama3.2:1b
   ```

2. **Increase Docker memory:**
   - Docker Desktop: Settings > Resources > Memory (8GB+)
   - Linux: No limit by default

3. **Reduce agent count:**
   - Edit `convex/agents.ts` and reduce the agents array

## 📊 Performance Monitoring

### Resource Usage
```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df

# Check model sizes
docker-compose exec ollama ollama list
```

### Response Times
```bash
# Time agent action generation
time curl -X POST http://localhost:3000/unity/trigger-action \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Alice"}'

# Time memory retrieval
time curl http://localhost:3000/unity/agents
```

## 🚀 Production Considerations

### Performance Optimization
1. **Use GPU acceleration:**
   ```yaml
   # Add to docker-compose.yml ollama service
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             count: 1
             capabilities: [gpu]
   ```

2. **Use larger models:**
   ```bash
   ollama pull llama3.2:7b  # Better quality
   ollama pull llama3.2:70b # Best quality (requires 40GB+ RAM)
   ```

3. **Persistent volumes:**
   ```yaml
   # Ensure data persistence
   volumes:
     - ollama-data:/root/.ollama
     - chroma-data:/chroma/chroma
     - convex-data:/data
   ```

### Security
1. **Network isolation:**
   ```yaml
   # Add to docker-compose.yml
   networks:
     ai-town-network:
       driver: bridge
   ```

2. **Environment secrets:**
   ```bash
   # Use Docker secrets for sensitive data
   echo "secret-key" | docker secret create api-key -
   ```

## 💡 Development Tips

1. **Hot Reload**: Code changes automatically reload
2. **Debugging**: Use `console.log()` and check container logs
3. **Database**: Data persists between container restarts
4. **Models**: Download once, reuse across restarts
5. **Testing**: Use curl commands to test API endpoints
6. **Unity**: Test web interface before Unity integration

## 🎯 Next Steps

1. **Customize Agents**: Edit `convex/agents.ts` to add more agents
2. **Improve AI**: Experiment with different models and prompts
3. **Add Features**: Implement new agent behaviors and interactions
4. **Unity Integration**: Follow `Unity3D_Integration_Guide.md`
5. **Scale Up**: Use larger models and more agents for richer simulation

Happy local AI development! 🎉

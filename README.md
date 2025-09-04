# 🏘️ AI Town - Fully Local with Ollama & RAG

An AI-powered virtual town simulation where autonomous agents live, interact, and have conversations in real-time. This version runs completely locally using Ollama for AI and ChromaDB for RAG (Retrieval-Augmented Generation).

## 🌟 Features

- **🤖 Local AI**: Uses Ollama with Llama 3.2 for agent behaviors and conversations
- **🧠 RAG System**: ChromaDB for agent memories and world knowledge
- **⚡ Real-time**: Convex for live updates and data synchronization
- **🎮 Unity Ready**: REST API endpoints for 3D game integration
- **🐳 Containerized**: Complete Docker setup for easy deployment
- **🔒 Privacy First**: Everything runs locally, no external API calls

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- 8GB+ RAM (for Ollama models)

### Automated Setup

**Linux/Mac:**
```bash
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

**Windows:**
```cmd
scripts\setup-local.bat
```

### Manual Setup

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd ai-town
   cp .env.local.example .env.local
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build -d
   ```

3. **Setup Ollama models:**
   ```bash
   npm run setup:ollama
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Ollama API: http://localhost:11434
   - ChromaDB: http://localhost:8000
   - Unity API: http://localhost:3000/unity/*

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Convex DB     │    │     Ollama      │
│   (Frontend)    │◄──►│   (Real-time)   │◄──►│   (Local AI)    │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 11434   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    ChromaDB     │
                    │  (RAG/Vector)   │
                    │   Port: 8000    │
                    └─────────────────┘
```

## 🤖 AI Models Used

- **llama3.2:3b** - Main conversational AI for agent behaviors
- **nomic-embed-text** - Text embeddings for RAG similarity search

## 🧠 RAG System

The agents use a sophisticated memory and knowledge system:

### Agent Memories
- **Personal experiences** stored with importance scores
- **Contextual retrieval** based on current situation
- **Emotional significance** affects memory retention

### World Knowledge
- **Location information** and appropriate behaviors
- **Social dynamics** and interaction patterns
- **Activity suggestions** based on personality and context

### Memory Types
- **Episodic**: Specific events and interactions
- **Semantic**: General knowledge about the world
- **Procedural**: How to perform activities

## 🎮 Unity 3D Integration

Complete REST API for Unity integration:

### Endpoints
- `GET /unity/agents` - Get all agents with positions
- `GET /unity/activities` - Get recent activities
- `GET /unity/conversations` - Get active conversations
- `POST /unity/trigger-action` - Trigger agent action
- `POST /unity/initialize` - Initialize simulation

See `Unity3D_Integration_Guide.md` for complete Unity setup.

## 🔧 Development

### Local Development Commands

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ai-town
docker-compose logs -f ollama
docker-compose logs -f chroma

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build

# Access container shell
docker-compose exec ai-town sh
```

### Manual Development (Without Docker)

```bash
# Install dependencies
npm install

# Start Ollama (separate terminal)
ollama serve

# Pull required models
ollama pull llama3.2:3b
ollama pull nomic-embed-text

# Start ChromaDB (separate terminal)
chroma run --host localhost --port 8000

# Start development servers
npm run dev
```

## 📊 Monitoring & Debugging

### Health Checks
```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:8080
curl http://localhost:11434/api/tags
curl http://localhost:8000/api/v1/heartbeat
```

### View Agent Behavior
```bash
# Get all agents
curl http://localhost:3000/unity/agents

# Get recent activities
curl http://localhost:3000/unity/activities?limit=10

# Trigger specific agent action
curl -X POST http://localhost:3000/unity/trigger-action \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Alice"}'
```

## 🔧 Configuration

### Environment Variables (.env.local)
```env
NODE_ENV=development
CONVEX_DEPLOYMENT=local
CONVEX_URL=http://localhost:8080
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_URL=http://localhost:8000
```

### Ollama Configuration
- **Model**: llama3.2:3b (3B parameters, good balance of speed/quality)
- **Context**: 4096 tokens
- **Temperature**: 0.7 (creative but consistent)

### ChromaDB Configuration
- **Collections**: agent_memories, world_knowledge, conversation_history
- **Embedding Model**: nomic-embed-text (768 dimensions)
- **Similarity**: Cosine similarity for retrieval

## 🚀 Production Deployment

For production deployment:

1. **Use larger models** for better AI quality:
   ```bash
   ollama pull llama3.2:7b  # Better quality
   ```

2. **Scale resources**:
   - Increase Docker memory limits
   - Use GPU acceleration for Ollama
   - Scale ChromaDB with persistent volumes

3. **Security**:
   - Add authentication to endpoints
   - Use HTTPS with reverse proxy
   - Restrict network access

## 🐛 Troubleshooting

### Common Issues

**Ollama models not downloading:**
```bash
# Check Ollama logs
docker-compose logs ollama

# Manually pull models
docker-compose exec ollama ollama pull llama3.2:3b
```

**ChromaDB connection issues:**
```bash
# Check ChromaDB health
curl http://localhost:8000/api/v1/heartbeat

# Reset ChromaDB data
docker-compose down -v
docker-compose up chroma -d
```

**Agents not responding:**
```bash
# Check agent generation logs
docker-compose logs ai-town | grep "generateAgentAction"

# Test Ollama directly
curl http://localhost:11434/api/generate \
  -d '{"model": "llama3.2:3b", "prompt": "Hello"}'
```

**Memory issues:**
- Increase Docker memory allocation (8GB+ recommended)
- Use smaller models (llama3.2:1b for testing)
- Reduce agent count in initialization

## 📁 Project Structure

```
ai-town/
├── convex/              # Backend functions
│   ├── agents.ts        # Agent management
│   ├── llm.ts          # Ollama integration
│   ├── rag.ts          # RAG system
│   ├── memories.ts     # Memory management
│   └── router.ts       # Unity API endpoints
├── src/                # Frontend React app
├── scripts/            # Setup scripts
├── docker-compose.yml  # Container orchestration
└── Unity3D_Integration_Guide.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with local containers
4. Ensure all AI models work correctly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Need Help?

1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test individual components with curl commands
4. Review the Unity integration guide for 3D setup
5. Open an issue on GitHub

---

**🎉 Enjoy your fully local AI Town!** The agents will start living their virtual lives using completely local AI, with no external dependencies or privacy concerns.

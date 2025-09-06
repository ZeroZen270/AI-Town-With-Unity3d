#!/usr/bin/env node

console.log('🦙 Setting up Ollama models...');
console.log('📝 This script will help you set up the required models for AI Town.');
console.log('');
console.log('Required models:');
console.log('- llama3.2:3b (Main chat model)');
console.log('- nomic-embed-text (Embedding model)');
console.log('');
console.log('🔧 To set up models manually, run these commands:');
console.log('');
console.log('docker-compose exec ollama ollama pull llama3.2:3b');
console.log('docker-compose exec ollama ollama pull nomic-embed-text');
  console.log('🦙 Setting up Ollama models...');
  
  try {
    // Check if Ollama is running
    const models = await ollama.list();
    console.log('✅ Ollama is running');
    
    const existingModels = models.models.map(m => m.name);
    
    for (const model of requiredModels) {
      if (existingModels.some(existing => existing.includes(model))) {
        console.log(`✅ Model ${model} already exists`);
      } else {
        console.log(`📥 Pulling model ${model}...`);
        await ollama.pull({ model });
        console.log(`✅ Model ${model} pulled successfully`);
      }
    }
    
    console.log('🎉 All required models are ready!');
    
    // Test the models
    console.log('🧪 Testing models...');
    
    const chatResponse = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: 'Hello! Say "AI Town is ready!"' }],
      stream: false,
    });
    console.log('💬 Chat test:', chatResponse.message.content);
    
    const embedding = await ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: 'test embedding',
    });
    console.log('🔢 Embedding test: Generated', embedding.embedding.length, 'dimensions');
    
    console.log('✅ All tests passed! Ollama is ready for AI Town.');
    
  } catch (error) {
    console.error('❌ Error setting up Ollama:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure Ollama is running: docker-compose up ollama');
    console.log('2. Check if the service is accessible: curl http://localhost:11434/api/tags');
    console.log('3. Wait a moment for the service to start up completely');
    process.exit(1);
  }
}

setupOllama();

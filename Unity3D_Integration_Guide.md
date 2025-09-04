# Unity 3D AI Town Integration Guide

## Overview
This guide shows how to connect your Unity 3D game to the AI Town Convex backend for real-time agent simulation.

## API Endpoints

### Base URL
Replace `YOUR_DEPLOYMENT_NAME` with your actual Convex deployment name:
```
https://YOUR_DEPLOYMENT_NAME.convex.cloud
```

### Available Endpoints

#### 1. Get All Agents State
```
GET /unity/agents
```
Returns all agents with their positions, activities, and states.

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_id",
      "name": "Alice",
      "avatar": "👩‍🏫",
      "description": "A friendly librarian...",
      "personality": "Introverted, thoughtful...",
      "currentLocation": "Library",
      "currentActivity": "Reading",
      "lastActive": 1234567890,
      "position": { "x": -10, "y": 0, "z": 5 },
      "memories": ["..."],
      "relationships": {}
    }
  ],
  "locations": [
    {
      "name": "Library",
      "description": "A quiet place...",
      "type": "social",
      "capacity": 10,
      "currentAgents": ["Alice"],
      "position": { "x": -10, "y": 0, "z": 5 }
    }
  ],
  "timestamp": 1234567890
}
```

#### 2. Get Recent Activities
```
GET /unity/activities?limit=20
```
Returns recent agent activities for displaying notifications/logs.

#### 3. Get Active Conversations
```
GET /unity/conversations
```
Returns active conversations for speech bubbles and dialogue display.

#### 4. Trigger Agent Action (Debug)
```
POST /unity/trigger-action
Content-Type: application/json

{
  "agentName": "Alice"
}
```

#### 5. Initialize Simulation
```
POST /unity/initialize
```
Initializes agents and locations, starts the simulation.

## Unity C# Integration Scripts

### 1. AI Town Manager (Main Controller)
```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

public class AITownManager : MonoBehaviour
{
    [Header("Configuration")]
    public string convexBaseUrl = "https://YOUR_DEPLOYMENT_NAME.convex.cloud";
    public float updateInterval = 2f; // Update every 2 seconds
    
    [Header("Prefabs")]
    public GameObject agentPrefab;
    public GameObject locationPrefab;
    
    private Dictionary<string, GameObject> agentObjects = new Dictionary<string, GameObject>();
    private Dictionary<string, GameObject> locationObjects = new Dictionary<string, GameObject>();
    
    void Start()
    {
        StartCoroutine(InitializeSimulation());
        StartCoroutine(UpdateLoop());
    }
    
    IEnumerator InitializeSimulation()
    {
        UnityWebRequest request = UnityWebRequest.Post($"{convexBaseUrl}/unity/initialize", "");
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            Debug.Log("AI Town simulation initialized!");
        }
        else
        {
            Debug.LogError($"Failed to initialize: {request.error}");
        }
    }
    
    IEnumerator UpdateLoop()
    {
        while (true)
        {
            yield return StartCoroutine(UpdateAgentsAndLocations());
            yield return new WaitForSeconds(updateInterval);
        }
    }
    
    IEnumerator UpdateAgentsAndLocations()
    {
        UnityWebRequest request = UnityWebRequest.Get($"{convexBaseUrl}/unity/agents");
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            var response = JsonConvert.DeserializeObject<AgentsResponse>(request.downloadHandler.text);
            UpdateAgents(response.agents);
            UpdateLocations(response.locations);
        }
    }
    
    void UpdateAgents(List<AgentData> agents)
    {
        foreach (var agentData in agents)
        {
            if (!agentObjects.ContainsKey(agentData.id))
            {
                // Create new agent
                GameObject agentObj = Instantiate(agentPrefab);
                agentObj.name = agentData.name;
                agentObjects[agentData.id] = agentObj;
                
                var agentController = agentObj.GetComponent<AgentController>();
                agentController.Initialize(agentData);
            }
            else
            {
                // Update existing agent
                var agentController = agentObjects[agentData.id].GetComponent<AgentController>();
                agentController.UpdateData(agentData);
            }
        }
    }
    
    void UpdateLocations(List<LocationData> locations)
    {
        foreach (var locationData in locations)
        {
            if (!locationObjects.ContainsKey(locationData.name))
            {
                GameObject locationObj = Instantiate(locationPrefab);
                locationObj.name = locationData.name;
                locationObj.transform.position = new Vector3(
                    locationData.position.x, 
                    locationData.position.y, 
                    locationData.position.z
                );
                locationObjects[locationData.name] = locationObj;
                
                var locationController = locationObj.GetComponent<LocationController>();
                locationController.Initialize(locationData);
            }
        }
    }
}
```

### 2. Agent Controller
```csharp
using UnityEngine;
using System.Collections;

public class AgentController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 2f;
    public float rotationSpeed = 5f;
    
    [Header("UI")]
    public GameObject speechBubblePrefab;
    public Transform speechBubbleAnchor;
    
    private AgentData currentData;
    private Vector3 targetPosition;
    private GameObject currentSpeechBubble;
    
    public void Initialize(AgentData data)
    {
        currentData = data;
        targetPosition = new Vector3(data.position.x, data.position.y, data.position.z);
        transform.position = targetPosition;
        
        // Set up visual representation based on agent data
        SetupVisuals();
    }
    
    public void UpdateData(AgentData newData)
    {
        currentData = newData;
        Vector3 newTargetPosition = new Vector3(newData.position.x, newData.position.y, newData.position.z);
        
        if (Vector3.Distance(targetPosition, newTargetPosition) > 0.1f)
        {
            targetPosition = newTargetPosition;
            StartCoroutine(MoveToTarget());
        }
    }
    
    void SetupVisuals()
    {
        // Create agent visual based on avatar emoji and personality
        // You can use TextMeshPro to display the emoji or create 3D models
        var textComponent = GetComponentInChildren<TextMeshPro>();
        if (textComponent != null)
        {
            textComponent.text = currentData.avatar;
        }
    }
    
    IEnumerator MoveToTarget()
    {
        while (Vector3.Distance(transform.position, targetPosition) > 0.1f)
        {
            transform.position = Vector3.MoveTowards(transform.position, targetPosition, moveSpeed * Time.deltaTime);
            
            // Rotate towards movement direction
            Vector3 direction = (targetPosition - transform.position).normalized;
            if (direction != Vector3.zero)
            {
                Quaternion targetRotation = Quaternion.LookRotation(direction);
                transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
            }
            
            yield return null;
        }
    }
    
    public void ShowSpeechBubble(string message)
    {
        if (currentSpeechBubble != null)
        {
            Destroy(currentSpeechBubble);
        }
        
        currentSpeechBubble = Instantiate(speechBubblePrefab, speechBubbleAnchor);
        var textComponent = currentSpeechBubble.GetComponentInChildren<TextMeshPro>();
        if (textComponent != null)
        {
            textComponent.text = message;
        }
        
        // Auto-hide after 5 seconds
        StartCoroutine(HideSpeechBubbleAfterDelay(5f));
    }
    
    IEnumerator HideSpeechBubbleAfterDelay(float delay)
    {
        yield return new WaitForSeconds(delay);
        if (currentSpeechBubble != null)
        {
            Destroy(currentSpeechBubble);
        }
    }
}
```

### 3. Data Classes
```csharp
[System.Serializable]
public class AgentsResponse
{
    public List<AgentData> agents;
    public List<LocationData> locations;
    public long timestamp;
}

[System.Serializable]
public class AgentData
{
    public string id;
    public string name;
    public string avatar;
    public string description;
    public string personality;
    public string currentLocation;
    public string currentActivity;
    public long lastActive;
    public Position position;
    public List<string> memories;
}

[System.Serializable]
public class LocationData
{
    public string name;
    public string description;
    public string type;
    public int capacity;
    public List<string> currentAgents;
    public Position position;
}

[System.Serializable]
public class Position
{
    public float x;
    public float y;
    public float z;
}

[System.Serializable]
public class ConversationData
{
    public string id;
    public List<string> participants;
    public string location;
    public string topic;
    public List<MessageData> messages;
    public bool isActive;
}

[System.Serializable]
public class MessageData
{
    public string speaker;
    public string content;
    public long timestamp;
}
```

### 4. Conversation Manager
```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;

public class ConversationManager : MonoBehaviour
{
    public string convexBaseUrl = "https://YOUR_DEPLOYMENT_NAME.convex.cloud";
    public float conversationUpdateInterval = 1f;
    
    private Dictionary<string, ConversationData> activeConversations = new Dictionary<string, ConversationData>();
    
    void Start()
    {
        StartCoroutine(ConversationUpdateLoop());
    }
    
    IEnumerator ConversationUpdateLoop()
    {
        while (true)
        {
            yield return StartCoroutine(UpdateConversations());
            yield return new WaitForSeconds(conversationUpdateInterval);
        }
    }
    
    IEnumerator UpdateConversations()
    {
        UnityWebRequest request = UnityWebRequest.Get($"{convexBaseUrl}/unity/conversations");
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            var response = JsonConvert.DeserializeObject<ConversationsResponse>(request.downloadHandler.text);
            ProcessConversations(response.conversations);
        }
    }
    
    void ProcessConversations(List<ConversationData> conversations)
    {
        foreach (var conversation in conversations)
        {
            if (conversation.isActive && conversation.messages.Count > 0)
            {
                var lastMessage = conversation.messages[conversation.messages.Count - 1];
                
                // Find the agent and show speech bubble
                var aiTownManager = FindObjectOfType<AITownManager>();
                // Show speech bubble for the speaking agent
                ShowSpeechBubbleForAgent(lastMessage.speaker, lastMessage.content);
            }
        }
    }
    
    void ShowSpeechBubbleForAgent(string agentName, string message)
    {
        var agentObjects = FindObjectsOfType<AgentController>();
        foreach (var agent in agentObjects)
        {
            if (agent.name == agentName)
            {
                agent.ShowSpeechBubble(message);
                break;
            }
        }
    }
}

[System.Serializable]
public class ConversationsResponse
{
    public List<ConversationData> conversations;
    public long timestamp;
}
```

## Setup Instructions

1. **Get your Convex deployment URL** from the dashboard
2. **Replace `YOUR_DEPLOYMENT_NAME`** in all scripts with your actual deployment name
3. **Install Newtonsoft.Json** in Unity (Window > Package Manager > Add package by name: `com.unity.nuget.newtonsoft-json`)
4. **Create prefabs** for agents and locations
5. **Set up the scene** with the AITownManager script
6. **Configure the update intervals** based on your needs

## Location Coordinates
The system uses these default coordinates for locations:
- Library: (-10, 0, 5)
- Cafe: (0, 0, 10)  
- Lab: (10, 0, 5)
- Art Studio: (-5, 0, -10)
- Gym: (5, 0, -10)
- Park: (0, 0, 0)
- Town Square: (0, 0, -5)

You can modify these in the `convex/router.ts` file to match your Unity scene layout.

## Features You Can Implement

1. **Real-time Agent Movement** - Agents smoothly move between locations
2. **Speech Bubbles** - Show conversations in real-time
3. **Activity Indicators** - Visual feedback for what agents are doing
4. **Location Highlights** - Show which locations are active
5. **Agent Interaction** - Click on agents to see their details
6. **Time of Day System** - Visual changes based on simulation time
7. **Particle Effects** - For agent actions and location activities
8. **Camera Controls** - Follow agents or overview the town
9. **UI Panels** - Show agent details, conversations, activities
10. **Sound Effects** - Audio feedback for agent actions

This integration allows your Unity 3D game to display the AI Town simulation in real-time with smooth animations and interactive elements!

import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">🏘️ AI Town</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-4">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        <AITownDashboard />
      </Authenticated>
      <Unauthenticated>
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Welcome to AI Town</h1>
          <p className="text-xl text-secondary mb-8">
            Watch AI agents live their virtual lives, interact, and have conversations
          </p>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}

function AITownDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<string>("Town Square");
  const [isInitialized, setIsInitialized] = useState(false);
  
  const agents = useQuery(api.agents.getAllAgents);
  const locations = useQuery(api.agents.getAllLocations);
  const agentsInLocation = useQuery(api.agents.getAgentsByLocation, { location: selectedLocation });
  const conversations = useQuery(api.conversations.getConversationsByLocation, { location: selectedLocation });
  const recentActivities = useQuery(api.activities.getRecentActivities, { limit: 15 });
  const locationActivities = useQuery(api.activities.getActivitiesByLocation, { 
    location: selectedLocation, 
    limit: 10 
  });

  const initializeAgents = useMutation(api.agents.initializeAgents);
  const initializeLocations = useMutation(api.agents.initializeLocations);
  const startSimulation = useMutation(api.simulation.startSimulation);

  useEffect(() => {
    if (agents && locations && agents.length === 0 && locations.length === 0 && !isInitialized) {
      const initialize = async () => {
        await initializeAgents();
        await initializeLocations();
        await startSimulation();
        setIsInitialized(true);
      };
      initialize();
    }
  }, [agents, locations, isInitialized, initializeAgents, initializeLocations, startSimulation]);

  if (!agents || !locations) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Initializing AI Town...</h2>
        <p className="text-gray-600">Setting up agents and locations</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">🏘️ AI Town - Local Edition</h1>
        <p className="text-gray-600">Watch AI agents interact using local Ollama AI and RAG</p>
        <div className="flex justify-center items-center space-x-4 mt-2">
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>🦙 Ollama AI</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>🧠 Local RAG</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-purple-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>⚡ Real-time</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locations Panel */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-xl font-semibold mb-4">📍 Locations</h2>
          <div className="space-y-2">
            {locations.map((location) => (
              <button
                key={location._id}
                onClick={() => setSelectedLocation(location.name)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedLocation === location.name
                    ? "bg-blue-50 border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-gray-600">{location.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {location.currentAgents.length} agents present
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Location View */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-xl font-semibold mb-4">🏢 {selectedLocation}</h2>
          
          {/* Agents in location */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Agents Present:</h3>
            {agentsInLocation && agentsInLocation.length > 0 ? (
              <div className="space-y-2">
                {agentsInLocation.map((agent) => (
                  <div key={agent._id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <span className="text-2xl">{agent.avatar}</span>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-gray-600">{agent.currentActivity}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No agents currently here</p>
            )}
          </div>

          {/* Recent conversations */}
          <div>
            <h3 className="font-medium mb-2">Recent Conversations:</h3>
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {conversations.slice(0, 3).map((conv) => (
                  <div key={conv._id} className="border rounded p-3 bg-gray-50">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Topic: {conv.topic}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Participants: {conv.participants.join(", ")}
                    </div>
                    <div className="space-y-1">
                      {conv.messages.slice(-3).map((msg, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">{msg.speaker}:</span>{" "}
                          <span className="text-gray-700">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent conversations</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-xl font-semibold mb-4">📋 Activity Feed</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity._id} className="p-2 border-l-2 border-blue-200 bg-blue-50 rounded-r">
                  <div className="text-sm">{activity.description}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* All Agents Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-xl font-semibold mb-4">👥 All Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-3xl">{agent.avatar}</span>
                <div>
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-sm text-gray-600">{agent.currentLocation}</div>
                </div>
              </div>
              <div className="text-sm text-gray-700 mb-2">{agent.description}</div>
              <div className="text-xs text-gray-500">
                Currently: {agent.currentActivity}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Last active: {new Date(agent.lastActive).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

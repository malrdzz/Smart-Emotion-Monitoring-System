import { useState, useEffect } from 'react';
import { useCheckins } from "../contexts/CheckinContext";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Send, Bot, User as UserIcon, ChevronRight, ChevronLeft, Trash2, Plus, Search, Edit2, Check, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  emotion?: string;
  sentiment?: string;
  timestamp: Date;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [emotionIntensity, setEmotionIntensity] = useState([50]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConvoId, setEditingConvoId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { token } = useAuth();

  const generateGreeting = (profile: any, isNewUser: boolean = false) => {
    if (isNewUser || !profile) {
      return "👋 Hello! Welcome to your personal emotion tracking assistant! I'm here to help you understand and manage your feelings. How are you feeling today?";
    }

    const { name } = profile;
    const firstName = name ? name.split(' ')[0] : 'there';

    return `👋 Hello ${firstName}! Welcome back to your personal emotion tracking assistant!`;
  };

  useEffect(() => {
    if (token) {
      // First fetch user profile
      fetch("http://localhost:5000/api/profile", {
        headers: { Authorization: token },
      })
        .then(res => res.json())
        .then(profile => {
          setUserProfile(profile);

          // Fetch conversations list
          return fetch("http://localhost:5000/api/conversations", {
            headers: { Authorization: token },
          })
            .then(res => res.json())
            .then(convos => {
              setConversations(convos);

              // If there are conversations, load the most recent one
              if (convos.length > 0) {
                const mostRecent = convos[0];
                setCurrentConversationId(mostRecent.id);

                // Fetch chat logs for the most recent conversation
                return fetch(`http://localhost:5000/api/chat_logs?conversation_id=${mostRecent.id}`, {
                  headers: { Authorization: token },
                })
                  .then(res => res.json())
                  .then(logs => ({ profile, logs, isNewUser: false }));
              } else {
                // No conversations, treat as new user
                return { profile, logs: [], isNewUser: true };
              }
            });
        })
        .then(({ profile, logs, isNewUser }) => {
          const loadedMessages: Message[] = logs.map((log: any) => ({
            id: log.id.toString(),
            type: log.type,
            content: log.content,
            emotion: log.emotion,
            sentiment: log.sentiment,
            timestamp: new Date(log.timestamp),
          }));

          // Generate appropriate welcome message
          const welcomeMessage: Message = {
            id: 'welcome',
            type: 'bot',
            content: generateGreeting(profile, isNewUser),
            timestamp: new Date(),
          };

          setMessages([welcomeMessage, ...loadedMessages]);
        })
        .catch(() => {
          // If error fetching profile or logs, treat as new user
          setMessages([{
            id: 'welcome',
            type: 'bot',
            content: generateGreeting(null, true),
            timestamp: new Date(),
          }]);
        });
    }
  }, [token]);

  const emotions = [
    { emoji: '😡', label: 'Anger' },
    { emoji: '🤢', label: 'Disgust' },
    { emoji: '😱', label: 'Fear' },
    { emoji: '😊', label: 'Joy' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😢', label: 'Sadness' },
    { emoji: '😲', label: 'Surprise' },
  ];

  const extractEmojis = (text: string) => {
    return Array.from(text).filter(char => /\p{Emoji}/u.test(char));
  };

  // Send text to backend
  const sendToBackend = async (text: string) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          text,
          emojis: extractEmojis(text),
          intensity: emotionIntensity[0],
          conversation_id: currentConversationId || 1 // Use current conversation
        }),
      });

      return await res.json();
    } catch (error) {
      console.error("Backend error:", error);
      return { reply: "Server error", emotion: "Neutral", sentiment: "Neutral" };
    }
  };

  // Handle user sending message
  const handleSend = async () => {
    if (!input.trim()) return;

    // Send to backend for analysis + reply
    const backendReply = await sendToBackend(input);

    // USER MESSAGE (with emotion & sentiment)
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      emotion: backendReply.emotion || "Neutral",
      sentiment: backendReply.sentiment || "Neutral",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // BOT MESSAGE
    const botContent = backendReply.reply || backendReply.error || "Sorry, I encountered an issue processing your request.";
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: botContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setInput("");
  };

  const handleNewChat = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ title: "New Chat" }),
      });

      const newConvo = await res.json();
      setConversations([newConvo, ...conversations]);
      setCurrentConversationId(newConvo.id);

      // Reset messages with welcome message
      setMessages([{
        id: 'welcome',
        type: 'bot',
        content: generateGreeting(userProfile, false),
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleDeleteChat = async (conversationId: number) => {
    if (!token) return;

    try {
      await fetch(`http://localhost:5000/api/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      const updatedConvos = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConvos);

      // If deleted current conversation, switch to another or create new
      if (currentConversationId === conversationId) {
        if (updatedConvos.length > 0) {
          handleLoadConversation(updatedConvos[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleRenameStart = (convo: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvoId(convo.id);
    setEditTitle(convo.title);
  };

  const handleRenameSave = async (conversationId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !editTitle.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify({ title: editTitle }),
      });

      if (res.ok) {
        setConversations(conversations.map(c =>
          c.id === conversationId ? { ...c, title: editTitle } : c
        ));
        setEditingConvoId(null);
      }
    } catch (error) {
      console.error("Rename failed", error);
    }
  };

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvoId(null);
  };

  const handleLoadConversation = async (conversationId: number) => {
    if (!token) return;

    try {
      setCurrentConversationId(conversationId);

      const res = await fetch(`http://localhost:5000/api/chat_logs?conversation_id=${conversationId}`, {
        headers: { Authorization: token },
      });

      const logs = await res.json();
      const loadedMessages: Message[] = logs.map((log: any) => ({
        id: log.id.toString(),
        type: log.type,
        content: log.content,
        emotion: log.emotion,
        sentiment: log.sentiment,
        timestamp: new Date(log.timestamp),
      }));

      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'bot',
        content: generateGreeting(userProfile, false),
        timestamp: new Date(),
      };

      setMessages([welcomeMessage, ...loadedMessages]);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleEmotionClick = (emoji: string) => {
    setInput((prev) => prev + ` ${emoji}`);
  };

  const getIntensityEmoji = () => {
    const value = emotionIntensity[0];
    if (value < 20) return '😢';
    if (value < 40) return '😔';
    if (value < 60) return '😐';
    if (value < 80) return '🙂';
    return '😄';
  };

  const getIntensityColor = () => {
    const value = emotionIntensity[0];
    if (value < 33) return 'from-red-500 to-orange-500';
    if (value < 67) return 'from-orange-500 to-yellow-500';
    return 'from-yellow-500 to-green-500';
  };

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Chat History */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-4">
          <Button
            onClick={handleNewChat}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Your chats
            </h3>
            <div className="space-y-1">
              {conversations
                .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((convo) => (
                  <div
                    key={convo.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentConversationId === convo.id
                      ? 'bg-secondary'
                      : 'hover:bg-secondary/50'
                      }`}
                    onClick={() => handleLoadConversation(convo.id)}
                  >
                    {editingConvoId === convo.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="h-7 text-xs px-1"
                          autoFocus
                        />
                        <button onClick={(e) => handleRenameSave(convo.id, e)} className="p-1 hover:bg-green-100 rounded text-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={handleRenameCancel} className="p-1 hover:bg-red-100 rounded text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-sm truncate">{convo.title}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleRenameStart(convo, e)}
                            className="p-1 hover:bg-blue-100 rounded"
                          >
                            <Edit2 className="w-3 h-3 text-blue-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(convo.id);
                            }}
                            className="p-1 hover:bg-destructive/10 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl mb-2">Chat with Your Emotion Assistant</h1>
            <p className="text-muted-foreground">
              Share your feelings and get personalized support
            </p>
          </div>

          <div className="flex gap-6">
            {/* Chat Card */}
            <Card className="flex-1 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Emotion Chat Assistant
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-6">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'bot'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                            }`}
                        >
                          {message.type === 'bot' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <UserIcon className="w-4 h-4" />
                          )}
                        </div>

                        <div
                          className={`flex flex-col gap-1 max-w-[70%] ${message.type === 'user' ? 'items-end' : 'items-start'
                            }`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-3 ${message.type === 'bot'
                              ? 'bg-muted'
                              : 'bg-primary text-primary-foreground'
                              }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed text-base">{message.content}</p>
                          </div>

                          {/* Timestamp for all messages */}
                          <span className="text-xs text-muted-foreground px-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* ONLY SHOW EMOTION/SENTIMENT FOR USER */}
                          {message.type === "user" && message.emotion && message.sentiment && (
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Detected: {message.emotion}
                              </Badge>

                              <Badge
                                variant={
                                  message.sentiment === "Positive"
                                    ? "default"
                                    : message.sentiment === "Negative"
                                      ? "destructive"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {message.sentiment}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* INPUT AREA */}
                <div className="p-6 border-t bg-muted/30 space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {emotions.map((emotion) => (
                      <button
                        key={emotion.label}
                        onClick={() => handleEmotionClick(emotion.emoji)}
                        className="text-2xl hover:scale-125 transition-transform"
                        title={emotion.label}
                      >
                        {emotion.emoji}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">Emotion Intensity</label>
                      <span className="text-2xl">{getIntensityEmoji()}</span>
                    </div>

                    <div className="relative">
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getIntensityColor()} opacity-30`}></div>

                      <Slider
                        value={emotionIntensity}
                        onValueChange={setEmotionIntensity}
                        max={100}
                        step={1}
                        className="relative"
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>😢 Very Sad</span>
                      <span>😄 Very Happy</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type your feelings here..."
                      className="flex-1 bg-white"
                    />
                    <Button onClick={handleSend} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Collapsible */}
            {isRightPanelOpen && (
              <Card className="w-80 shadow-lg relative">
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="absolute -left-3 top-4 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors shadow-md z-10"
                  title="Close panel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <CardHeader className="bg-gradient-to-br from-secondary/20 to-primary/10">
                  <CardTitle>Emotion Tracking Tips</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4>💬 Be Honest</h4>
                    <p className="text-sm text-muted-foreground">
                      Express your true feelings without judgment. This is a safe space.
                    </p>
                  </div>

                  <div>
                    <h4>📝 Journal Daily</h4>
                    <p className="text-sm text-muted-foreground">
                      Regular check-ins help identify emotional patterns.
                    </p>
                  </div>

                  <div>
                    <h4>🎯 Use Specifics</h4>
                    <p className="text-sm text-muted-foreground">
                      Describe what triggered your emotions for deeper insights.
                    </p>
                  </div>

                  <div>
                    <h4>📊 Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Visit your dashboard to see emotional trends over time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reopen Button for Right Panel */}
            {!isRightPanelOpen && (
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md h-fit mt-16"
                title="Open tips panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

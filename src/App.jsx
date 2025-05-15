import { useEffect, useState } from "react";
import "./App.css";
import ChatMessage from "./components/ChatMessage";
import useLocalStorage from "./hooks/useLocalStorage";
import { generateGeminiResponse, generateLlamaResponse } from "./utils/api";
import sendIcon from "./assets/send-icon.svg";

function App() {
  const [prompt, setPrompt] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [chatHistory, setChatHistory] = useLocalStorage('chatbotHistory', []);
  const [currentChat, setCurrentChat] = useState([
    {
      id: Date.now(),
      content: {
        gemini: "I am a chatbot, ask me anything.",
        llama: "",
        showSingle: true
      },
      isUser: false,
    },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    // Reset textarea height before clearing prompt
    const textarea = document.querySelector('.chatbot_input textarea');
    if (textarea) {
      textarea.style.height = '56px'; // Reset to default height
    }

    setPrompt("");
    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;

    const updatedChat = [
      ...currentChat,
      { id: userMessageId, content: prompt, isUser: true },
      {
        id: botMessageId,
        content: {
          gemini: "",
          llama: "",
          showSingle: false
        },
        isUser: false,
        loading: true
      }
    ];

    setCurrentChat(updatedChat);
    setLoadingId(botMessageId);

    try {
      const [geminiResponse, llamaResponse] = await Promise.all([
        generateGeminiResponse(prompt),
        generateLlamaResponse(prompt)
      ]);

      const finalChat = updatedChat.map(item =>
        item.id === botMessageId ? {
          ...item,
          content: {
            gemini: geminiResponse,
            llama: llamaResponse,
            showSingle: false
          },
          loading: false
        } : item
      );

      setCurrentChat(finalChat);
      // This seems to be adding the entire chat history again, might want to just add new messages
      // setChatHistory(prev => [...prev, ...finalChat]);
      // A potentially better approach might be to save only the newly added user/bot pair:
       setChatHistory(prev => [...prev, { id: userMessageId, content: prompt, isUser: true }, {
          id: botMessageId,
          content: {
            gemini: geminiResponse,
            llama: llamaResponse,
            showSingle: false
          },
          isUser: false,
          loading: false
        }]);

    } catch (error) {
      const finalChat = updatedChat.map(item =>
        item.id === botMessageId ? {
          ...item,
          content: {
            gemini: "⚠️ Failed to fetch response",
            llama: "⚠️ Failed to fetch response",
            showSingle: false
          },
          loading: false
        } : item
      );
      setCurrentChat(finalChat);
       // Same comment as above regarding chat history saving
       setChatHistory(prev => [...prev, { id: userMessageId, content: prompt, isUser: true }, {
          id: botMessageId,
          content: {
            gemini: "⚠️ Failed to fetch response",
            llama: "⚠️ Failed to fetch response",
            showSingle: false
          },
          isUser: false,
          loading: false
        }]);
    }

    setLoadingId(null);
  };

  const startNewChat = () => {
    setCurrentChat([
      {
        id: Date.now(),
        content: {
          gemini: "I am a chatbot, ask me anything.",
          llama: "",
          showSingle: true
        },
        isUser: false,
      },
    ]);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const container = document.querySelector('.chatbot_response_container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [currentChat]);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? "✕" : "☰"}
      </div>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          onClick={startNewChat}
          className="new-chat-button"
          title="Start a New Chat"
        >
          💬
        </button>
      </div>

      <div className="main-content">
        <header className="header">
          <h1 className="heading">AI Chat Bot</h1>
          <div
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </div>
        </header>

        <div className="chatbot_container">
          <div className="chatbot_response_container">
            {currentChat.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                isLoading={message.id === loadingId}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>

        {/* Updated Input Section with Textarea */}
        <div className={`chatbot_input${isSidebarOpen ? ' sidebar-open' : ''}`}>
          <div className="input-row">
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Enter your question..."
            />
            <button
              className="send-pill"
              onClick={handleSubmit}
              aria-label="Send"
              style={{
                padding: 0,
                border: 'none',
              }}
            >
              <img
                src={sendIcon}
                alt="Send"
                className="send-icon"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
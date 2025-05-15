import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { SyncLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

const ChatMessage = ({ content, isUser, isLoading, isDarkMode }) => {
  const [displayedText, setDisplayedText] = useState({ gemini: "", llama: "" });
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [copiedModelIdx, setCopiedModelIdx] = useState(null);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  useEffect(() => {
    if (!isUser && !isLoading && !isTypingComplete) {
      let geminiIndex = 0;
      let llamaIndex = 0;
      const geminiText = content.gemini || "";
      const llamaText = content.llama || "";

      const geminiInterval = setInterval(() => {
        if (geminiIndex <= geminiText.length) {
          setDisplayedText(prev => ({ ...prev, gemini: geminiText.substring(0, geminiIndex) }));
          geminiIndex++;
        } else clearInterval(geminiInterval);
      }, 20);

      const llamaInterval = setInterval(() => {
        if (llamaIndex <= llamaText.length) {
          setDisplayedText(prev => ({ ...prev, llama: llamaText.substring(0, llamaIndex) }));
          llamaIndex++;
        } else {
          clearInterval(llamaInterval);
          setIsTypingComplete(true);
        }
      }, 20);

      return () => {
        clearInterval(geminiInterval);
        clearInterval(llamaInterval);
      };
    }
  }, [content, isUser, isLoading, isTypingComplete]);

  useEffect(() => {
    if (!isUser && !isLoading) {
      const container = document.querySelector('.chatbot_response_container');
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [displayedText.gemini, displayedText.llama, isUser, isLoading]);
  const handleCopyUserPrompt = () => {
    navigator.clipboard.writeText(content);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleCopyModel = (e) => {
    const container = e.currentTarget.closest('.model-response');
    if (!container) return;
    
    const clone = container.cloneNode(true);
    clone.querySelector('.model-header')?.remove();
    clone.querySelectorAll('button').forEach(btn => btn.remove());
    const text = clone.innerText;
    navigator.clipboard.writeText(text);
    
    // Visual feedback
    const tempIdx = Array.from(container.parentNode.children).indexOf(container);
    setCopiedModelIdx(tempIdx);
    setTimeout(() => setCopiedModelIdx(null), 2000);
  };

  const handleCopyCode = (e) => {
    const codeBlockId = e.currentTarget.dataset.codeId;
    const codeContainer = e.currentTarget.closest('.relative');
    const codeBlock = codeContainer?.querySelector('code');
    
    if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.textContent);
      setCopiedCodeId(codeBlockId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  if (!isUser && content.showSingle) {
    return (
      <div className={`message bot ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="message-content">{content.gemini}</div>
      </div>
    );
  }

  return (
    <div className={`message ${isUser ? "user" : "bot"} ${isDarkMode ? "dark" : "light"}`}>
      <div className="message-content">
        {isUser && (
          <div className="user-message-container">
            <motion.button
              onClick={handleCopyUserPrompt}
              initial={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              className="user-copy-button"
              aria-label="Copy user message"
            >
              <span>{content}</span>
              <span className="copy-icon">
                {copiedUser ? "✓" : "⎘"}
              </span>
            </motion.button>
          </div>
        )}

        {isLoading ? (
          <div className="dual-loading">
            <div className="model-loading">
              <SyncLoader color={isDarkMode ? "#ffffff" : "#333333"} size={8} speedMultiplier={0.8} />
              <div className="typing-text">Gemini is typing<span className="dot-animation">...</span></div>
            </div>
            <div className="model-loading">
              <SyncLoader color={isDarkMode ? "#ffffff" : "#333333"} size={8} speedMultiplier={0.8} />
              <div className="typing-text">Llama-3 is typing<span className="dot-animation">...</span></div>
            </div>
          </div>
        ) : isUser ? null : (
          <div className="dual-response">
            {[
              { label: 'Gemini Response', text: displayedText.gemini },
              { label: 'Llama-3 Response', text: displayedText.llama }
            ].map((model, idx) => (
              <div key={idx} className={`model-response ${isTypingComplete ? "" : "typing-active"}`}>
                <div className="model-header">
                  <h4>{model.label}</h4>
                  <div className="copy-button-container">
                    <motion.button
                      onClick={handleCopyModel}
                      whileTap={{ scale: 0.9 }}
                      className="model-copy-button"
                      aria-label={`Copy ${model.label}`}
                    >
                      {copiedModelIdx === idx ? "✓" : "⎘"}
                    </motion.button>
                  </div>
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children, ...props }, codeIdx) => {
                      const modelIdx = idx; // Get parent model index from map()
                      const stableId = `code-${modelIdx}-${props.node.position?.start.line || codeIdx}`;
                      
                      return (
                        <div className="relative code-block-container">
                          <button
                            onClick={handleCopyCode}
                            data-code-id={stableId}
                            className="code-copy-button"
                            aria-label="Copy code block"
                          >
                            {copiedCodeId === stableId ? "✓" : "⎘"}
                          </button>
                          <pre {...props}>{children}</pre>
                        </div>
                      );
                    }
                  }}
                >
                  {model.text}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
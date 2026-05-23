'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, ThumbsUp, ThumbsDown, Loader2, Bot, User, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
  id: string;
  feedback?: 'helpful' | 'unhelpful';
}

interface ChatInterfaceProps {
  context: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [pastIssues, setPastIssues] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load past issues from local storage
    const stored = localStorage.getItem('neuron7_past_issues');
    if (stored) setPastIssues(JSON.parse(stored).slice(0, 3));
    
    // Load chat history
    const history = localStorage.getItem('neuron7_chat_history');
    if (history) {
      const parsed = JSON.parse(history);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      localStorage.setItem('neuron7_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      image: image || undefined,
      timestamp: new Date(),
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setIsLoading(true);

    // Save to past issues if it's a new unique query
    if (input.trim() && !pastIssues.includes(input.trim())) {
      const newPast = [input.trim(), ...pastIssues].slice(0, 5);
      setPastIssues(newPast);
      localStorage.setItem('neuron7_past_issues', JSON.stringify(newPast));
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map(m => ({ role: m.role, content: m.content })),
          context,
          image: userMessage.image,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        id: (Date.now() + 1).toString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      const decoder = new TextEncoder().encode(); // Wait, TextDecoder
      const textDecoder = new TextDecoder();
      
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = textDecoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: accumulatedContent }];
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (id: string, type: 'helpful' | 'unhelpful') => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, feedback: type } : m));
    // In a real app, send to backend
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">N7</div>
          <div>
            <h1 className="text-slate-900 font-bold text-lg leading-tight">Neuron7 Assist</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Field Intelligence System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[11px] font-medium text-green-700 uppercase tracking-wider">Expert Online</span>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
              <Bot className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Ready to assist, Engineer</h3>
            <p className="text-slate-500 text-sm">
              Describe the issue you're facing or upload a photo of the device's control panel. I'll provide a step-by-step resolution based on senior expertise.
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-4xl",
              message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              message.role === 'assistant' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {message.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            
            <div className={cn(
              "flex flex-col gap-2 max-w-[85%]",
              message.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "p-4 rounded-2xl shadow-sm border",
                message.role === 'assistant' 
                  ? "bg-white border-slate-100 text-slate-800" 
                  : "bg-indigo-600 border-indigo-500 text-white"
              )}>
                {message.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                    <img src={message.image} alt="Uploaded issue" className="max-w-full h-auto max-h-64 object-cover" />
                  </div>
                )}
                <div className={cn(
                  "prose prose-sm max-w-none prose-slate",
                  message.role === 'user' ? "prose-invert" : ""
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleFeedback(message.id, 'helpful')}
                      className={cn(
                        "p-1 rounded hover:bg-slate-50 transition-colors",
                        message.feedback === 'helpful' ? "text-green-600" : "text-slate-300"
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleFeedback(message.id, 'unhelpful')}
                      className={cn(
                        "p-1 rounded hover:bg-slate-50 transition-colors",
                        message.feedback === 'unhelpful' ? "text-red-600" : "text-slate-300"
                      )}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex gap-4 mr-auto">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        {pastIssues.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 w-full mb-1">
              <Clock className="w-3 h-3" /> Similar Past Issues
            </span>
            {pastIssues.map((issue, i) => (
              <button
                key={i}
                onClick={() => setInput(issue)}
                className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left truncate max-w-[200px]"
              >
                {issue}
              </button>
            ))}
          </div>
        )}

        <div className="relative group">
          <AnimatePresence>
            {image && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-full left-0 mb-4 p-2 bg-white rounded-xl shadow-xl border border-slate-200"
              >
                <div className="relative group">
                  <img src={image} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
              title="Upload Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe the issue or ask for guidance..."
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none py-2.5 max-h-32 text-sm"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !image) || isLoading}
              className={cn(
                "p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center",
                (!input.trim() && !image) || isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              )}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

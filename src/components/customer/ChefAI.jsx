import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, ChefHat, Sparkles } from 'lucide-react';
import api from '../../config/api';

const ChefAI = ({ restaurant, externalOpen, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (externalOpen !== undefined) {
            setIsOpen(externalOpen);
        }
    }, [externalOpen]);

    const toggleOpen = () => {
        if (isOpen && onClose) {
            onClose();
        }
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [history, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = { role: 'user', content: message };
        setHistory(prev => [...prev, userMsg]);
        setMessage('');
        setIsLoading(true);

        try {
            const res = await api.post('/ai/chat', {
                message,
                history: history.slice(-6), // Keep last few messages for context
                restaurantId: restaurant._id
            });

            if (res.data.success) {
                setHistory(prev => [...prev, { role: 'chef', content: res.data.data }]);
            }
        } catch (error) {
            console.error('Chef AI Error:', error);
            const isPremiumError = error.response?.status === 403 || error.response?.data?.premiumRequired;

            setHistory(prev => [...prev, {
                role: 'chef',
                content: isPremiumError
                    ? "I'm sorry! This AI Digital Assistant is a Premium feature. Please upgrade your restaurant's plan to enable my services for your customers."
                    : "I'm sorry, I'm having a little trouble connecting to my kitchen brain right now. Please try asking again in a moment!"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedPrompts = [
        "What's the best seller?",
        "Any gluten-free options?",
        "Tell me about your specialties",
        "What are the store hours?"
    ];

    return (
        <div className="fixed bottom-24 right-6 z-50 pointer-events-none">
            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-[85vw] sm:w-[400px] h-[500px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <ChefHat size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white leading-tight">Chef AI</h3>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Digital Assistant</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleOpen}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {history.length === 0 && (
                                <div className="text-center space-y-4 py-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/30">
                                        <Bot size={32} />
                                    </div>
                                    <h4 className="font-bold text-white">Ask me anything!</h4>
                                    <p className="text-xs text-white/50 px-8">
                                        I can help you find your new favorite dish or answer questions about our menu.
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                                        {suggestedPrompts.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setMessage(prompt)}
                                                className="text-[10px] font-medium bg-white/5 hover:bg-white/10 text-white/70 py-1.5 px-3 rounded-full border border-white/5 transition-colors text-left"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {history.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={cn(
                                        "flex",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] p-4 text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-primary text-black rounded-2xl rounded-tr-none font-medium"
                                                : "bg-white/5 text-white/90 rounded-2xl rounded-tl-none border border-white/5"
                                        )}
                                    >
                                        {msg.content.split('\n').map((line, j) => (
                                            <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                        <div className="flex gap-1">
                                            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary"></motion.div>
                                            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary"></motion.div>
                                            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary"></motion.div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-6 bg-black border-t border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Ask about the menu..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper function for conditional classes
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default ChefAI;

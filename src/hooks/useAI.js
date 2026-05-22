import { useState, useRef } from 'react';
import { chat } from '../api/ai';

export default function useAI() {
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', text}
  const [loading, setLoading] = useState(false);
  const controllerRef = useRef(null);

  const send = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const { answer } = await chat(text, messages.slice(-6));
      // Simulate streaming: reveal text progressively
      let revealed = '';
      const assistantMsg = { role: 'assistant', text: '' };
      setMessages(prev => [...prev, assistantMsg]);
      for (let i = 0; i < answer.length; i++) {
        revealed += answer[i];
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', text: revealed };
          return copy;
        });
        // small delay to simulate typing
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 12 + Math.min(30, Math.floor(Math.random()*18))));
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setMessages([]);

  return { messages, loading, send, reset };
}

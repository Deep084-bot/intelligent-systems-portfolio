import { useState, useRef, useCallback } from 'react';
import { chat } from '../api/ai';
import { getPortfolioContext } from '../context/portfolioContext';

const TYPING_CHUNK_SIZE = 5;
const TYPING_INTERVAL_MS = 40;
const DEBOUNCE_MS = 500;

export default function useAI() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesRef = useRef([]);
  const abortRef = useRef(null);
  const cancelledRef = useRef(false);
  const sendingRef = useRef(false);
  const debounceRef = useRef(null);

  const updateMessages = useCallback((fn) => {
    setMessages((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      messagesRef.current = next;
      return next;
    });
  }, []);

  const send = useCallback(async (text, options = {}) => {
    const { silent = false } = options;
    if (!text.trim()) return;

    if (sendingRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    await new Promise(resolve => {
      debounceRef.current = setTimeout(resolve, DEBOUNCE_MS);
    });
    debounceRef.current = null;

    if (sendingRef.current) return;
    if (cancelledRef.current) return;

    sendingRef.current = true;
    cancelledRef.current = false;
    setError(null);

    if (!silent) {
      const userMsg = { role: 'user', text };
      updateMessages((prev) => [...prev, userMsg]);
    }
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = messagesRef.current
        .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.text))
        .slice(-6);

      // Get portfolio context for system prompt
      const portfolioContext = getPortfolioContext();

      const { answer } = await chat(text, history, controller.signal, {
        systemPrompt: portfolioContext.systemPrompt,
        education: portfolioContext.education,
        projects: portfolioContext.projects,
        skills: portfolioContext.skills,
      });

      if (cancelledRef.current) return;

      if (!answer || !answer.trim()) {
        updateMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'I received your question but generated an empty response. Please try rephrasing.' },
        ]);
        return;
      }

      const assistantMsg = { role: 'assistant', text: '' };
      updateMessages((prev) => [...prev, assistantMsg]);

      let revealed = '';
      let chunkIndex = 0;

      const typeNextChunk = () => {
        if (cancelledRef.current) return;

        const end = Math.min(chunkIndex + TYPING_CHUNK_SIZE, answer.length);
        revealed = answer.slice(0, end);

        updateMessages((prev) => {
          const copy = [...prev];
          if (copy.length > 0) {
            copy[copy.length - 1] = { role: 'assistant', text: revealed };
          }
          return copy;
        });

        chunkIndex = end;

        if (chunkIndex < answer.length) {
          setTimeout(typeNextChunk, TYPING_INTERVAL_MS + Math.random() * 20);
        }
      };

      typeNextChunk();
    } catch (err) {
      if (cancelledRef.current) return;

      const status = err.status || err.statusCode || 0;

      if (err.name === 'AbortError' || status === 0) {
        updateMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Request timed out. The AI service may be slow — please try again.' },
        ]);
      } else if (err.unavailable || status === 503 || status === 502) {
        updateMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'AI assistant is temporarily unavailable. Please try again in a moment.' },
        ]);
      } else if (status === 429) {
        updateMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'AI service is busy right now. Please wait a moment and try again.' },
        ]);
      } else {
        const msg = err.message || 'Unknown error';
        updateMessages((prev) => [
          ...prev,
          { role: 'assistant', text: msg },
        ]);
      }
    } finally {
      setLoading(false);
      sendingRef.current = false;
      abortRef.current = null;
    }
  }, [updateMessages]);

  const reset = useCallback(() => {
    // Cancel any in-flight work and clear UI state, but preserve refs so future requests work
    cancelledRef.current = true;
    sendingRef.current = false;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) { /* ignore */ }
      abortRef.current = null;
    }
    setError(null);
    setLoading(false);
    setMessages([]);
    messagesRef.current = [];

    // Allow new requests shortly after cancellation completes
    setTimeout(() => { cancelledRef.current = false; sendingRef.current = false; }, 50);
  }, []);

  const retry = useCallback(() => {
    if (sendingRef.current || loading) return;

    const msgs = messagesRef.current;
    const lastUserIdx = msgs.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();

    if (lastUserIdx === undefined) return;

    const lastUserText = msgs[lastUserIdx].text;

    updateMessages((prev) => {
      const lastUserIdxLocal = prev.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();
      if (lastUserIdxLocal === undefined) return prev;
      return prev.slice(0, lastUserIdxLocal + 1);
    });

    // ensure retry uses latest stable history
    setTimeout(() => send(lastUserText, { silent: true }), 50);
  }, [loading, send, updateMessages]);

  return { messages, loading, error, send, reset, retry };
}

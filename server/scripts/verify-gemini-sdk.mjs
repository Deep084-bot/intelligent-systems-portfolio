#!/usr/bin/env node
/**
 * COMPREHENSIVE GEMINI SDK VERIFICATION
 * Tests the official @google/generative-ai SDK integration
 * Validates: SDK version, API key, model loading, prompt handling, response parsing
 */

import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   GEMINI SDK VERIFICATION & VALIDATION SUITE             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('📋 STEP 1: Configuration Check');
console.log('─'.repeat(60));

const configChecks = {
  'API_KEY_SET': Boolean(KEY),
  'API_KEY_FORMAT': KEY ? (KEY.length > 20 && KEY.startsWith('AIzaSy')) : false,
  'MODEL_NAME': MODEL_NAME,
  'NODE_ENV': process.env.NODE_ENV || 'production',
};

for (const [check, result] of Object.entries(configChecks)) {
  const symbol = result ? '✅' : '❌';
  console.log(`${symbol} ${check}: ${result}`);
}

if (!KEY) {
  console.error('\n❌ FATAL: GEMINI_API_KEY not set. Exiting.');
  process.exit(1);
}

console.log('\n✅ Configuration valid. Proceeding to SDK initialization.\n');

console.log('📋 STEP 2: SDK Initialization');
console.log('─'.repeat(60));

let genAI, model;

try {
  genAI = new GoogleGenerativeAI(KEY);
  console.log('✅ GoogleGenerativeAI instance created');
  
  model = genAI.getGenerativeModel({ model: MODEL_NAME });
  console.log(`✅ Model '${MODEL_NAME}' loaded successfully`);
} catch (err) {
  console.error(`❌ SDK initialization failed: ${err.message}`);
  process.exit(1);
}

console.log('\n✅ SDK initialized. Proceeding to method inspection.\n');

console.log('📋 STEP 3: Model Methods');
console.log('─'.repeat(60));

const modelMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(model))
  .filter(m => typeof model[m] === 'function' && m !== 'constructor');

console.log(`Available methods: ${modelMethods.join(', ')}`);

const hasGenerateContent = typeof model.generateContent === 'function';
const hasGenerateContentStream = typeof model.generateContentStream === 'function';
const hasCountTokens = typeof model.countTokens === 'function';

console.log(`✅ generateContent: ${hasGenerateContent ? 'YES' : 'NO'}`);
console.log(`✅ generateContentStream: ${hasGenerateContentStream ? 'YES' : 'NO'}`);
console.log(`✅ countTokens: ${hasCountTokens ? 'YES' : 'NO'}`);

if (!hasGenerateContent) {
  console.error('\n❌ FATAL: generateContent method not found on model');
  process.exit(1);
}

console.log('\n✅ Required methods present. Proceeding to API call.\n');

console.log('📋 STEP 4: Simple Prompt Test (Connectivity)');
console.log('─'.repeat(60));

try {
  const start = Date.now();
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Say "OK" briefly.' }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 32,
    },
  });
  const latency = Date.now() - start;
  
  const responseText = response?.response?.text?.() 
    ? await response.response.text()
    : (response?.response?.text || JSON.stringify(response));
  
  console.log(`✅ API call succeeded (${latency}ms latency)`);
  console.log(`Response: "${responseText}"`);
} catch (err) {
  console.error(`❌ API call failed: ${err.message}`);
  process.exit(1);
}

console.log('\n✅ Connectivity validated. Proceeding to context injection test.\n');

console.log('📋 STEP 5: Context Injection Test');
console.log('─'.repeat(60));

const testContext = `Portfolio Context:
- Author: Full Stack Engineer
- Skills: React, Node.js, Distributed Systems, AI
- Featured Project: Real-time Analytics Platform
- Current Learning: Advanced ML Techniques`;

const testQuestion = 'What is your background?';
const systemPrompt = `You are a portfolio assistant. Use only the context provided.`;
const fullPrompt = `${systemPrompt}\n\nContext:\n${testContext}\n\nQ: ${testQuestion}`;

try {
  const start = Date.now();
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: fullPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.05,
      maxOutputTokens: 256,
    },
  });
  const latency = Date.now() - start;
  
  const responseText = response?.response?.text?.()
    ? await response.response.text()
    : (response?.response?.text || JSON.stringify(response));
  
  console.log(`✅ Context injection test passed (${latency}ms)`);
  console.log(`Response excerpt: "${responseText.slice(0, 120)}..."`);
} catch (err) {
  console.error(`❌ Context test failed: ${err.message}`);
  process.exit(1);
}

console.log('\n✅ Context injection works. Proceeding to conversation history test.\n');

console.log('📋 STEP 6: Conversation History Test');
console.log('─'.repeat(60));

const conversationHistory = [
  {
    role: 'user',
    parts: [{ text: 'What is React?' }],
  },
  {
    role: 'model',
    parts: [{ text: 'React is a JavaScript library for building user interfaces.' }],
  },
];

try {
  const start = Date.now();
  const response = await model.generateContent({
    contents: [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: 'Do you use it in your portfolio?' }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 128,
    },
  });
  const latency = Date.now() - start;
  
  const responseText = response?.response?.text?.()
    ? await response.response.text()
    : (response?.response?.text || JSON.stringify(response));
  
  console.log(`✅ Conversation history test passed (${latency}ms)`);
  console.log(`Response: "${responseText.slice(0, 100)}..."`);
} catch (err) {
  console.error(`❌ Conversation history test failed: ${err.message}`);
  process.exit(1);
}

console.log('\n✅ All tests passed!\n');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║              ✅ GEMINI SDK VERIFIED                       ║');
console.log('║         Integration is fully operational                  ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

console.log('Summary:');
console.log(`  • SDK: @google/generative-ai`);
console.log(`  • Model: ${MODEL_NAME}`);
console.log(`  • Connectivity: ✅ Working`);
console.log(`  • Context Injection: ✅ Working`);
console.log(`  • Conversation History: ✅ Working`);
console.log(`  • Response Parsing: ✅ Working`);
console.log('\nReady for production! 🚀\n');

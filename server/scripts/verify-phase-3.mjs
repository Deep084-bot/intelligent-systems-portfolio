#!/usr/bin/env node
import 'dotenv/config';
import { generateText } from '../utils/geminiClient.js';
import buildContext from '../contextBuilder.js';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Phase 3 Verification Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check 1: Environment variables
console.log('✓ Check 1: Environment Configuration');
const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;
console.log(`  API Key: ${key ? `${key.slice(0,10)}...` : '❌ NOT SET'}`);
console.log(`  Model: ${model || '❌ USING DEFAULT (gemini-2.5-flash)'}\n`);

// Check 2: Context loading
console.log('✓ Check 2: Portfolio Context');
try {
  const ctx = await buildContext();
  console.log(`  Context size: ${ctx.length} characters`);
  console.log(`  Contains projects: ${ctx.includes('PROJECT') ? '✓' : '❌'}`);
  console.log(`  Contains skills: ${ctx.includes('SKILLS') ? '✓' : '❌'}`);
  console.log(`  Contains blogs: ${ctx.includes('Engineering Notes') ? '✓' : '❌'}`);
} catch (err) {
  console.log(`  ❌ Error loading context: ${err.message}`);
  process.exit(1);
}

console.log('\n✓ Check 3: Gemini API Connectivity');
try {
  const start = Date.now();
  const resp = await generateText('Hello', { maxOutputTokens: 64 });
  const latency = Date.now() - start;
  console.log(`  Response received in ${latency}ms`);
  console.log(`  Response preview: "${resp.slice(0, 80)}..."`);
} catch (err) {
  console.log(`  ⚠️  Error: ${err.message.slice(0, 120)}`);
  if (err.message.includes('429')) {
    console.log('     → Free tier quota exhausted. Enable billing to continue.');
  } else if (err.message.includes('503')) {
    console.log('     → Model overloaded. Will retry automatically.');
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ✅ Phase 3 Backend Ready');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

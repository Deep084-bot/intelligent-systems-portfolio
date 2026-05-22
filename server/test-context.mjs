import buildContext from './contextBuilder.js';

console.log('Building context...');
const ctx = await buildContext();
console.log(`Context length: ${ctx.length} characters`);
console.log('Context preview:');
console.log(ctx.slice(0, 500));

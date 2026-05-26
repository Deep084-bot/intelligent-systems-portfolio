import buildContext from './contextBuilder.js';

const categories = ['backend/project/system','dsa/problem-solving','learning/ai/system-design','contact/personal','general'];
for (const c of categories) {
  console.log('\n--- category:', c, '---');
  const ctx = await buildContext({ category: c });
  console.log(`Context length: ${ctx.length} characters`);
  console.log('Preview:');
  console.log(ctx.slice(0, 400));
}

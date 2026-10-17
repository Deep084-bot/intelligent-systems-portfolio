export const DIMENSIONS = [
  { id: 'quality', label: 'Output Quality' },
  { id: 'safety', label: 'Safety' },
  { id: 'cost', label: 'Cost Efficiency' },
  { id: 'latency', label: 'Latency' },
  { id: 'evolvability', label: 'Evolvability' },
]

export const SCENARIOS = [
  {
    id: 'ai-assistant',
    title: 'Ship an AI assistant',
    tag: 'LLM',
    difficulty: 'Advanced',
    summary: 'Design the system behind an AI assistant that answers questions about a company’s own documentation. Each decision adds a component to the architecture.',
    brief: {
      goals: ['Answer accurately from internal docs', 'Never leak data or produce unsafe output', 'Control cost as usage grows'],
      constraints: ['Documents change every week', 'Legal will not accept unsourced answers', 'Usage will spike unpredictably'],
    },
    decisions: [
      {
        id: 'grounding',
        question: 'How does the model know about the company’s docs?',
        framing: 'The model was never trained on these documents. Choose how knowledge reaches the answer.',
        choices: [
          { id: 'rag', label: 'Retrieval-augmented (RAG)', subtitle: 'retrieve → prompt', summary: 'Fetch relevant passages and put them in the prompt.', dims: { quality: 4, safety: 3, cost: 1, evolvability: 3 }, contract: ['Retrieval: vector search over the document index', 'Context: top-k passages injected into the prompt'], feedback: 'RAG keeps knowledge fresh — update the index, not the model — and citations come for free, which legal will want.' },
          { id: 'finetune', label: 'Fine-tune on the docs', subtitle: 'bake knowledge into weights', summary: 'Train the model on the corpus.', dims: { quality: 2, cost: -2, evolvability: -3, safety: -1 }, contract: ['Knowledge: fine-tuned into model weights'], feedback: 'Fine-tuning embeds stale knowledge and is expensive to refresh every week. It cannot cite sources.' },
          { id: 'prompt', label: 'Just prompt it harder', subtitle: 'no retrieval', summary: 'Ask the base model and hope.', dims: { quality: -4, safety: -3, cost: 1, evolvability: 1 }, contract: ['Knowledge: none (model’s own parameters)'], feedback: 'Without retrieval the model will confidently invent answers about private docs it has never seen.' },
        ],
      },
      {
        id: 'citations',
        question: 'How are answers backed by evidence?',
        framing: 'Legal needs every claim traceable to a source.',
        choices: [
          { id: 'cite', label: 'Inline citations', subtitle: '[doc #, passage]', summary: 'Every claim links to the passage used.', dims: { quality: 3, safety: 3, evolvability: 1 }, contract: ['Output: inline citations to retrieved passages'], feedback: 'Citations make hallucination visible and let a reviewer verify the answer in seconds.' },
          { id: 'summary', label: 'Answer with a “sources” list', subtitle: 'dumped at the end', summary: 'List docs but not which claim.', dims: { quality: 1, safety: 1 }, contract: ['Output: trailing source list'], feedback: 'A trailing list is better than nothing but does not tell the reader which passage supports which claim.' },
          { id: 'none', label: 'No citations', subtitle: 'trust the prose', summary: 'Plain answer.', dims: { quality: -3, safety: -3 }, contract: ['Output: uncited prose'], feedback: 'Uncited answers are impossible to audit — the exact failure legal is worried about.' },
        ],
      },
      {
        id: 'guardrails',
        question: 'How do you prevent unsafe input and output?',
        framing: 'Users will try to make it misbehave, and the model can leak data in its response.',
        choices: [
          { id: 'gated', label: 'Input + output checks', subtitle: 'moderate both directions', summary: 'Screen prompts and responses, redact PII.', dims: { safety: 4, quality: 1, cost: -1 }, contract: ['Guardrails: input moderation, output filtering, PII redaction'], feedback: 'Checking both directions catches prompt injection on the way in and data leakage on the way out.' },
          { id: 'system', label: 'System prompt only', subtitle: '“be safe”', summary: 'Rely on instructions.', dims: { safety: 1, cost: 1 }, contract: ['Guardrails: system-prompt instructions only'], feedback: 'Instructions are easy to talk a model out of. They are a preference, not a control.' },
          { id: 'none', label: 'None', subtitle: 'ship it', summary: 'No runtime checks.', dims: { safety: -4, cost: 1 }, contract: ['Guardrails: none'], feedback: 'No guardrails means one creative prompt can exfiltrate data or produce policy-breaking output in production.' },
        ],
      },
      {
        id: 'evaluation',
        question: 'How do you know the answers are good?',
        framing: 'You cannot improve what you cannot measure, and “it looked fine” is not a metric.',
        choices: [
          { id: 'evalset', label: 'Curated eval set', subtitle: 'graded on every change', summary: 'A golden set with expected answers, run in CI.', dims: { quality: 4, safety: 2, evolvability: 2 }, contract: ['Evaluation: golden set run on every prompt/model change'], feedback: 'A versioned eval set turns prompt changes into measurable regressions instead of guesswork.' },
          { id: 'modeljudge', label: 'LLM-as-judge', subtitle: 'auto-scored', summary: 'A model grades the answers.', dims: { quality: 2, cost: -1, evolvability: 1 }, contract: ['Evaluation: automated LLM judging'], feedback: 'An LLM judge scales well but is noisy — useful as a second signal, not the only one.' },
          { id: 'vibes', label: 'Manual spot checks', subtitle: '“feels right”', summary: 'Try it a few times.', dims: { quality: -3, evolvability: -2 }, contract: ['Evaluation: ad-hoc manual testing'], feedback: 'Spot checks miss rare regressions. Without a repeatable set you will ship quality down without noticing.' },
        ],
      },
      {
        id: 'rollout',
        question: 'How do you release a change to the assistant?',
        framing: 'Model and prompt updates can change behavior. Rollout decides who feels a bad one.',
        choices: [
          { id: 'canary', label: 'Canary + quality gate', subtitle: '1% → 100%', summary: 'Ramp with automatic rollback.', dims: { quality: 3, safety: 2, cost: 1 }, contract: ['Release: canary rollout with a metric gate and rollback'], feedback: 'A canary catches a regression on 1% of traffic and rolls back before it reaches everyone.' },
          { id: 'ab', label: 'A/B test', subtitle: 'split traffic', summary: 'Compare two versions.', dims: { quality: 2, evolvability: 1 }, contract: ['Release: A/B comparison'], feedback: 'A/B testing is great for measuring effect, but only if you already have an eval you trust.' },
          { id: 'bigbang', label: 'Big-bang deploy', subtitle: 'everyone at once', summary: 'Flip it for all users.', dims: { quality: -3, safety: -2 }, contract: ['Release: immediate full rollout'], feedback: 'A bad prompt change hits every user simultaneously with no early warning.' },
        ],
      },
    ],
    reference: {
      preferredIds: ['rag', 'cite', 'gated', 'evalset', 'canary'],
      narrative: 'I would ground the assistant with retrieval over a live document index, return inline citations, and wrap the whole thing with input and output guardrails. Quality is kept honest with a curated eval set run on every change, and every update ships behind a canary with an automatic gate. The recurring theme is that an AI system is a system: the model is one part, and the parts around it — retrieval, guardrails, evaluation, rollout — are what make it trustworthy in production.',
      lessons: [
        'Retrieval keeps knowledge fresh and makes citations possible.',
        'Check both the prompt going in and the answer coming out.',
        'An eval set turns prompt edits from vibes into measurements.',
        'Ship AI changes like code: canary, gate, rollback.',
      ],
    },
  },
  {
    id: 'support-automation',
    title: 'Automate first-line support',
    tag: 'Product',
    difficulty: 'Intermediate',
    summary: 'Design an AI layer that drafts replies to support tickets. Balance deflection, customer trust, and agent workload.',
    brief: {
      goals: ['Deflect routine tickets', 'Never send an unverified reply to a customer', 'Learn from agent corrections'],
      constraints: ['Angry customers are common here', 'Brand voice matters', 'The team is small'],
    },
    decisions: [
      {
        id: 'scope',
        question: 'What is the AI allowed to do?',
        framing: 'Automation can assist or act. The scope decides how much damage a mistake can do.',
        choices: [
          { id: 'draft', label: 'Draft for agents', subtitle: 'human sends', summary: 'AI drafts, a person approves.', dims: { safety: 4, quality: 3, cost: -1 }, contract: ['Autonomy: draft-only, human-in-the-loop'], feedback: 'Drafting keeps a human accountable for every customer-facing word while still removing most of the typing.' },
          { id: 'auto-easy', label: 'Auto-send easy tickets', subtitle: 'route by confidence', summary: 'Send automatically above a confidence bar.', dims: { cost: 2, quality: 1, safety: -2 }, contract: ['Autonomy: auto-send high-confidence tickets'], feedback: 'Confidence is not correctness. Auto-sending without a fallback sends confident mistakes to customers.' },
          { id: 'full', label: 'Fully autonomous', subtitle: 'no human', summary: 'AI handles everything.', dims: { cost: 3, safety: -4, quality: -2 }, contract: ['Autonomy: fully autonomous replies'], feedback: 'Full autonomy in a support channel with angry customers is how a small incident becomes a public one.' },
        ],
      },
      {
        id: 'tone',
        question: 'How does the AI sound?',
        framing: 'In support, tone is the product. Prevention of escalation depends on it.',
        choices: [
          { id: 'guided', label: 'Guided by examples', subtitle: 'style guide in prompt', summary: 'Few-shot with brand voice examples.', dims: { quality: 3, safety: 1, evolvability: 2 }, contract: ['Voice: brand style guide + few-shot examples'], feedback: 'Showing the model real examples of the brand voice is the cheapest, most reliable way to keep tone consistent.' },
          { id: 'templated', label: 'Rigid templates', subtitle: 'fill in the blanks', summary: 'Fixed structure.', dims: { quality: -1, safety: 2, evolvability: -1 }, contract: ['Voice: fixed templates'], feedback: 'Templates are predictable but read as robotic, which can increase escalation on sensitive tickets.' },
          { id: 'raw', label: 'No guidance', subtitle: 'model’s default voice', summary: 'Whatever it wants.', dims: { quality: -3, safety: -2 }, contract: ['Voice: uncontrolled'], feedback: 'An uncontrolled voice drifts from the brand and can sound dismissive on exactly the tickets that need care.' },
        ],
      },
      {
        id: 'feedback',
        question: 'How does the system get better over time?',
        framing: 'Agents will edit the drafts. That signal is valuable — if you capture it.',
        choices: [
          { id: 'capture', label: 'Capture agent edits', subtitle: 'draft → final diff', summary: 'Store edits as training/eval signal.', dims: { quality: 3, evolvability: 3 }, contract: ['Learning: log draft-to-final diffs as feedback'], feedback: 'Every agent edit is a labelled example. Capturing the diff turns daily work into a improving eval set.' },
          { id: 'thumbs', label: 'Thumbs up/down', subtitle: 'binary rating', summary: 'Agents rate drafts.', dims: { quality: 1, evolvability: 1, cost: 1 }, contract: ['Learning: binary thumbs ratings'], feedback: 'Ratings are cheap but shallow — they tell you a draft was bad, not how to fix it.' },
          { id: 'nothing', label: 'Nothing', subtitle: 'static', summary: 'No feedback loop.', dims: { quality: -3, evolvability: -3 }, contract: ['Learning: none'], feedback: 'Without a feedback loop the model never learns the brand’s edge cases and stays forever mediocre.' },
        ],
      },
      {
        id: 'escalation',
        question: 'When should the AI hand off to a human?',
        framing: 'Knowing when to stop is a safety feature.',
        choices: [
          { id: 'signals', label: 'Escalate on signals', subtitle: 'sentiment, keywords, low confidence', summary: 'Route risky tickets to people.', dims: { safety: 4, quality: 2 }, contract: ['Escalation: sentiment + intent + confidence triggers'], feedback: 'Explicit escalation triggers catch the tickets where a wrong answer does real harm before they reach the customer.' },
          { id: 'ask', label: 'Agent can request', subtitle: 'manual handoff', summary: 'Human pulls it over.', dims: { safety: 1, quality: 1 }, contract: ['Escalation: on agent request'], feedback: 'Manual handoff helps only when the agent notices — the hardest tickets are the ones that look fine.' },
          { id: 'never', label: 'Never escalates', subtitle: 'AI decides', summary: 'No handoff path.', dims: { safety: -4 }, contract: ['Escalation: none'], feedback: 'With no handoff, the most sensitive tickets get the least human attention — backwards.' },
        ],
      },
    ],
    reference: {
      preferredIds: ['draft', 'guided', 'capture', 'signals'],
      narrative: 'I would keep a human in the loop: the AI drafts, an agent sends. Voice is anchored with real style examples, escalation fires on sentiment and confidence signals, and every agent edit is captured so the system learns the brand’s edge cases day by day. Automation here is about removing toil, not removing people — the moment it removes accountability on sensitive tickets, it has gone too far.',
      lessons: [
        'Keep a human accountable for anything a customer reads.',
        'Brand voice is best taught with examples, not adjectives.',
        'Capture edits — they are free labelled data.',
        'Escalation rules are a safety feature, not an afterthought.',
      ],
    },
  },
]

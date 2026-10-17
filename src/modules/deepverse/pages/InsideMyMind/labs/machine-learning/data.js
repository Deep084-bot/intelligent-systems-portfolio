export const DIMENSIONS = [
  { id: 'dataQuality', label: 'Data Quality' },
  { id: 'correctness', label: 'Methodology' },
  { id: 'reproducibility', label: 'Reproducibility' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'monitoring', label: 'Monitoring' },
]

export const SCENARIOS = [
  {
    id: 'churn-pipeline',
    title: 'A churn prediction pipeline',
    tag: 'Tabular ML',
    difficulty: 'Intermediate',
    summary: 'The stages of an ML pipeline are on the board in the wrong order. Put them in the order a careful engineer would run them — and remove the one step that should never be there.',
    brief: {
      goals: ['Produce a model that generalizes', 'Make the pipeline reproducible', 'Catch problems before production'],
      constraints: ['One stage on the board is an anti-pattern', 'The team will re-run this often', 'Features leak easily from bad ordering'],
    },
    stages: [
      { id: 'label', label: 'Define the prediction target and label the data', dim: 'dataQuality', order: 1, why: 'You cannot collect or clean toward a goal you have not defined.' },
      { id: 'collect', label: 'Collect the raw historical data', dim: 'dataQuality', order: 2, why: 'Gather the raw inputs before any transformation.' },
      { id: 'clean', label: 'Clean, validate and deduplicate records', dim: 'dataQuality', order: 3, why: 'Fix bad rows before they contaminate training.' },
      { id: 'split', label: 'Split into train / validation / test', dim: 'correctness', order: 4, why: 'You must split before fitting anything, or transforms leak the test set.' },
      { id: 'transform', label: 'Fit feature transforms on the training split only', dim: 'correctness', order: 5, why: 'Scalers and encoders must learn from train data only.' },
      { id: 'train', label: 'Train the model on the training split', dim: 'correctness', order: 6, why: 'Now, and only now, fit the model.' },
      { id: 'validate', label: 'Evaluate on the validation set and tune', dim: 'correctness', order: 7, why: 'Tune against validation, never the test set.' },
      { id: 'register', label: 'Version and register the model and its data', dim: 'reproducibility', order: 8, why: 'A model you cannot reproduce is a model you cannot trust.' },
      { id: 'serve', label: 'Roll out behind a shadow deployment', dim: 'deployment', order: 9, why: 'Watch real predictions without affecting users first.' },
      { id: 'monitor', label: 'Monitor input drift and live metrics', dim: 'monitoring', order: 10, why: 'The world changes; a shipped model is not a finished model.' },
      { id: 'trap', label: 'Tune hyperparameters against the test set until the score improves', dim: 'correctness', trap: true, why: 'Repeatedly fitting to the test set is leakage. It inflates the score and destroys your only honest estimate of real performance.' },
    ],
  },
  {
    id: 'recsys-pipeline',
    title: 'A recommendation model refresh',
    tag: 'Recommenders',
    difficulty: 'Advanced',
    summary: 'Order the stages of a recommender training run. As before, one step belongs in the bin, not the pipeline.',
    brief: {
      goals: ['Train on fresh interactions', 'Evaluate beyond offline accuracy', 'Deploy without surprising users'],
      constraints: ['User behavior is non-stationary', 'Offline metrics often mislead', 'One stage is a classic mistake'],
    },
    stages: [
      { id: 'define', label: 'Define the objective and the offline metric', dim: 'dataQuality', order: 1, why: 'Decide what “good” means before touching data.' },
      { id: 'gather', label: 'Assemble interaction logs into training examples', dim: 'dataQuality', order: 2, why: 'Build examples from real interactions.' },
      { id: 'filter', label: 'Remove bots, duplicates and corrupted events', dim: 'dataQuality', order: 3, why: 'Garbage interactions teach garbage preferences.' },
      { id: 'temporal', label: 'Split by time — train past, evaluate future', dim: 'correctness', order: 4, why: 'Recommenders must be tested on the future, not a random split.' },
      { id: 'negatives', label: 'Sample negatives for ranking training', dim: 'correctness', order: 5, why: 'Ranking models need negatives; sample them carefully.' },
      { id: 'train', label: 'Train the ranking model', dim: 'correctness', order: 6, why: 'Fit after the data is framed correctly.' },
      { id: 'offline', label: 'Evaluate offline, then plan an online A/B test', dim: 'correctness', order: 7, why: 'Offline accuracy is a filter, the A/B test is the verdict.' },
      { id: 'deploy', label: 'Shadow, then ramp the new model', dim: 'deployment', order: 8, why: 'Validate on live traffic with a safety valve.' },
      { id: 'drift', label: 'Track engagement and drift as behavior shifts', dim: 'monitoring', order: 9, why: 'Preferences move; keep measuring after launch.' },
      { id: 'trap', label: 'Randomly shuffle all rows and split 80/20 regardless of time', dim: 'correctness', trap: true, why: 'A random split on time-ordered interactions leaks the future into training and produces a wonderful offline score that collapses online.' },
    ],
  },
]

export function shuffleStages(stages) {
  const arr = [...stages]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.map((s) => s.id)
}

export function scorePipeline(scenario, order, excluded) {
  const byId = Object.fromEntries(scenario.stages.map((s) => [s.id, s]))
  const valid = scenario.stages.filter((s) => !s.trap).slice().sort((a, b) => a.order - b.order)
  const includedValid = order.filter((id) => byId[id] && !byId[id].trap && !excluded.has(id))
  const correctMap = {}
  valid.forEach((s, i) => { correctMap[s.id] = includedValid[i] === s.id })
  const matches = valid.filter((s) => correctMap[s.id]).length

  const dimVals = {}
  DIMENSIONS.forEach((d) => { dimVals[d.id] = [] })
  scenario.stages.forEach((s) => {
    let v
    if (s.trap) v = excluded.has(s.id) ? 100 : 0
    else if (excluded.has(s.id)) v = 20
    else v = correctMap[s.id] ? 100 : 45
    if (dimVals[s.dim]) dimVals[s.dim].push(v)
  })
  const dims = {}
  DIMENSIONS.forEach((d) => {
    const list = dimVals[d.id]
    dims[d.id] = list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 50
  })
  const traps = scenario.stages.filter((s) => s.trap)
  const trapsRemoved = traps.every((s) => excluded.has(s.id))
  const accuracy = valid.length ? matches / valid.length : 1
  return {
    dims,
    accuracy,
    matches,
    validCount: valid.length,
    trapsRemoved,
    correctMap,
    includedValid,
    metGoal: accuracy >= 0.8 && trapsRemoved,
  }
}

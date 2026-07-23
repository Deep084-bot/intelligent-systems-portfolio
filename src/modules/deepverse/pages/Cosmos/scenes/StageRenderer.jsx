import { getActiveStageIds, getStageBlend, STAGES } from '../stages'
import { sceneComponents } from './scenes'

export default function StageRenderer({ progressRef }) {
  const progress = progressRef.current
  const activeIds = getActiveStageIds(progress)

  return activeIds.map((id) => {
    const stage = STAGES[id]
    const blend = getStageBlend(stage, progress)
    if (blend <= 0) return null

    const SceneComponent = sceneComponents[stage.id]
    if (!SceneComponent) return null

    return <SceneComponent key={stage.id} blend={blend} progress={progress} />
  })
}

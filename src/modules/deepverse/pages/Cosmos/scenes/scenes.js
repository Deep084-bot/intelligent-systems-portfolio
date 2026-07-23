import JourneyWorld from './JourneyWorld'
import InvitationScene from './InvitationScene'
import HumanScene from './HumanScene'
import RoomScene from './RoomScene'
import BuildingScene from './BuildingScene'
import CityScene from './CityScene'
import EarthScene from './EarthScene'
import MoonScene from './MoonScene'
import SunScene from './SunScene'
import SolarSystemScene from './SolarSystemScene'
import MilkyWayScene from './MilkyWayScene'
import UniverseScene from './UniverseScene'

export const sceneComponents = {
  invitation: InvitationScene,
  human: HumanScene,
  room: RoomScene,
  building: BuildingScene,
  city: CityScene,
  earth: EarthScene,
  moon: MoonScene,
  sun: SunScene,
  solarSystem: SolarSystemScene,
  milkyWay: MilkyWayScene,
  universe: UniverseScene,
}

// New unified journey - single continuous camera
export { JourneyWorld }

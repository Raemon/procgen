import { gateLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'
import { HEIGHT } from '../types'

const SEALED = '#db291f'

export function doorLook(open: boolean, opensWhen: number | null): FixtureLook {
  return {
    ...gateLook('mechanism', open),
    color: open ? gateLook('mechanism', true).color : SEALED,
    standingHeight: HEIGHT.Wall,
    tag: open ? 'door, standing open' : `door, shut until room ${opensWhen ?? '?'} is finished`,
  }
}

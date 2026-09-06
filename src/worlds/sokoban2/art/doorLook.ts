import { gateLook, type FixtureLook } from '@/features/game/fixtures/fixtureAppearance'

export function doorLook(open: boolean, opensWhen: number | null): FixtureLook {
  return {
    ...gateLook('mechanism', open),
    tag: open ? 'door, standing open' : `door, shut until room ${opensWhen ?? '?'} is finished`,
  }
}

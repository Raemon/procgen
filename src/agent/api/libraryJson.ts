import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  type CharacterBillboard,
} from '../../creatures/character/characterBillboard';
import type { CreatureDef } from '../../creatures/creatureDef';
import { entityKindLabel } from '../../creatures/entityKinds';
import type { InventoryDef } from '../../items/inventory/inventoryDef';
import { orientationLabel, renderLabel, type ItemDef } from '../../items/itemDef';

export function itemJson(item: ItemDef) {
  return {
    id: item.id,
    name: item.name,
    symbol: item.symbol,
    color: item.color,
    render: renderLabel(item.render),
    orientation: orientationLabel(item.orientation),
    thickness: item.thickness,
    edge_color: item.edgeColor,
    size: item.size,
    hover: item.hover,
    light: item.light,
    light_ink: item.lightInk,
    grid_width: item.gridWidth,
    grid_height: item.gridHeight,
    tags: item.tags,
    has_sprite: item.sprite !== null,
    has_face_art: item.faceArt !== null,
  };
}

export function creatureJson(creature: CreatureDef) {
  return {
    id: creature.id,
    name: creature.name,
    symbol: creature.symbol,
    speed: creature.speed,
    body_width: creature.bodyWidth,
    body_height: creature.bodyHeight,
    kind: entityKindLabel(creature.kind),
    inventory: creature.inventory
      ? { width: creature.inventory.width, height: creature.inventory.height }
      : null,
    billboard: creature.billboard ? billboardJson(creature.billboard) : null,
  };
}

export function billboardJson(billboard: CharacterBillboard) {
  return {
    idle_fps: billboard.idleFps,
    moving_fps: billboard.movingFps,
    frame_counts: Object.fromEntries(
      CHARACTER_ROTATIONS.map((rotation) => [
        rotation,
        Object.fromEntries(
          CHARACTER_ANIMATIONS.map((animation) => [
            animation,
            framesOf(billboard, rotation, animation).length,
          ]),
        ),
      ]),
    ),
  };
}

export function inventoryJson(inventory: InventoryDef) {
  return {
    width: inventory.width,
    height: inventory.height,
    has_background: inventory.background !== null,
    slots: inventory.slots.map((slot, index) => ({
      x: index % inventory.width,
      y: Math.floor(index / inventory.width),
      usable: slot.usable,
      tags: slot.tags,
    })),
    placements: inventory.placements.map((placement) => ({
      item_id: placement.itemId,
      x: placement.x,
      y: placement.y,
    })),
  };
}

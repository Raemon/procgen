import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import type { Piece, PieceRole } from '../../../pieces/pieceDef';
import type { Culture } from '../../cultureDef';
import type { CultureProportionKnob } from '../../cultureProportionKnobs';
import type { CultureTileSlot } from '../../cultureTileSlots';
import { ROOF_STYLE_CHOICES } from '../../roofStyleChoices';

export const ADD_CULTURE_TIP: TooltipContent = {
  title: 'add culture',
  body: 'Appends a culture with nothing chosen yet — pick its tiles, its proportions and the pieces each building role may use.',
};

export const CULTURE_NAME_TIP: TooltipContent = {
  title: 'culture name',
  body: 'How the culture is listed wherever a node binds one. Nodes bind by id, so renaming never breaks a binding.',
};

export const CULTURE_TILES_TIP: TooltipContent = {
  title: 'tiles',
  body: 'The tiles this culture builds from: wall, trim, roof, floor and path. A culture with tiles alone still assembles a whole building.',
};

export const CULTURE_PROPORTIONS_TIP: TooltipContent = {
  title: 'proportions',
  body: 'The roof style, the layers in one story and the window rhythm every building of this culture follows.',
};

export const CULTURE_PIECES_TIP: TooltipContent = {
  title: 'pieces',
  body: 'The role bindings: which authored pieces this culture may stamp for each part of a building.',
};

export const ROOF_STYLE_TIP: TooltipContent = {
  title: 'roof style',
  body: 'The shape the assembler raises above the eaves of every building of this culture.',
  options: ROOF_STYLE_CHOICES.map((choice) => ({ name: choice.label, meaning: choice.help })),
};

export function cultureTileSlotTip(slot: CultureTileSlot): TooltipContent {
  return { title: `${slot.label} tile`, body: slot.builds, when: 'no piece covers the cell' };
}

export function cultureProportionTip(knob: CultureProportionKnob): TooltipContent {
  return { title: knob.label, body: knob.shapes };
}

export function roleBindingTip(role: PieceRole, boundCount: number): TooltipContent {
  return {
    title: `${role} pieces`,
    body: boundCount === 0
      ? 'Nothing bound, so the assembler paints this part from the culture tiles instead.'
      : `The assembler rolls between the ${boundCount} bound pieces once per cell.`,
  };
}

export function bindPieceTip(piece: Piece, role: PieceRole): TooltipContent {
  return {
    title: piece.name,
    body: `Toggles this piece in and out of the pieces this culture may stamp for ${role}.`,
  };
}

export function unbindRoleTip(role: PieceRole): TooltipContent {
  return {
    title: `unbind ${role}`,
    body: 'Drops every piece bound to this role, so it falls back to being painted from tiles.',
  };
}

export function deleteCultureTip(culture: Culture): TooltipContent {
  return {
    title: `delete ${culture.name}`,
    body: 'Removes the culture. Points bound to it stop growing buildings.',
  };
}

export function duplicateCultureTip(culture: Culture): TooltipContent {
  return {
    title: `duplicate ${culture.name}`,
    body: 'Files a copy of this culture, its tiles, proportions and piece bindings included.',
  };
}

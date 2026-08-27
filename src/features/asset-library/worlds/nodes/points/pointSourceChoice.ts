export const FROM_KNOB = 0;
export const FROM_ATTRIBUTE = 1;

export function sourceChoices(thing: string, attribute: string) {
  return [
    { value: FROM_KNOB, label: 'the knob', help: `Every point gets the same ${thing}, the one set below.` },
    {
      value: FROM_ATTRIBUTE,
      label: 'a point attribute',
      help: `Each point brings its own ${thing}, read from the attribute named below — ${attribute}`,
    },
  ] as const;
}

import { useEffect, useState } from 'react';
import { normalizedTags } from '../../items/itemDef';
import { classes } from './classes';
import { FIELD_CLASSES } from './fieldClasses';

export function TagsInput({
  tags,
  title,
  placeholder,
  onChange,
}: {
  tags: readonly string[];
  title: string;
  placeholder?: string;
  onChange(tags: string[]): void;
}) {
  const [draft, setDraft] = useState(() => tags.join(', '));
  const incoming = tags.join(', ');
  useEffect(() => {
    if (normalizedTags(tagsFromText(draft)).join(', ') !== incoming) setDraft(incoming);
  }, [incoming]);
  return (
    <input
      type="text"
      title={title}
      placeholder={placeholder ?? 'comma separated'}
      className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(normalizedTags(tagsFromText(event.target.value)));
      }}
    />
  );
}

function tagsFromText(text: string): string[] {
  return text.split(',').map((tag) => tag.trim().toLowerCase());
}

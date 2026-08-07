import { useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { CHAT_MAX_LENGTH } from '../../chat/sanitizeChatText';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { useOpenChatOnReturnKey } from './openChatOnReturnKey';

export function ChatComposer() {
  const { chatComposer, net } = useAppRuntime();
  const open = useSyncExternalStore(chatComposer.subscribe, chatComposer.isOpen);
  const [draft, setDraft] = useState('');

  useOpenChatOnReturnKey(chatComposer);

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Escape') return closeComposer();
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (draft.trim() === '') return closeComposer();
    net.say(draft);
    setDraft('');
  }

  function closeComposer(): void {
    setDraft('');
    chatComposer.close();
  }

  if (!open) return null;
  return (
    <div className="absolute inset-x-0 bottom-3 flex justify-center px-4">
      <input
        autoFocus
        value={draft}
        maxLength={CHAT_MAX_LENGTH}
        placeholder="say something — return sends, escape closes"
        className={`${FIELD_CLASSES} w-[min(28rem,100%)] shadow-[0_4px_14px_rgba(0,0,0,0.55)]`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={closeComposer}
      />
    </div>
  );
}

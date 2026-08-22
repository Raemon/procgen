import { selects, type LibraryFolder } from '../../librarySelection';
import { useLibrarySelection } from '../useLibrarySelection';

export type FollowRenamedRow = (from: string, to: string) => void;

export function useFollowRenamedRow(folder: LibraryFolder): FollowRenamedRow {
  const { selection, select } = useLibrarySelection();
  return (from, to) => {
    if (selects(selection, folder, from)) select(folder, to);
  };
}

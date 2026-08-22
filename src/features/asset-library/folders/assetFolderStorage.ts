import { readPersistedFile, writePersistedFile } from '@/features/app-shell/persistence/repoFileStore';
import { assetFoldersFromStoredJson, type StoredAssetFolders } from './assetFolder';

const FILE_NAME = 'assetFolders';

export function loadStoredAssetFolders(): StoredAssetFolders {
  return assetFoldersFromStoredJson(readPersistedFile(FILE_NAME));
}

export function storeAssetFolders(stored: StoredAssetFolders): void {
  writePersistedFile(FILE_NAME, stored);
}

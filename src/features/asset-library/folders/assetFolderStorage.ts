import { readPersistedDocument, writePersistedDocument } from '@/features/app-shell/persistence/persistedDocumentStore';
import { assetFoldersFromStoredJson, type StoredAssetFolders } from './assetFolder';

const FILE_NAME = 'assetFolders';

export function loadStoredAssetFolders(): StoredAssetFolders {
  return assetFoldersFromStoredJson(readPersistedDocument(FILE_NAME));
}

export function storeAssetFolders(stored: StoredAssetFolders): void {
  writePersistedDocument(FILE_NAME, stored);
}

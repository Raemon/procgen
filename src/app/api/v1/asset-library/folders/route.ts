import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('assetFolders');
export const GET = route.GET;
export const PUT = route.PUT;

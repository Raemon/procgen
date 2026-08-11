import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('uiState');
export const GET = route.GET;
export const PUT = route.PUT;

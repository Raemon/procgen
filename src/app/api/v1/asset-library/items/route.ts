import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('items');
export const GET = route.GET;
export const PUT = route.PUT;

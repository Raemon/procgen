import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('pieces');
export const GET = route.GET;
export const PUT = route.PUT;

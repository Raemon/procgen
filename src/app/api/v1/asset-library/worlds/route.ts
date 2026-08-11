import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('worldPresets');
export const GET = route.GET;
export const PUT = route.PUT;

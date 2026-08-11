import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('worldThumbnails');
export const GET = route.GET;
export const PUT = route.PUT;

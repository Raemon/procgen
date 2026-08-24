import { persistedDocumentRoute } from '@/infrastructure/api/persistedDocumentRoute';

const route = persistedDocumentRoute('worldSeedThumbnails');
export const GET = route.GET;
export const PUT = route.PUT;

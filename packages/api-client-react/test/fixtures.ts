import type { RouteDefinition } from '@use-q/api-client';

export interface Pet {
  id: string;
  name: string;
}

export interface PetPage {
  items: Pet[];
  total: number;
  nextCursor?: string | null;
}

export const testSchema = {
  listPets: {
    method: 'GET',
    path: '/pets',
    tags: ['Pets'],
    pagination: { kind: 'page-number', pageParam: 'page' } as const,
  } satisfies RouteDefinition<Record<string, never>, { page?: number }, never, PetPage>,
  listPetsCursor: {
    method: 'GET',
    path: '/pets-cursor',
    pagination: { kind: 'cursor', pageParam: 'cursor' } as const,
  } satisfies RouteDefinition<Record<string, never>, { cursor?: string }, never, PetPage>,
  getPet: {
    method: 'GET',
    path: '/pets/{id}',
    tags: ({ response }) => [{ type: 'Pet', id: response?.id }],
  } satisfies RouteDefinition<{ id: string }, Record<string, never>, never, Pet>,
  createPet: {
    method: 'POST',
    path: '/pets',
    invalidatesTags: ['Pets'],
  } satisfies RouteDefinition<Record<string, never>, Record<string, never>, { name: string }, Pet>,
  updatePet: {
    method: 'PATCH',
    path: '/pets/{id}',
    invalidatesTags: ({ variables }) => [{ type: 'Pet', id: variables.params?.id }, 'Pets'],
  } satisfies RouteDefinition<{ id: string }, Record<string, never>, { name: string }, Pet>,
} as const;

export type TestSchema = typeof testSchema;

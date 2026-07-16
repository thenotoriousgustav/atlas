import { defineConfig } from 'orval';

export default defineConfig({
  atlas: {
    input: '../../apps/api/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/generated/atlas.ts',
      schemas: './src/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/custom-instance.ts',
          name: 'customInstance',
        },
        query: {
          useInfinite: true,
          useInfiniteQueryParam: 'cursor',
        },
      },
    },
  },
});

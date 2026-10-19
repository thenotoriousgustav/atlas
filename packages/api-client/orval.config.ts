import { defineConfig } from 'orval';

export default defineConfig({
  cabinet: {
    input: '../../apps/api/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/generated/cabinet.ts',
      clean: true,
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

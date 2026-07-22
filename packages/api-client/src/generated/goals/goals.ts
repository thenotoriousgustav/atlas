import {
  useMutation,
  useQuery
} from '@tanstack/react-query';
import type {
  DataTag,
  QueryKey,
  QueryFunction,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  QueryClient
} from '@tanstack/react-query';

import type {
  CreateGoalDto,
  UpdateGoalDto,
  Goal
} from '../model';

import { customInstance } from '../../custom-instance';

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

export const goalsControllerCreate = (
  createGoalDto: CreateGoalDto,
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal
) => {
  return customInstance<Goal>(
    {
      url: `/v1/goals`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: createGoalDto,
      signal
    },
    options
  );
};

export const getGoalsControllerCreateMutationOptions = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerCreate>>,
    TError,
    { data: CreateGoalDto },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof goalsControllerCreate>>,
  TError,
  { data: CreateGoalDto },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn = (props: { data: CreateGoalDto }) => {
    const { data } = props ?? {};
    return goalsControllerCreate(data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type GoalsControllerCreateMutationResult = NonNullable<
  Awaited<ReturnType<typeof goalsControllerCreate>>
>;
export type GoalsControllerCreateMutationBody = CreateGoalDto;
export type GoalsControllerCreateError = unknown;

export const useGoalsControllerCreate = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerCreate>>,
    TError,
    { data: CreateGoalDto },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof goalsControllerCreate>>,
  TError,
  { data: CreateGoalDto },
  TContext
> => {
  const mutationOptions = getGoalsControllerCreateMutationOptions(options);
  return useMutation(mutationOptions);
};

export const goalsControllerFindAll = (
  options?: SecondParameter<typeof customInstance>,
  signal?: AbortSignal
) => {
  return customInstance<Goal[]>(
    { url: `/v1/goals`, method: 'GET', signal },
    options
  );
};

export const getGoalsControllerFindAllQueryKey = () => {
  return [`/v1/goals`] as const;
};

export const getGoalsControllerFindAllQueryOptions = <
  TData = Awaited<ReturnType<typeof goalsControllerFindAll>>,
  TError = unknown
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof goalsControllerFindAll>>, TError, TData>
  >;
  request?: SecondParameter<typeof customInstance>;
}) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getGoalsControllerFindAllQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof goalsControllerFindAll>>> = ({ signal }) =>
    goalsControllerFindAll(requestOptions, signal);

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof goalsControllerFindAll>>,
    TError,
    TData
  > & { queryKey: DataTag<QueryKey, TData, TError> };
};

export type GoalsControllerFindAllQueryResult = NonNullable<
  Awaited<ReturnType<typeof goalsControllerFindAll>>
>;
export type GoalsControllerFindAllError = unknown;

export function useGoalsControllerFindAll<
  TData = Awaited<ReturnType<typeof goalsControllerFindAll>>,
  TError = unknown
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof goalsControllerFindAll>>, TError, TData>
    >;
    request?: SecondParameter<typeof customInstance>;
  },
  queryClient?: QueryClient
): UseQueryResult<TData, TError> & { queryKey: DataTag<QueryKey, TData, TError> } {
  const queryOptions = getGoalsControllerFindAllQueryOptions(options);
  const query = useQuery(queryOptions, queryClient) as UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
  };
  return withQueryKey(query, queryOptions.queryKey);
}

export const goalsControllerUpdate = (
  id: string,
  updateGoalDto: UpdateGoalDto,
  options?: SecondParameter<typeof customInstance>
) => {
  return customInstance<Goal>(
    {
      url: `/v1/goals/${id}`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: updateGoalDto,
    },
    options
  );
};

export const getGoalsControllerUpdateMutationOptions = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerUpdate>>,
    TError,
    { id: string; data: UpdateGoalDto },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof goalsControllerUpdate>>,
  TError,
  { id: string; data: UpdateGoalDto },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn = (props: { id: string; data: UpdateGoalDto }) => {
    const { id, data } = props ?? {};
    return goalsControllerUpdate(id, data, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useGoalsControllerUpdate = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerUpdate>>,
    TError,
    { id: string; data: UpdateGoalDto },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof goalsControllerUpdate>>,
  TError,
  { id: string; data: UpdateGoalDto },
  TContext
> => {
  const mutationOptions = getGoalsControllerUpdateMutationOptions(options);
  return useMutation(mutationOptions);
};

export const goalsControllerRemove = (
  id: string,
  options?: SecondParameter<typeof customInstance>
) => {
  return customInstance<Goal>(
    { url: `/v1/goals/${id}`, method: 'DELETE' },
    options
  );
};

export const getGoalsControllerRemoveMutationOptions = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerRemove>>,
    TError,
    { id: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationOptions<
  Awaited<ReturnType<typeof goalsControllerRemove>>,
  TError,
  { id: string },
  TContext
> => {
  const { mutation: mutationOptions, request: requestOptions } = options ?? {};

  const mutationFn = (props: { id: string }) => {
    const { id } = props ?? {};
    return goalsControllerRemove(id, requestOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export const useGoalsControllerRemove = <
  TError = unknown,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof goalsControllerRemove>>,
    TError,
    { id: string },
    TContext
  >;
  request?: SecondParameter<typeof customInstance>;
}): UseMutationResult<
  Awaited<ReturnType<typeof goalsControllerRemove>>,
  TError,
  { id: string },
  TContext
> => {
  const mutationOptions = getGoalsControllerRemoveMutationOptions(options);
  return useMutation(mutationOptions);
};

// Response data from api

export type TError<TData> = {
  data: null;
  errors: Record<keyof TData, string>;
  message: string;
  status: string;
  total?: number;
};

export type TSuccess<TData> = {
  data: TData;
  total?: number;
  message: string;
  status: number | string;
};

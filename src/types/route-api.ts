// Response data from api

export type TError<TData> = {
  errors: Record<keyof TData, string>;
  message: string;
  status: string;
};

export type TSuccess<TData> = {
  data: TData;
  message: string;
  status: number | string;
};

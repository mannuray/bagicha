export interface SkipTake {
  skip: number;
  take: number;
}

export interface Rows<T> {
  rows: T[];
  total: number;
}

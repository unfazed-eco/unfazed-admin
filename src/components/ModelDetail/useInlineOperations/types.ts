export interface UseInlineOperationsOptions {
  mainRecord: Record<string, any>;
}

export interface InlineDataState {
  [key: string]: Record<string, any>[];
}

export interface EditingKeysState {
  [key: string]: any[];
}

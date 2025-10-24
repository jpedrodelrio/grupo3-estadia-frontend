declare module 'papaparse' {
  interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields: string[];
  }

  interface ParseResult<T> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  interface ParseConfig {
    header?: boolean;
    skipEmptyLines?: boolean;
    delimiter?: string;
    complete?: (results: ParseResult<unknown>) => void;
    error?: (error: ParseError) => void;
  }

  interface UnparseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
  }

  export function parse<T = unknown>(input: string, config?: ParseConfig): ParseResult<T>;
  export function unparse(data: unknown[], options?: UnparseConfig): string;
}


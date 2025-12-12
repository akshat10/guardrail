declare module '@babel/generator' {
  import type { Node } from '@babel/types';

  interface GeneratorOptions {
    retainLines?: boolean;
    retainFunctionParens?: boolean;
    compact?: boolean;
    minified?: boolean;
    concise?: boolean;
    comments?: boolean;
    shouldPrintComment?: (value: string) => boolean;
    filename?: string;
    auxiliaryCommentBefore?: string;
    auxiliaryCommentAfter?: string;
  }

  interface GeneratorResult {
    code: string;
    map?: object;
  }

  function generate(
    ast: Node,
    options?: GeneratorOptions,
    code?: string | { [filename: string]: string }
  ): GeneratorResult;

  export default generate;
}

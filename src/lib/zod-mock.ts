
/**
 * LITE-ZOD MOCK (Zero-Dependency)
 * Provides basic schema identification for Genkit/AI flows.
 * Used when disk is full and 'zod' cannot be installed.
 */

const base = {
  parse: (v: any) => v,
  _type: null as any,
  describe: function(d: string) { return this; },
  optional: function() { return this; },
  array: function() { return this; },
  min: function(n: number) { return this; },
  max: function(n: number) { return this; },
};

export const z = {
  string: () => ({ ...base }),
  number: () => ({ ...base }),
  boolean: () => ({ ...base }),
  array: (inner: any) => ({ ...base }),
  object: (schema: any) => ({
    ...base,
    shape: schema,
  }),
  enum: (values: string[]) => ({ ...base }),
  any: () => ({ ...base }),
  record: () => ({ ...base }),
  infer: {} as any,
};

export default z;

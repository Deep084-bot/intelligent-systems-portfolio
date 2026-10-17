import { defaultSchema } from 'hast-util-sanitize';

// Allow only the class names that syntax highlighting adds, so language tags
// (`language-java`) and highlight spans (`hljs`, `hljs-keyword`) survive
// sanitization while everything else stays locked down.
const LANGUAGE_CLASS = /^language-[\w-]+$/;
const HLJS_CLASS = /^hljs(-[\w-]+)?$/;

export const markdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes.code || []), ['className', LANGUAGE_CLASS, HLJS_CLASS]],
    span: [...(defaultSchema.attributes.span || []), ['className', HLJS_CLASS]],
    pre: [...(defaultSchema.attributes.pre || []), ['className', HLJS_CLASS]],
  },
};

export default markdownSchema;

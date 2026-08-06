/*
Language: Koka
Description: Koka programming language (https://koka-lang.github.io/)
Category: functional
*/

export default function (hljs) {
  const KEYWORDS = [
    "abstract",
    "alias",
    "as",
    "behind",
    "co",
    "con",
    "ctl",
    "effect",
    "elif",
    "else",
    "exists",
    "extern",
    "final",
    "fn",
    "forall",
    "fun",
    "handle",
    "handler",
    "if",
    "import",
    "in",
    "infix",
    "infixl",
    "infixr",
    "interface",
    "local",
    "mask",
    "match",
    "module",
    "named",
    "override",
    "pub",
    "raw",
    "rec",
    "return",
    "some",
    "struct",
    "then",
    "type",
    "val",
    "var",
    "with"
  ];

  const BUILT_INS = [
    "c",
    "cs",
    "file",
    "header",
    "inline",
    "js",
    "ref",
    "resume",
    "resume-shallow",
    "rcontext"
  ];

  const TYPES = [
    "int",
    "float",
    "bool",
    "char",
    "string",
    "unit",
    "exn",
    "div",
    "pure",
    "total",
    "io",
    "ndet",
    "heap",
    "st",
    "vector",
    "svector",
    "fvector",
    "box",
    "any",
    "list"
  ];

  return {
    name: "Koka",
    aliases: ["kk"],
    keywords: {
      $pattern: /[a-z][\w-]*['?]*/,
      keyword: KEYWORDS,
      built_in: BUILT_INS,
      type: TYPES,
      literal: "True False"
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: "string",
        begin: '"',
        end: '"',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: "string",
        begin: /'(\\.|[^'\\])'/,
        relevance: 0
      },
      {
        className: "number",
        begin:
          /\b-?(?:0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|\d+(?:\.\d+(?:[eE][-+]?\d+)?)?)\b/,
        relevance: 0
      },
      {
        className: "type",
        begin: /\b[A-Z][\w-]*['?]*/,
        relevance: 0
      },
      {
        className: "type",
        begin: /<(?![$%&*+@!\/\\^~=.:\-?<>\s\d])/,
        end: />/,
        contains: [
          {
            begin: /<(?![$%&*+@!\/\\^~=.:\-?<>\s\d])/,
            end: />/,
            contains: [
              {
                begin: /<(?![$%&*+@!\/\\^~=.:\-?<>\s\d])/,
                end: />/
              }
            ]
          }
        ]
      },
      {
        className: "operator",
        begin: /(?:\.\.\.|[+\-*/%=<>!&|^~@:]+)/,
        relevance: 0
      }
    ]
  };
}

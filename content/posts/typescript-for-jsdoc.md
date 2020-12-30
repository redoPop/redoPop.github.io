---
title: "Supporting TypeScript from JavaScript codebases"
date: 2020-07-20T20:19:26-05:00
feed: true
draft: false
---
The TypeScript compiler can [generate type declarations from JSDoc comments in JavaScript sources](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html). I've been using it to provide TypeScript support for Node libraries that are still maintained as pure JavaScript.

While TypeScript has quickly taken over front-end library development, many Node libraries are still maintained as pure JS. That's partly due to differences in lifecycles and codebase maturity, but there's also a technical reason for the difference: in the front-end TypeScript is largely replacing an existing transpile step, so it's a natural evolution of longstanding development toolchains. Since Node codebases don't contend with browser support, they have no natural need for such a transpile step. That makes transpilation – and its associated inconveniences to testing and debugging – a new friction when adopting TypeScript in Node. (This is one of [Deno's](https://deno.land/) draws: TypeScript support by default means less tooling to argue with.)

Regardless, type declaration files are a common feature request for Node libraries. The compiler's JSDoc support seems a good solution: it allows library contributors to work in pure JS, toolchains untampered, with only a `publish` script in `package.json` to generate `.d.ts` files for distribution:

```json
"publish": "tsc --allowJs --declaration --emitDeclarationOnly --outDir .",
```

That satisfies consumers' expectations for type support without disrupting development, adding only a short automatic step to distribution and a single shallow dependency for [`typescript`](https://www.npmjs.com/package/typescript) itself.

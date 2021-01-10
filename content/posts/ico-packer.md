---
title: "Reduce a favicon’s footprint with ICO's PNG support"
date: 2020-09-13T17:32:00-05:00
feed: true
draft: false
---
ICO remains a popular format for favicons. Historically images within an ICO were bitmaps, but the format has long supported PNG too. Since it makes for smaller filesizes, I figured ImageMagick would make a PNG-based ICO if fed only PNG sources:

```bash
convert 16x16.png 32x32.png 48x48.png favicon.ico
```

Output size: **15 KB** 🙀 – almost 8× my sources. [Icon Slate](https://www.kodlian.com/apps/icon-slate) yields similar: 18 KB. Both tools are bundling bitmaps into the ICO rather than the source PNGs.

I thrashed around looking for an open source lib or tool that reliably packages an ICO of PNG images but my luck was bad enough I began to wonder if I'd made up the whole thing about ICO serving as a PNG container.

I hadn’t, but I reflexively turned to Wikipedia [where the ICO format is so well documented](https://en.wikipedia.org/wiki/ICO_\(file_format\)#Outline) (and the format itself so straightforward) that I decided to write [a small Node library dedicated to the task of packaging PNG images into an ICO](https://github.com/redoPop/ico-packer). Here's how I use it:

```js
const fs = require('fs');
const pack = require('ico-packer');

fs.writeFileSync('favicon.ico', pack([
  fs.readFileSync('16x16.png'),
  fs.readFileSync('32x32.png'),
  fs.readFileSync('48x48.png'),
]));
```

Output size: **2 KB** 😽

This isn't a new trick – [it's baked into the format](https://devblogs.microsoft.com/oldnewthing/20101022-00/?p=12473) and several "favicon generator" websites have been doing it for years – but if anyone else has the same trouble finding a working tool then hopefully this strikes the right keywords to help you out. ❤️

[ico-packer is available on npm](https://www.npmjs.com/package/ico-packer).

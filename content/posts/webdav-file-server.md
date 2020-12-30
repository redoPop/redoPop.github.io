---
title: "WebDAV as a virtual file server"
date: 2020-02-22T16:44:10-06:00
feed: true
draft: false
---
Our team maintains a FUSE daemon which brings media files together from multiple storage systems and organizes them into directories based on metadata so editors can find them quickly. FUSE is [facing a daunting future on macOS,](https://developer.apple.com/support/kernel-extensions/) so we've been keeping an eye out for alternatives.

One of my wackier ideas was to build a virtual file server sharing the same tree structure over a protocol that enjoys direct macOS support: SMB, or less seriously: FTP or WebDAV. I've been tinkering in my free time to probe the viability of that idea.

Perhaps I'll share the more serious research into CIFS & SMB2 some other time. Before I knuckled down to that, I spent some time distracted by WebDAV. It's an infamously quirky protocol, but it's also a piece of web tech I'd never paid much mind to. I had a surprising amount of fun playing with it. 

## A toy WebDAV server
WebDAV uses HTTP to deliver file contents and XML payloads representing file & folder properties. It also extends HTTP with a handful of special verbs like `PROPFIND` which obtains the properties of a resource (whereas `GET` obtains the resource itself).

When a `PROPFIND` request is made to a directory (_a collection_ in WebDAV parlance), the server doesn't just respond with the directory's properties but with the properties of its members too. This is represented as a multi-status response, as though `PROPFIND` requests had been made to each of those resources individually and their responses were being stitched together into one XML document.

To demonstrate that, here's a toy implementation written in Express – a read-only WebDAV server that lists a single text file member of a root collection:

```javascript
const express = require("express");
const xml = require("xmlbuilder");

const app = express();

// Describes a mock file for our toy server
const file = {
  path: "/hello-world.txt",
  content: "Hello World",
  ctime: new Date(2020, 1, 10),
};

// Serve the file itself (standard get request)
app.get(file.path, (req, res) => res.send(file.content));

// Obtain properties for the root resource,
// which is a collection containing our file
app.propfind("/", (req, res) => {
  res.set("Content-Type", "application/xml");

  // Begin a multistatus XML document to represent
  // PROPFIND responses from multiple resources
  const doc = xml.create("D:multistatus").att("xmlns:D", "DAV:");

  // Helper method for adding new a response to the doc
  const add = (path, prop) =>
    doc.ele({
      "D:response": {
        "D:href": { "#text": path },
        "D:propstat": {
          "D:prop": prop,
          "D:status": "HTTP/1.1 200 OK",
        },
      },
    });

  // Add a response for the root collection's properties
  // You can look up properties themselves in the WebDAV spec:
  // http://www.webdav.org/specs/rfc4918.html#dav.properties
  add("/", {
    "D:creationdate": file.ctime.toUTCString(),
    "D:getlastmodified": file.ctime.toUTCString(),
    "D:resourcetype": { "D:collection": "" },
  });

  // Add a response for the file's properties
  add(file.path, {
    "D:getcontentlength": file.content.length,
    "D:creationdate": file.ctime.toUTCString(),
    "D:getlastmodified": file.ctime.toUTCString(),
    "D:resourcetype": "", // empty for non-collection resources
  });

  res.status(207).send(doc.end({ pretty: true }));
});

// Respond to an OPTIONS request with the permitted verbs
// for the root collection, and a DAV compliance class.
// This tells clients that it's a WebDAV resource.
app.options("/", (req, res) => {
  res.set({
    Allow: "OPTIONS,PROPFIND",
    DAV: "1",
  });
  res.send();
});

app.listen(1900);
```

Since it's a toy I've left some things unimplemented, including authentication, but it's a complete working example that I've tested in several WebDAV clients. (Authentication into a WebDAV server is assumed by macOS, so Finder will prompt you for a username and password if you connect to it. You can fill in any value.)

## 0, 1, infinity
One of my favorite quirks of WebDAV (unimplemented in the toy above) is [the depth header](http://www.webdav.org/specs/rfc4918.html#HEADER_Depth) – a request header sent by clients to indicate how deeply they'd like to inspect a collection if there are others nested within it. The depth header takes exactly three values:

* `Depth: 0` – give me details about this collection only
* `Depth: 1` – give me details about this collection and its immediate members
* `Depth: infinity` – give me details about the _entire tree_ of resources that I can reach through this collection, down to the furthest leaf

Evidently WebDAV wasn't designed with large trees in mind. 😄

## Extended attributes
Our FUSE daemon also adds extended file attributes to associate files with custom metadata stored in a separate system and managed via an electron app. I was curious how we'd accomplish that over WebDAV since its "properties" are limited to a few supported keys.

I found that macOS uses [AppleDouble Format files](https://en.wikipedia.org/wiki/AppleSingle_and_AppleDouble_formats) to send extended attributes over WebDAV (AKA sidecar files, `._` files, or winky frogs). For each resource it encounters in a WebDAV collection, the macOS client sends a prospective GET request to an equivalently named `._` location and transparently ties that metadata to the original resource when extended attributes are read.

AppleDouble Format is relatively simple to produce and is covered by existing libraries in many languages, e.g. [xattr-file](https://www.npmjs.com/package/xattr-file) in Node.

## Chunked reads
FUSE allows us to translate chunked reads into [range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range) when reading over HTTP, which is important for buffering large files. With WebDAV we're at the mercy of the client to make that decision: the spec has no guarantees.

In my experiments, the macOS client made _some_ range requests (e.g. for header information and probing for moov atoms at the back of MP4 files) but large sequential reads were translated to uncapped ranges, i.e. specifying a range-start but no range-end – "give me the the rest of the file." This puts buffering under more strain than adding content in controlled chunks, and video applications stall for several seconds when opening large files even within a local network.

I experimented with chunked transfer encoding (too slow, I suppose due to overhead from stitching files back together in an intermediary buffer) and forced Content-Range responses (which goes against the spec, so I didn't really expect it to work), but couldn't find a workaround.

I took this as my cue to stop monkeying about with WebDAV, but I was surprised how much fun I'd been having. It's a unique application of HTTP and one I hadn't previously considered.

---
title: "Notes from Demuxed 2020"
date: 2020-11-03T20:11:00-06:00
lastmod: 2020-12-18T17:24:00-06:00
feed: true
draft: false
---
Last week was [Demuxed](https://demuxed.com/), a conference about digital video from an engineering perspective. It was my third time attending and it's still an exhilarating conference: every speaker brings unique perspectives and expertise; I can never predict which talks will impress me most.

[The full conference is now available for viewing on YouTube](https://www.youtube.com/playlist?list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN) but here are a few talks/topics that stood out to me as especially interesting:

## How WebRTC works (Sean DuBois, Amazon)
There are many introductions to the WebRTC APIs ([Google has a nice one](https://webrtc.org/getting-started/media-devices) and [MDN is our bible](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)) but this talk is something else: an engineering overview describing the fundamental building blocks of WebRTC itself and how they fit together.

This talk fills some huge knowledge gaps. WebRTC is built on a strata of existing protocols and technologies, and without a talk like this it's difficult to understand the technology properly without reading 20+ years of RFCs and connecting the dots. For the same reason, it's a dense talk; I plan to rewatch it a few times myself.

[You can watch the talk on YouTube](https://www.youtube.com/watch?v=rQJZtfXLj7U&list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN&index=26) and Sean compiled a lot of this information into a community book called [WebRTC for the Curious](https://webrtcforthecurious.com/).

## Editing video by editing text (Roderick Hodgson, Simon Says)
Roderick's company produces transcripts for use in post-production, e.g. for editors to use as a guide for navigating a video, rather than relying solely on an A/V scrubber. Recently, he's been working on a web-based tool for editorial staff to create rough edits from multiple video clips, simply by highlighting transcript text and then dragging and dropping to reorder clips into a narrative – think of the way interviews are stitched together in a documentary or news bulletin. These rough cuts can then be passed on to video editors (e.g. as FCPXML) for creative work.

Much of Roderick's talk focused on solving the technical issue of representing clip selections in a web-based editor. This was interesting, but the product itself caught my imagination. It's an innovative way to close the gap between two phases of editorial work.

[Watch Roderick's talk on YouTube.](https://www.youtube.com/watch?v=QCp-AXvpsJ8&list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN&index=20)

## Video Vectorization (Sam Bhattacharyya, Vectorly)
Inspired by the Flash animations of yesteryear (Homestar Runner, anyone?) Sam's been working on an SVG video codec: storing animation as vector graphics in MP4, and then rendering on the client using WebGL. Sam's primarily interested in delivering complete animations in high quality at low bitrates, but also mentioned how the idea could apply to video overlays or be used to deliver more readable and accessible titles at heavier compression rates.

This talk's a window into a lot of deep and interesting topics (vectorization, custom codecs, a custom library to parse and render SVG via WebGL). Conversation afterward also pointed to an in-development [SVG Streaming spec](https://svgwg.org/specs/streaming/) which could make adoption of these ideas easier and more widespread in future.

[Watch Sam's talk on YouTube.](https://www.youtube.com/watch?v=EvGA5qCfy9I&list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN&index=2)

## Audio Description (Jun Heider, RealEyes)
Audio description is an industry term for narrating video to describe visual content for accessibility purposes or to make it available in new contexts e.g. watching a TV show while doing the dishes.

Jun has been compiling [a list of standards and other resources](https://docs.google.com/document/d/1IzF6p-wxDomivmhetFY3S4PJ9mYFfQ8lyidNFItaZRI/edit#heading=h.dqbqzyqwyg36) to help organizations get started on the path to producing more Audio Description content.

[Watch and hear Jun's talk on YouTube.](https://www.youtube.com/watch?v=KUWM5QWzWuQ&list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN&index=22)

## How to live stream a LaserDisc (Vanessa Pyne, Daily.co)
This talk's too much fun, but still fascinating! I hadn't realized how close LaserDisc was to analog media. Its video is stored entirely in analog: an FM signal was stamped into the disc as pits and lands that required data reads at a precise rate, like an optical record player with a laser as its needle.

[Watch Vanessa's talk on YouTube.](https://www.youtube.com/watch?v=DuYakl4uHMg&list=PLkyaYNWEKcOcDlGjEbpxBe4woCJGHrarN&index=11)

## Resources
Finally, here's a few of the links I scribbled down without context, mostly from lightning talks and side conversations:

* [Awesome Video](https://awesome.video/) - an [awesome list](https://github.com/sindresorhus/awesome) of learning resources, tools, libraries, and much more about video tech
* [Media Fragments](https://www.w3.org/TR/media-frags/#general-structure) - did you know there's a standard for deep-linking to specific times, tracks, and even for _cropping_ media via URL?
* [HLSQ](https://github.com/soldiermoth/hlsq) - CLI client that renders HLS manifests with syntax highlighting and some basic filtering (think [jq](https://stedolan.github.io/jq/) for video streams)
* ["Simultaneous Interpreting" by Lynn Visson](https://www.lrb.co.uk/the-paper/v35/n21/lynn-visson/diary) - came up in a conversation about stenography; strictly tangential but super interesting

If you're interested in video or just want a new perspective on engineering problems, I can't recommend this conference enough.

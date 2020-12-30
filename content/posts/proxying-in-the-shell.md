---
title: "Using Charles to override server-to-server API responses for Rails & Node development on macOS"
date: 2020-01-03T18:42:02-06:00
feed: true
draft: false
---
A handy thing about microservice architectures is how easily you can inspect & override server-to-server API responses in local development. For example, updating your app for a planned-but-unimplemented API change.

[Charles Proxy](https://www.charlesproxy.com/) is particularly helpful here. We use Charles a lot in front-end development and debugging, so I'll assume you're already familiar with features like [Breakpoints](https://www.charlesproxy.com/documentation/proxying/breakpoints/) and [Map Local](https://www.charlesproxy.com/documentation/tools/map-local/) to intercept and rewrite requests & responses. However, there are a couple of snags unique to the command line environment which can be a stumbling block when you're trying to apply the same approach to server-side development.

Don't be put off! It's easy when you know how. 😄

## Using an HTTP proxy on the command line
macOS proxy settings (set through Charles or via Network Preferences) are automatically applied to GUI applications – including most browsers – but they don't extend to the command line.

By convention that's remedied via the `http_proxy`/`https_proxy` environment variables, which can point to the Charles HTTP Proxy in familiar `scheme://[userinfo@]host[:port]` URI syntax, i.e. for most of us:

```bash
export https_proxy="http://127.0.0.1:8888"
```

Applications that honor these variables then use the specified proxy when making HTTP/HTTPS requests. If you find it tedious to configure each time, Derek Morgan had the idea of [using scutil output to set the variable automatically based on macOS proxy settings.](https://dmorgan.info/posts/mac-network-proxy-terminal/) I don't do this, in part because of a problem Node makes:

### Node's proxy Got-cha
Some popular tools & libraries [like Node & Got](https://github.com/sindresorhus/got/issues/560) don't honor the conventional `http_proxy`/`https_proxy` environment variables.

For Node, the [global-agent](https://www.npmjs.com/package/global-agent) package provides the same functionality, hooking into Node's [`globalAgent`](https://nodejs.org/api/http.html#http_http_globalagent) configurations to add proxy support. It requires a little extra setup and has its own environment variables, [all covered by its readme.](https://www.npmjs.com/package/global-agent#setup-proxy-using-global-agentbootstrap)

For older Node versions (< 12) [global-tunnel](https://github.com/np-maintain/global-tunnel) serves a similar purpose.

## Using self-signed certificates on the command line
Command line applications also don't know about the certificates installed & trusted in the macOS System Keychain. They need to be configured into awareness of [the Charles root certificate,](https://www.charlesproxy.com/documentation/proxying/ssl-proxying/) otherwise proxied HTTPS requests will fail.

Ruby uses OpenSSL, which has an environment variable `SSL_CERT_FILE` for this purpose. That variable can point to the exported Charles root certificate _(Help > SSL Proxying > Save Charles Root Certificate…)_ when starting Rails:

```bash
env SSL_CERT_FILE="/path/to/cert.pem" rails s
```

Be aware: this configuration _replaces_ the OpenSSL default, which will be a problem if the application makes HTTPS requests to hosts outside of Charles' configured SSL Proxying locations. This hasn't been an issue for me, but it's possible to [configure a directory of multiple certificates](https://www.jvt.me/posts/2019/12/04/openssl-certs-dir-setup/) to mix the default cert in.

Node makes this a little easier with an environment variable that's specifically designed to take _additional_ certificates instead of an override:

```bash
env NODE_EXTRA_CA_CERTS="/path/to/cert.pem" npm start
```

With these configurations in place, we can treat microservice APIs in Node & Rails just like we would in client applications. It's a handy tool for debugging and rapid development.

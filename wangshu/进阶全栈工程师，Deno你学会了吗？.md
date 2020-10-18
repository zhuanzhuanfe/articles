> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦

# 进阶全栈工程师，Deno你学会了吗？

如果你一直关注 Web 开发领域，那么最近可能已经听到了很多关于 Deno 的信息——一种新的 JavaScript 运行时，它可能也会被认为是 Node.js 的继承者。但是这意味着什么，我们需要“下一个 Node.js” 吗？

## 什么是 Deno？

Deno 是一个 JavaScript/TypeScript 的运行时，默认使用安全环境执行代码，有着卓越的开发体验。

Deno 建立在 V8、Rust 和 Tokio 的基础上。

### 功能亮点

- 默认安全。外部代码没有文件系统、网络、环境的访问权限，除非显式开启。

- 支持开箱即用的 TypeScript 的环境。

- 只分发一个独立的可执行文件 (`deno`)。

- 有着内建的工具箱，比如一个依赖信息查看器 (`deno info`) 和一个代码格式化工具 (`deno fmt`)。

- 有一组经过审计的 [标准模块](https://github.com/denoland/deno/tree/master/std)，保证能在 Deno 上工作。

- 脚本代码能被打包为一个单独的 JavaScript 文件。

### Deno VS Node

- Deno 不使用 `npm`，而是使用 URL 或文件路径引用模块。

- Deno 在模块解析算法中不使用 `package.json`。

- Deno 中的所有异步操作返回 `promise`，因此 Deno 提供与 Node 不同的 API。

- Deno 需要显式指定文件、网络和环境权限。

- 当未捕获的错误发生时，Deno 总是会异常退出。

- 使用 ES 模块，不支持 `require()`。第三方模块通过 URL 导入。

  ```js
  import * as log from "https://deno.land/std/log/mod.ts";
  ```


| - | Node | Deno|
| ---  | ---  | ---|
| API 引用方式 | 模块导入 | 全局对象 |
| 模块系统 | CommonJS & 新版 node 实验性 ES Module | ES Module 浏览器实现 |
| 安全 | 无安全限制 | 默认安全 |
| Typescript | 第三方，如通过 ts-node 支持 | 原生支持 |
| 包管理 | npm + node_modules | 原生支持 |
| 异步操作 | 回调 | Promise |
| 包分发 | 中心化 npmjs.com | 去中心化 import url |
| 入口 | package.json 配置 | import url 直接引入 |
| 打包、测试、格式化 | 第三方如 eslint、gulp、webpack、babel 等 | 原生支持 |

## 安装 Deno

Deno 能够在 macOS、Linux 和 Windows 上运行。Deno 是一个单独的可执行文件，它没有额外的依赖。

### 官方安装

这里就不具体说明，文档地址：https://deno.land/#installation

### 多版本管理安装

这里主要讲一下`dvm`,了解Node 的同学，都知道Node有个版本控制[nvm](https://github.com/nvm-sh/nvm)，而Deno也有一个版本控制叫[dvm](https://github.com/justjavac/dvm)。

With Shell:

```sh
curl -fsSL https://deno.land/x/dvm/install.sh | sh
```

With PowerShell:

```sh
iwr https://deno.land/x/dvm/install.ps1 -useb | iex
```

dvm 使用：
```sh
$ dvm --help
dvm 1.1.10
Deno Version Manager - Easy way to manage multiple active deno versions.

USAGE:
    dvm [SUBCOMMAND]

OPTIONS:
    -h, --help
            Prints help information

    -V, --version
            Prints version information


SUBCOMMANDS:
    completions    Generate shell completions
    help           Prints this message or the help of the given subcommand(s)
    info           Show dvm info
    install        Install deno executable to given version [aliases: i]
    list           List installed versions, matching a given <version> if provided [aliases: ls]
    use            Use a given version

Example:
  dvm install 1.3.2     Install v1.3.2 release
  dvm install           Install the latest available version
  dvm use 1.0.0         Use v1.0.0 release
```

## Deno 初体验

相信一些读者安装完 Deno 已经迫不及待了，现在我们立马来体验一下 Deno 应用程序。首先打开你熟悉的命令行，然后在命令行输入以下命令：

```sh
 $ deno run https://deno.land/std/examples/welcome.ts

Download https://deno.land/std/examples/welcome.ts
Warning Implicitly using latest version (0.68.0) for https://deno.land/std/examples/welcome.ts
Download https://deno.land/std@0.68.0/examples/welcome.ts
Check https://deno.land/std@0.68.0/examples/welcome.ts
Welcome to Deno 🦕
```

通过观察以上输出，我们可以知道当运行 `deno run https://deno.land/std/examples/welcome.ts` 命令之后，Deno 会先从`https://deno.land/std/examples/welcome.ts` URL 地址下载 `welcome.ts` 文件，该文件的内容是：

```
console.log("Welcome to Deno 🦕);
```

当文件下载成功后，Deno 会对 `welcome.ts` 文件进行编译，即编译成 `welcome.ts.js`文件。需要注意的是，如果你在命令行重新运行上述命令，则会执行缓存中已生成的文件，并不会再次从网上下载 `welcome.ts` 文件。

```sh
$ deno run https://deno.land/std/examples/welcome.ts
Welcome to Deno 🦕
```

那如何证明再次执行上述命令时， Deno 会优先执行缓存中编译生成的 JavaScript 文件呢？这里我们要先介绍一下 deno info 命令，该命令用于显示有关缓存或源文件相关的信息：

```sh
$ deno info
DENO_DIR location: "/Users/sunilwang/.deno"
Remote modules cache: "/Users/sunilwang/.deno/deps"
TypeScript compiler cache: "/Users/sunilwang/.deno/gen"
```

```sh
$ tree $HOME/.deno
/Users/sunilwang/.deno
├── deps
│   └── https
│       └── deno.land
│           ├── 1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678
│           └── 1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678.metadata.json
└── gen
    └── https
        └── deno.land
            ├── 1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678.buildinfo
            ├── 1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678.js
            └── 1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678.meta
```

在上述的输出信息中，我们看到了 TypeScript compiler cache 这行记录，很明显这是 TypeScript 编译器缓存的目录，进入该目录后，通过一层层的查找，找到了 `1a52c1fa5e4c9dc57f6866469b3f52feb606c441668dab162bf6424a87e87678.js` 编译后的缓存文件。

打开目录中 文件，我们可以看到以下内容：

```js
"use strict";
console.log("Welcome to Deno 🦕");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuNjguMC9leGFtcGxlcy93ZWxjb21lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMifQ==%
```

那么现在问题又来了，如何强制刷新缓存，即重新编译 TypeScript 代码呢？针对这个问题，在运行 deno run 命令时，我们需要添加 `--reload` 标志，来告诉 Deno 需要重新刷新指定文件：

```js
 $ deno run --reload https://deno.land/std/examples/welcome.ts

Download https://deno.land/std/examples/welcome.ts
Warning Implicitly using latest version (0.68.0) for https://deno.land/std/examples/welcome.ts
Download https://deno.land/std@0.68.0/examples/welcome.ts
Check https://deno.land/std@0.68.0/examples/welcome.ts
Welcome to Deno 🦕
```

除了 `--reload` 标志之外，`Deno run` 命令还支持很多其他的标志，感兴趣的读者可以运行 `deno run --help` 命令来查看更多的信息。

## 模块规范

Deno 完全遵循 `es module` 浏览器实现，所以 Deno 也是如此：

```js
// 支持
import * as fs from "https://deno.land/std/fs/mod.ts";
import { deepCopy } from "./deepCopy.js";
import foo from "/foo.ts";

// 不支持
import foo from "foo.ts";
import bar from "./bar"; // 必须指定扩展名
```

我们发现其和我们平常在 `webpack` 或者 `ts` 使用 `es module` 最大的不同：

- 可以通过 `import url` 直接引用线上资源；

- 资源不可省略扩展名和文件名。

## 权限

默认情况下，Deno是安全的。因此 Deno 模块没有文件、网络或环境的访问权限，除非您为它授权。在命令行参数中为 deno 进程授权后才能访问安全敏感的功能。

在以下示例中，`mod.ts` 只被授予文件系统的只读权限。它无法对其进行写入，或执行任何其他对安全性敏感的操作。

```sh
$ deno run --allow-read mod.ts
```

### 权限列表


以下权限是可用的：

- `-A`, `--allow-all` 允许所有权限，这将禁用所有安全限制。

- `--allow-env` 允许环境访问，例如读取和设置环境变量。

- `--allow-hrtime` 允许高精度时间测量，高精度时间能够在计时攻击和特征识别中使用。

- `--allow-net=<allow-net>` 允许网络访问。您可以指定一系列用逗号分隔的域名，来提供域名白名单。

- `--allow-plugin` 允许加载插件。请注意：这是一个不稳定功能。

- `--allow-read=<allow-read>` 允许读取文件系统。您可以指定一系列用逗号分隔的目录或文件，来提供文件系统白名单。

- `--allow-run` 允许运行子进程。请注意，子进程不在沙箱中运行，因此没有与 deno 进程相同的安全限制，请谨慎使用。

- `--allow-write=<allow-write>` 允许写入文件系统。您可以指定一系列用逗号分隔的目录或文件，来提供文件系统白名单。

### 权限白名单

Deno 还允许您使用白名单控制权限的粒度。

这是一个用白名单限制文件系统访问权限的示例，仅允许访问 `/usr` 目录，但它会在尝试访问 `/etc` 目录时失败。

```sh
$ deno run --allow-read=/usr https://deno.land/std/examples/cat.ts /etc/passwd

error: Uncaught PermissionDenied: read access to "/etc/passwd", run again with the --allow-read flag
    at unwrapResponse (rt/10_dispatch_json.js:24:13)
    at sendAsync (rt/10_dispatch_json.js:75:12)
    at async Object.open (rt/30_files.js:45:17)
    at async https://deno.land/std@0.68.0/examples/cat.ts:4:16
```

改为 `/etc` 目录，赋予正确的权限，再试一次：

```sh
$ deno run --allow-read=/etc https://deno.land/std/examples/cat.ts /etc/passwd
```

`--allow-write` 也一样，代表写入权限。

### 网络访问

```js
// fetch.ts
const result = await fetch("https://deno.land/");
```

这是一个设置 host 或 url 白名单的示例：

```sh
$ deno run --allow-net=github.com,deno.land fetch.ts
```

如果 `fetch.ts` 尝试与其他域名建立网络连接，那么这个进程将会失败。

允许访问任意地址：

```sh
$ deno run --allow-net fetch.ts
```

## TCP

前面我们已经介绍了如何运行官方的 `welcome` 示例，下面我们来介绍如何使用 Deno 创建一个简单的 TCP echo 服务器。

```js
// 官方示例代码： https://deno.land/std/examples/echo_server.ts

const hostname = "0.0.0.0";
const port = 8080;
const listener = Deno.listen({ hostname, port });

console.log(`Listening on ${hostname}:${port}`);

for await (const conn of listener) {
  Deno.copy(conn, conn);
}
```

相信很多读者会跟我一样，直接在命令行运行以下命令：

```sh
$ deno run  https://deno.land/std/examples/echo_server.ts

error: Uncaught PermissionDenied: network access to "0.0.0.0:8080", run again with the --allow-net flag
    at unwrapResponse (rt/10_dispatch_json.js:24:13)
    at sendSync (rt/10_dispatch_json.js:51:12)
    at opListen (rt/30_net.js:33:12)
    at Object.listen (rt/30_net.js:204:17)
    at https://deno.land/std@0.68.0/examples/echo_server.ts:4:23
```

很明显是权限错误，从错误信息中，Deno 告诉我们需要设置 `--allow-net` 标志，以允许网络访问。为什么会这样呢？这是因为 Deno 是一个 `JavaScript/TypeScript` 的运行时，默认使用安全环境执行代码。下面我们添加 `--allow-net` 标志，然后再次运行 `echo_server.ts` 文件：

```sh
$ deno run --allow-net https://deno.land/std/examples/echo_server.ts

Listening on 0.0.0.0:8080
```

当服务器成功运行之后，我们使用 nc 命令来测试一下服务器的功能：

```sh
$ nc localhost 8080
hell semlinker
hell semlinker
```

## HTTP

友情提示：在实际开发过程中，你可以从 https://deno.land/std 地址获取所需的标准库版本。示例中我们显式指定了版本，当然你也可以不指定版本，比如这样：https://deno.land/std/http/server.ts 。

在上述代码中，我们导入了 Deno 标准库 http 模块中 serve 函数，然后使用该函数快速创建 HTTP 服务器，该函数的定义如下：

```js
// http_server.ts
import { serve } from "https://deno.land/std/http/server.ts";
const s = serve({ port: 8000 });

console.log("http://localhost:8000/");

for await (const req of s) {
  req.respond({ body: "Hello World\n" });
}
```

创建完 HTTP 服务器，我们来启动该服务器，打开命令行输入以下命令：

```sh
$ deno run --allow-net ./http_server.ts

Download https://deno.land/std/http/server.ts
Warning Implicitly using latest version (0.68.0) for https://deno.land/std/http/server.ts
Download https://deno.land/std@0.68.0/http/server.ts
Download https://deno.land/std@0.68.0/encoding/utf8.ts
Download https://deno.land/std@0.68.0/io/bufio.ts
Download https://deno.land/std@0.68.0/_util/assert.ts
Download https://deno.land/std@0.68.0/async/mod.ts
Download https://deno.land/std@0.68.0/http/_io.ts
Download https://deno.land/std@0.68.0/textproto/mod.ts
Download https://deno.land/std@0.68.0/http/http_status.ts
Download https://deno.land/std@0.68.0/async/deferred.ts
Download https://deno.land/std@0.68.0/async/delay.ts
Download https://deno.land/std@0.68.0/async/mux_async_iterator.ts
Download https://deno.land/std@0.68.0/async/pool.ts
Download https://deno.land/std@0.68.0/bytes/mod.ts
Check file:///Users/sunilwang/github/deno_test/http_server.ts

http://localhost:8000/
```

接着打开浏览器，在地址栏上输入 http://localhost:8080/ 地址，之后在当前页面中会看到以下内容：

```
Hello World
```

### HTTP 中间件框架 Oak

Oak 是一个受到 Koa 启发的项目，Koa 是一个很受欢迎并提供 HTTP 服务的 Node.js 中间件框架。我们将会使用 oak 和 Deno 构建一个 Hello Wrod 小应用。

我们需要在我们的项目库中创建两个文件，分别是 `serve.ts` 和 `routes.ts`。一个用于应用，另一个则是用于服务的路由。


`serve.ts` 文件的内容如下面的文件显示。看看我们是如何在 `serve.ts` 文件中从 `oak` 引入 `Application` 模块的。

```js
// serve.ts
import { Application, Context } from 'https://deno.land/x/oak/mod.ts'
import router from './router.ts'

const app = new Application()
const PORT = 8080

// Logger
app.use(async (ctx: Context, next: Function) => {
  await next()
  const rt = ctx.response.headers.get('X-Response-Time')
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`)
})

// Timing
app.use(async (ctx: Context, next: Function) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.response.headers.set('X-Response-Time', `${ms}ms`)
})

app.use(router.routes())
app.use(router.allowedMethods())
// 404
app.use((ctx: Context) => {
  ctx.response.status = 404;
  ctx.response.body = { msg: "Not Found" };
})
console.log(`Listening on port ${PORT}, http://localhost:${PORT}`)

await app.listen({ port: PORT })
```

很显然 Oak 的的灵感来自于 Koa，而路由中间件的灵感来源于 koa-router 这个库。如果你以前使用过 Koa 的话，相信你会很容易上手 Oak。我们来看下面的`routes.ts`

```js
// routes.ts
import { Router, RouterContext } from 'https://deno.land/x/oak/mod.ts'

const router = new Router()

router.get('/', (context: RouterContext) => {
  context.response.body = 'Hello World!'
})

router.get('/router', (context: RouterContext) => {
  context.response.body = 'Hello Router!'
})

router.get('/router/:id', (context: RouterContext) => {
  context.response.body = `Hello Router, Id:${context.params.id}!`
})

export default router
```

创建完 oak 服务，我们来启动该服务器，打开命令行输入以下命令：

```sh
 $ deno run --allow-net ./serve.ts

Check file:///Users/sunilwang/github/deno_test/serve.ts
Listening on port 8080, http://localhost:8080
```
接着打开浏览器，在地址栏上依次输入
 - http://localhost:8080/
 - http://localhost:8080/router
 - http://localhost:8080/router/123
 - http://localhost:8080/404

之后在当前页面中会看到以下内容：

```sh
GET http://localhost:8080/ - 3ms
GET http://localhost:8080/router - 1ms
GET http://localhost:8080/router/123 - 0ms
GET http://localhost:8080/404 - 0ms
```

### 可能碰到的问题

在开发过程中，经常遇到DNS解析域名错误的问题。导致js依赖包没法下载

我们一起来完成以下步骤:

- 先来发现问题

- 域名是否能访问?

- 解析域名(https://www.ipaddress.com/)的IP。在没有使用 openssl 或 shadowsocks 情况下是否能ping通

- 修改Hosts文件
  - win: (C:\Windows\System32\drivers\etc)
  - mac (/etc/hosts)

- 再重新run一下应用


## 总结

Deno 是个很有意思的小工具，但不是下一代的 Node.js，如果有一天有大流量的项目大面积使用，才有学的价值，现在这个时间点只能作为玩具玩玩。

Node.js 还会持续繁荣，就像因为早起的一些设计缺陷，JavaScript 的作者不是很喜欢 js，但是由于出现的时候填补了浏览器脚本的空白，外加生态的繁荣，让 js 一直火爆到今天。

期待 Deno 有新的发展，也看好 Node.js 继续繁荣。

最后送大家自己收藏的Deno 资源全图谱：https://github.com/hylerrix/awesome-deno-cn

## 参考

- Deno 社区：https://deno.js.cn
- Deno 中文官网：https://denolang.cn
- Deno 手册：https://denolang.cn/manual/introduction.html
- https://www.cnblogs.com/coderhf/p/12925869.html

## 本月文章预告

预告下，接下来我们会陆续发布转转在微前端、Umi、组件库等基础架构和中台技术相关的实践与思考，欢迎大家关注，期望与大家多多交流

## 文末福利

转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~

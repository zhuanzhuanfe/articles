## 提到工程化，比较重要的几点：
- 目录规划
- 构建
- 日志
- 部署
- 监控

### 1. 目录规划，这篇不做介绍了，可以参照官网的demo
### 2. 构建
- 打包
###### nuxt提供的命令
```
npm run build
```
通过这个命令，我们发现打包资源都放在.nuxt目录下面，实际上为了统一化我们希望的是存在一个固定名字的文件夹下的方便部署，比如dist/,查看文档，没有相关的选项，so翻源码吧

```
Options.defaults = {
  mode: 'universal',
  dev: process.env.NODE_ENV !== 'production',
  debug: undefined, // Will be equal to dev if not provided
  buildDir: '.nuxt',
  cacheDir: '.cache',
  nuxtAppDir: resolve(__dirname, '../lib/app/'), // Relative to dist
  ...
```
OK默认参数有buildDir，问题解决。
- 环境区分
###### 因为项目需要走沙箱环境，沙箱环境是58v5的域名，和测试环境生产环境的都不一样，需要我们做区分，nuxt.config可以通过build参数做webpack的配置，那就容易了

```
build: {
    extend (config, { isClient }) {
      // Extend only webpack config for client-bundle
      config.devtool = isClient ? false : 'eval-source-map'
      // 自动根据环境配置接口域名
      config.module.rules.push({
        test: /base.conf.js$/,
        enforce: "pre",
        use: [
          {
            loader: 'string-replace-loader',
            query: {
              search: '$apiUrl',
              replace: process.env.NODE_ENV == 'sandbox' ? '//xxxx.58v5.cn/' : '//xxxx/'
            }
          }
        ]
      })
    }
  },
```
这样构建出来的包就可以区分域名了，问题解决。

### 3. 日志
- 资源请求，很方便通过日志中间件来解决，不做介绍。
- 接口请求，因为我们从后端接口拉数据，所以我们可以通过在请求层统一加，判断是否是server请求

###### 因为是后台程序，还会有权限校验问题，这个比较容易

```
token同理
if (isServer) {
    axios.defaults.baseURL = `http:${BASE_URL}api/`
    // 添加headers以便服务端请求
    axios.defaults.headers.cookie = req.headers.cookie
    axios.defaults.headers['user-agent'] = 'node server'
```
###### axios提供了请求拦截

```
axios.interceptors.request.use()
axios.interceptors.response.use()
```
###### 使用之后发现日志打印了好多次
```
第一次
123
server req
server req
server res
server res
第二次
123
server req
server req
server req
server res
server res
server res
第三次
123
server req
server req
server req
server req
server res
server res
server res
server res
```

```
axios.interceptors.request.use(config => successFun(config, 'server req'), failFun)
axios.interceptors.response.use(res => successFun(res, 'server res'), failFun)
    
const successFun = function (data, msg) {
  console.log(msg)
  return data
}
```
###### 首先想到的就是加计数器解决问题
```
let serverLogCount = {
  success: 0,
  fail: 0
}
const successFun = function (data, msg) {
  if (msg === 'server req' && serverLogCount.success < 1) {
    // logger.info(msg, `${data.method} ${data.url}`)
    serverLogCount.success = 1
  } else if (msg !== 'server req' && serverLogCount.success < 2) {
    // logger.info(msg, JSON.stringify(data.data))
    serverLogCount.success = 2
  }
  console.log(msg)
  return data
}
调用的时候
serverLogCount.success = 0
serverLogCount.fail = 0

```
###### 这样问题可以解决，但做技术的我们需要考虑从本质上解决问题

###### 带着这个问题，我们去查看axios的实现

```
// Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
```
###### 比较简单，用队列去控制的，然后我们在做一个简单的demo

```
const successFun = function (config, type) {
  console.info(config)
  console.log('11')
  return config
}

const failFun = function (c) {
  console.log(c)
}

axios.interceptors.request.use(config => successFun(config, 'server req'), failFun)
axios.interceptors.response.use(config => successFun(config, 'server req'), failFun)

调试结果如下：
Debugging with inspector protocol because Node.js v8.4.0 was detected.
node --inspect=16147 --debug-brk axios.js 
Debugger listening on ws://127.0.0.1:16147/503ddcfc-3d2c-4d27-b79f-5f6d8102d7cd
Debugger attached.
11
Object {adapter: , transformRequest: Object, transformResponse: Object, timeout: 0, xsrfCookieName: "XSRF-TOKEN", …}
Object {status: 200, statusText: "OK", headers: Object, config: Object, request: ClientRequest, …}
11
success
Object {status: 200, statusText: "OK", headers: Object, config: Object, request: ClientRequest
```
###### 运行了几次这个用例，得到的结果都是只执行一次回调，说明axios库本身是没问题的，从他的实现机制再来看我们遇到的问题就不难理解了，肯定是每次的重新请求都会重复注册interceptor，那有没有办法使用之后就释放interceptor呢？我们再去仔细看文档

```
If you may need to remove an interceptor later you can.

var myInterceptor = axios.interceptors.request.use(function () {/*...*/});
axios.interceptors.request.eject(myInterceptor);
```
###### 照做之后，问题迎刃而解。

###### 本想通过ctx拿到log函数，因为我们在服务层添加了logger中间件，使用的时候发现，上下文中竟然没有logger...，大写的尴尬。查nuxt源码去吧

###### 我们就从asyncData这个函数去查上下文

```
  // Call asyncData & fetch hooks on components matched by the route.
  let asyncDatas = await Promise.all(Components.map(Component => {
    let promises = []

    // Call asyncData(context)
    if (Component.options.asyncData && typeof Component.options.asyncData === 'function') {
      let promise = promisify(Component.options.asyncData, ctx)
      promise.then(asyncDataResult => {
        context.asyncData[Component.cid] = asyncDataResult
        applyAsyncData(Component)
        return asyncDataResult
      })
      promises.push(promise)
    } else {
      promises.push(null)
    }

    // Call fetch(context)
    if (Component.options.fetch) {
      promises.push(Component.options.fetch(ctx))
    }
    else {
      promises.push(null)
    }

    return Promise.all(promises)
  }))
```
###### 我们发现了ctx，再追
```
export function getContext (context, app) {
  let ctx = {
    isServer: !!context.isServer,
    isClient: !!context.isClient,
    isStatic: process.static,
    isDev: <%= isDev %>,
    isHMR: context.isHMR || false,
    app: app,
    <%= (store ? 'store: context.store,' : '') %>
    route: (context.to ? context.to : context.route),
    payload: context.payload,
    error: context.error,
    base: '<%= router.base %>',
    env: <%= JSON.stringify(env) %>
  }
  const next = context.next
  ctx.params = ctx.route.params || {}
  ctx.query = ctx.route.query || {}
  ctx.redirect = function (status, path, query) {
    if (!status) return
    ctx._redirected = true // Used in middleware
    // if only 1 or 2 arguments: redirect('/') or redirect('/', { foo: 'bar' })
    if (typeof status === 'string' && (typeof path === 'undefined' || typeof path === 'object')) {
      query = path || {}
      path = status
      status = 302
    }
    next({
      path: path,
      query: query,
      status: status
    })
  }
  if (context.req) ctx.req = context.req
  if (context.res) ctx.res = context.res
  if (context.from) ctx.from = context.from
  if (ctx.isServer && context.beforeRenderFns) {
    ctx.beforeNuxtRender = (fn) => context.beforeRenderFns.push(fn)
  }
  if (ctx.isClient && window.__NUXT__) {
    ctx.serverState = window.__NUXT__
    <% if (store) { %>
    ctx.serverStoreState = ctx.serverState.state
    <% } %>
  }
  return ctx
}
```
###### 他的ctx都是固定的几项...又尴尬了不是。

###### 既然不能从ctx中获取，在axios初始化的时候单独引logger吧，暂时也没有其他办法，日志问题解决。

### 部署
###### 可通过在项目根路径下生成ecosystem.config.js方便部署，其他的采用QA统一部署方案，不做详细介绍。

### 监控
###### 采用公司统一的方案，包括日志监控，机器监控，不做详细介绍。

#### 后语
###### 回过头再来看一次nuxt的流程图
![image](https://nuxtjs.org/nuxt-schema.png)
###### 最开始执行的是nuxtServerInit,因为是后台程序，所以我们可以在这里做权限拦截，具体事例不做展示了。
###### 通过这个图我理解，通过nuxt-link点击的链接应该可以重走流程的，但其实没有，我们观察发现只有第一次进入页面才有ssr，这样的话其实只对首屏有帮助，期待官方早日解决吧。


```
This component is used to link the page components between them.
At the moment, <nuxt-link> is the same as <router-link>, so we recommend you to see how to use it on the vue-router documentation.

Example (pages/index.vue):

<template>
  <div>
    <h1>Home page</h1>
    <nuxt-link to="/about">About</nuxt-link>
  </div>
</template>
In the future, we will add features to the nuxt-link component, like pre-fetching on the background for improving the responsiveness of nuxt.js applications.
```

> 官网的说明。

###### 今天就到这了，第二篇关于nuxtjs的分享，计划中还有最后一篇，待时间比较充裕来个nuxt源码解读。



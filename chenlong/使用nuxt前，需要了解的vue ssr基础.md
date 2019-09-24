#使用nuxt前，需要了解的vue ssr基础

## Vue SSR概述

### 什么是SSR
Server Side Rendering(服务端渲染)

### SSR的优点
- 更好的 SEO
- 更快的内容到达时间

### SSR方案的权衡之处
- 开发条件所限
- 涉及构建设置和部署的更多要求
- 更多的服务器端负载

### Vue SSR基本使用

#### 一个最简单的示例（官方）

```
const Vue = require('vue')
const server = require('express')()
const renderer = require('vue-server-renderer').createRenderer()

server.get('*', (req, res) => {
  const app = new Vue({
    data: {
      url: req.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })

  renderer.renderToString(app, (err, html) => {
    if (err) {
      res.status(500).end('Internal Server Error')
      return
    }
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Hello</title></head>
        <body>${html}</body>
      </html>
    `)
  })
})

server.listen(8080)
```
vue ssr的核心就是：
- 建立node服务
- 将vue对象转换字符串，返回

### Vue SSR需要做哪些事情呢
#### 1）避免单例状态
当编写纯客户端 (client-only) 代码时，我们习惯于每次在新的上下文中对代码进行取值，但Node.js 服务器是一个长期运行的进程。

当我们的代码进入该进程时，它将进行一次取值并留存在内存中。这意味着如果**创建一个单例对象，它将在每个传入的请求之间共享**。

我们需要**为每个请求创建一个新的根 Vue 实例**，==如果我们在多个请求之间使用一个共享的实例，很容易导致交叉请求状态污染==

```
// vue实例工厂
const createApp = createApp (context) {
  return new Vue({
    data: {
      url: context.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })
}

server.get('*', (req, res) => {
  const context = { url: req.url }
  // 每次请求都生成一个新的实例
  const app = createApp(context)

  renderer.renderToString(app, (err, html) => {
    res.end(html)
  })
})
```

#### 2）构建项目
**（1）通过webpack 来打包我们的 Vue 应用程序**
- 通常 Vue 应用程序是由 webpack 和 vue-loader 构建，并且许多 webpack 特定功能不能直接在 Node.js 中运行（例如通过 file-loader 导入文件，通过 css-loader 导入 CSS）。
>

- 尽管 Node.js 最新版本能够完全支持 ES2015 特性，我们还是需要转译客户端代码以适应老版浏览器。这也会涉及到构建步骤。

所以，对于客户端应用程序和服务器应用程序，我们都要使用 webpack 打包：

- **服务器需要【服务器 bundle】然后用于服务器端渲染(SSR)**
- **而【客户端 bundle】会发送给浏览器，用于混合静态标记**。
![image](https://pic4.zhuanstatic.com/zhuanzh/n_v2d45b02682c9c4f52b6ef7723e8ea3152.png)

**（2）webpack源码结构**

![image](https://pic1.zhuanstatic.com/zhuanzh/n_v27ed1144a0ca74e13a9319f5f643c44b5.png)

基本上和普通vue项目没什么区别，主要强调一下下面几个文件

**router.js** 路由

服务器代码使用了一个 * 处理程序，它接受任意 URL。这允许我们将访问的 URL 传递到我们的 Vue 应用程序中，然后对客户端和服务器复用相同的路由配置！

所以官方建议使用**vue-router**

vue ssr路由采用**history**方式
```
// router.js
import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export function createRouter () {
    return new Router({
        mode: 'history',
        routes: [
            { path: '/', component: () => import('@/components/Home') }
        ]
    })
}
```

**app.js**

app.js 创建根实例的工厂函数
```
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'
import './assets/common.css'
import '@node_modules/font-awesome/css/font-awesome.min.css'

export function createApp () {
    // 创建router 和 store 实例
    const router = createRouter()
    const store = createStore()

    sync(store, router)

    const app = new Vue({
        // 注入router 到跟 vue实例
        router,
        store,
        render: h => h(App)
    })

    return { app, router, store }
}
```
**entry-server.js**
服务器 entry 使用 default export 导出函数，并在每次渲染中重复调用此函数

```
import { createApp } from './app'

export default context => {
    // 有可能是异步路由钩子函数或组件，所以将返回一个Promise
    // 以便服务器能够等待所有的内容在渲染前 就已经准备就绪
    return new Promise((resolve, reject) => {
        const { app, router, store } = createApp()

        router.push(context.url)

        // 等到 router 将可能的异步组件和钩子函数解析完
        router.onReady(() => {
            const matchedComponents = router.getMatchedComponents()
            if (!matchedComponents.length){
                return reject({ code: 404 })
            }
            // 对所有匹配的路由组件调用 asyncData
            Promise.all(matchedComponents.map(Component => {
                if(Component.asyncData){
                    return Component.asyncData({
                        store,
                        router: router.currentRoute
                    })
                }
            })).then(() => {
                // 在所有预取钩子 resolve后， store已经填充渲染应用程序所需的状态
                // 将状态附加到上下文
                // 状态将自动序列化为 `window.__INITIAL_STATE__`，并注入 HTML。
                context.state = store.state

                resolve(app)
            }).catch(reject)
        }, reject)
    })
}
```

> router.onReady 是干什么用的

在所有的vue组件创建之前（包括App.vue）调用，这意味着它可以解析所有的异步进入钩子和路由初始化相关联的异步组件。


这可以有效确保服务端渲染时服务端和客户端输出的一致。

**entry-client.js**
客户端 entry 只需创建应用程序，并且将其挂载到 DOM 中：

```
import Vue from 'vue'
import { createApp } from './app'

const { app, router, store } = createApp()

if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__)
}

router.onReady(() => {
  // 添加路由钩子函数，用于处理 asyncData.
  // 在初始路由 resolve 后执行，
  // 以便我们不会二次预取(double-fetch)已有的数据。
  // 使用 `router.beforeResolve()`，以便确保所有异步组件都 resolve。
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    // 我们只关心非预渲染的组件
    // 所以我们对比它们，找出两个匹配列表的差异组件
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })

    if (!activated.length) {
      return next()
    }

    // 这里如果有加载指示器 (loading indicator)，就触发

    Promise.all(activated.map(c => {
      if (c.asyncData) {
        return c.asyncData({ store, route: to })
      }
    })).then(() => {

      // 停止加载指示器(loading indicator)

      next()
    }).catch(next)
  })

  app.$mount('#app')
})
```

**server.js**
```
// server.js
const express = require('express')
const { createBundleRenderer } = require('vue-server-renderer')

const app = express()
function createRenderer (bundle, options) {
  return createBundleRenderer(bundle, Object.assign(options, {
    cache: new LRU({
      max: 1000,
      maxAge: 1000 * 60 * 15
    }),
    basedir: resolve('./dist'),
    runInNewContext: false
  }))
}

let renderer
let readyPromise
const templatePath = resolve('./src/index.template.html')
if (isProd) {
  // In production: create server renderer using template and built server bundle.
  // The server bundle is generated by vue-ssr-webpack-plugin.
  const template = fs.readFileSync(templatePath, 'utf-8')
  const bundle = require('./dist/vue-ssr-server-bundle.json')
  // The client manifests are optional, but it allows the renderer
  // to automatically infer preload/prefetch links and directly add <script>
  // tags for any async chunks used during render, avoiding waterfall requests.
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  renderer = createRenderer(bundle, {
    template,
    clientManifest
  })
} else {
  // In development: setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  readyPromise = require('./build/setup-dev-server')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options)
    }
  )
}


function render (req, res) {
  const s = Date.now()

  res.setHeader("Content-Type", "text/html")
  res.setHeader("Server", serverInfo)

  const handleError = err => {
    if (err.url) {
      res.redirect(err.url)
    } else if(err.code === 404) {
      res.status(404).send('404 | Page Not Found')
    } else {
      // Render Error Page or Redirect
      res.status(500).send('500 | Internal Server Error')
      console.error(`error during render : ${req.url}`)
      console.error(err.stack)
    }
  }

  const context = {
    title: 'Vue HN 2.0', // default title
    meta: `<mata charset="utf-8">`,
    url: req.url
  }
  renderer.renderToString(context, (err, html) => {
    if (err) {
      return handleError(err)
    }
    res.send(html)
    if (!isProd) {
      console.log(`whole request: ${Date.now() - s}ms`)
    }
  })
}

app.get('*', isProd ? render : (req, res) => {
  readyPromise.then(() => render(req, res))
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`server started at localhost:${port}`)
})
```
这么长，那server入口文件都做了什么呢，总结一下：
- 创建node服务
- 定义render逻辑
- 加入缓存逻辑（通常为页面缓存）
- 返回页面字符串

**（3）webpack配置**

webpack配置是一个很复杂的过程，不建议自己从头搭建

我们可以参照一个网上的例子 https://github.com/mtgr1020/vue-ssr-webpack4

#### 3）数据预取和状态
首屏渲染依赖于一些异步数据，**那么在开始渲染过程之前，需要先预取和解析好这些数据**

==另一个需要关注的问题是在客户端，在挂载 (mount) 到客户端应用程序之前，需要获取到与服务器端应用程序完全相同的数据 - 否则，客户端应用程序会因为使用与服务器端应用程序不同的状态，然后导致混合失败。==

为了解决这个问题，**获取的数据需要位于视图组件之外，即放置在专门的数据预取存储容器**中

于是需要引入**vuex**


```
// store.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import { fetchItem } from '../api'

export function createStore () {
    return new Vuex.Store({
        state: {
            items: {}
        },
        actions: {
            fetchItem ({ commit }, id) {
                return fetchItem(id).then(item => {
                    commit('setItem', { id, item })
                })
            }
        },
        mutations: {
            setItem (state, { id, item }) {
                Vue.set(state.items, id, item)
            }
        }
    })
}
```
然后再看 app.js：

```
// app.js
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import { sync } from 'vuex-router-sync'

export function createApp () {
  // 创建 router 和 store 实例
  const router = createRouter()
  const store = createStore()

  // 同步路由状态(route state)到 store
  sync(store, router)

  // 创建应用程序实例，将 router 和 store 注入
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  // 暴露 app, router 和 store。
  return { app, router, store }
}
```
每一次访问都要创建一个新的vue对象，同时应用新的router和store对象

**带有逻辑配置的组件**

Vue SSR路由组件上暴露出一个自定义静态函数 **asyncData**，
> 注意：由于此函数会在组件实例化之前调用，所以它无法访问 this。需要将 store 和路由信息作为参数传递进去


```
<!-- Item.vue -->
<template>
  <div>{{ item.title }}</div>
</template>

<script>
export default {
  asyncData ({ store, route }) {
    // 触发 action 后，会返回 Promise
    return store.dispatch('fetchItem', route.params.id)
  },
  computed: {
    // 从 store 的 state 对象中的获取 item。
    item () {
      return this.$store.state.items[this.$route.params.id]
    }
  }
}
</script>
```


**服务器端数据预取**

在 entry-server.js 中，我们可以通过路由获得与 router.getMatchedComponents() 相匹配的组件，**如果组件暴露出 asyncData，我们就调用这个方法。然后我们需要将解析完成的状态，附加到渲染上下文(render context)中。**


```
// entry-server.js
import { createApp } from './app'

export default context => {
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()

    router.push(context.url)

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // 对所有匹配的路由组件调用 `asyncData()`
      Promise.all(matchedComponents.map(Component => {
        if (Component.asyncData) {
          return Component.asyncData({
            store,
            route: router.currentRoute
          })
        }
      })).then(() => {
        // 在所有预取钩子(preFetch hook) resolve 后，
        // 我们的 store 现在已经填充入渲染应用程序所需的状态。
        // 当我们将状态附加到上下文，
        // 并且 `template` 选项用于 renderer 时，
        // 状态将自动序列化为 `window.__INITIAL_STATE__`，并注入 HTML。
        context.state = store.state

        resolve(app)
      }).catch(reject)
    }, reject)
  })
}
```
**客户端数据预取**

1）在路由导航之前解析数据

使用此策略，应用程序会等待视图所需数据全部解析之后，再传入数据并处理当前视图。好处在于，可以直接在数据准备就绪时，传入视图渲染完整内容，但是如果数据预取需要很长时间，用户在当前视图会感受到"明显卡顿"。因此，如果使用此策略，建议提供一个数据加载指示器

2）匹配要渲染的视图后，再获取数据

此策略将客户端数据预取逻辑，放在视图组件的 beforeMount 函数中。当路由导航被触发时，可以立即切换视图，因此应用程序具有更快的响应速度。然而，传入视图在渲染时不会有完整的可用数据。因此，对于使用此策略的每个视图组件，都需要具有条件加载状态。

这两种策略是根本上不同的用户体验决策，应该根据你创建的应用程序的实际使用场景进行挑选。但是**无论你选择哪种策略，当路由组件重用（同一路由，但是 params 或 query 已更改，例如，从 user/1 到 user/2）时，也应该调用 asyncData 函数**

### 客户端激活
Vue 在浏览器端接管由服务端发送的静态 HTML，使其变为由 Vue 管理的动态 DOM 的过程。

在 entry-client.js 中，我们用下面这行挂载(mount)应用程序：


由于服务器已经渲染好了 HTML，我们显然无需将其丢弃再重新创建所有的 DOM 元素。相反，我们需要"激活"这些静态的 HTML，然后使他们成为动态的（能够响应后续的数据变化）。


```
<div id="app" data-server-rendered="true">
```
data-server-rendered 特殊属性，让客户端 Vue 知道这部分 HTML 是由 Vue 在服务端渲染的，并且应该以激活模式进行挂载


```
// 强制使用应用程序的激活模式
app.$mount('#app', true)
```
在开发模式下，Vue 将推断客户端生成的虚拟 DOM 树 (virtual DOM tree)，是否与从服务器渲染的 DOM 结构 (DOM structure) 匹配。如果无法匹配，它将退出混合模式，丢弃现有的 DOM 并从头开始渲染。在生产模式下，此检测会被跳过，以避免性能损耗


### SSR项目和普通h5项目的区别（重点）
#### 1）服务器上的数据响应
- 数据进行响应式的过程在服务器上是多余的，所以默认情况下禁用。
- 禁用响应式数据，还可以避免将「数据」转换为「响应式对象」的性能开销
#### 2）组件生命周期钩子函数
- 仅会执行beforeCreate 和 created两个钩子函数
- 避免在这两个生命周期中执行全局副作用的代码，如setInterval
#### 3）访问特定平台(Platform-Specific) API
- 如：window 或 document
- 对于仅浏览器可用的 API，通常方式是，在「纯客户端 (client-only)」的生命周期钩子函数中惰性访问 (lazily access) 它们。
- 考虑到如果第三方 library 不是以上面的通用用法编写，则将其集成到服务器渲染的应用程序中，可能会很棘手。你可能要通过模拟 (mock) 一些全局变量来使其正常运行，但这只是 hack 的做法，并且可能会干扰到其他 library 的环境检测代码。
#### 4）自定义指令
大多数自定义指令直接操作 DOM，因此会在服务器端渲染 (SSR) 过程中导致错误
- 推荐使用组件作为抽象机制，并运行在「虚拟 DOM 层级(Virtual-DOM level)」（例如，使用渲染函数(render function)）
- 如果你有一个自定义指令，但不是很容易替换为组件，则可以在创建服务器 renderer 时，使用 directives 选项所提供"服务器端版本(server-side version)"。
#### 5）服务端无法自动补齐标签
使用「SSR + 客户端混合」时，需要了解的一件事是，浏览器可能会更改的一些特殊的 HTML 结构。例如，当你在 Vue 模板中写入：
```
<table>
  <tr><td>hi</td></tr>
</table>
```
浏览器会在 <table> 内部自动注入 <tbody>，然而，由于 Vue 生成的虚拟 DOM (virtual DOM) 不包含 <tbody>，所以会导致无法匹配。为能够正确匹配，请确保在模板中写入有效的 HTML。

#### 6）避免单例状态
#### 7）复杂的webpack配置
## 总结：那自己写SSR都需做哪些事情呢

**1）自行维护node服务**
- 创建node服务，如express服务
- 请求相关内容及容错处理
- 各部分衔接逻辑

**2）自己维护vue**
- 复杂的webpack配置
- 路由逻辑
- 模板和拼接逻辑（render部分）
- 前后端数据一致处理

**3）基础优化部分要自己处理**


ok，以上就最近看的一些vue ssr基础

因为最近一直在用nuxt开发项目，具体vue ssr都做了什么不清楚。
主要目的还是基础扫盲。

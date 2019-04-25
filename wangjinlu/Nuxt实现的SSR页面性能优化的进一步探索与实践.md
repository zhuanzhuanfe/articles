### 前言

本文之前，先简单介绍以下几个概念:

SSR指服务端渲染，即页面是通过服务端渲染生成后返回给客户端的，SSR主要为了提高页面加载速度，改善用户体验，也可用于SEO搜索引擎优化。

Nuxt.js 官方定义： Nuxt.js 是一个基于 Vue 的通用应用框架。 通过对客户端/服务端基础架构的抽象组织，Nuxt.js 主要关注的是应用的 UI渲染。

个人理解：Nuxt.js 是预设了开发服务端渲染应用所需要的各种配置，并使用 Webpack 和 Node.js 进行封装的基于Vue的SSR框架。

### 背景

我们部门从事的都是面对用户的业务需求开发，面对用户，意味着对页面的体验要求会更高，最直观体验是页面首屏的加载速度，加载速度优化是我们体验优化的长期、重要的一部分；本文的起源正是首屏加载速度优化。

页面加载速度优化的核心包括三点：减少资源文件的请求数量；减小每个资源文件的大小；提高每个资源的加载速度；

诸如合并API访问，压缩混淆文件，支持webp图片，资源cdn缓存等等常用办法，都是以上面三个核心为出发点的；
这些常用办法基本都可以通过webpack配置，公司基础服务，代码较小的变更完成。

我们负责的各主流量入口页面，已基本做过以上常用的优化，但由于主入口页面资源量较大的原因，优化后也不能达到预期的效果，我们需要探索其它优化方案。
我们快速想到了用SSR的方案进一步解决加载速度问题，从零开始的搭建服务端渲染应用相当复杂，肯定会涉及到服务端的开发，作为独立的前端团队，成本较高昂；
我们决定尝试是否能找到一种成本较低的现有框架，以达到目的；

因主入口页面技术栈为vue，方案调研中自然而然的看到了Nuxt.js此种基于Vue的SSR框架；
Nuxt.js和项目技术栈匹配度急高，学习成本极低，自然成为我们的第一选择；

我们引入Nuxt.js，最初只是利用了服务端异步获取API接口数据和服务端渲染两项功能，去重构了我们的项目，重构后效果基本达到我们的预期，正常网络状态下，基本可以达到秒开；
入口页面，团队是作为一个长期的项目进行不定期优化的，我们逐步围绕Nuxt.js框架，做了进一步升级，本文主要介绍我们Nuxt.js页面优化的进一步探索与实践；
至于如何搭建初步的Nuxt项目，需要感兴趣的各位自行查看官方文档及自我实践了，本文不做赘述。

### 探索与实践
我们主要的探索与实践可行方向主要有两个：

一、Nuxt.js特性合理应用

应用到的特性主要包括asyncData异步获取数据、mounted不支持服务端渲染、no-ssr组件不在服务端渲染中呈现；

通过相关特性做到API数据和页面结构合理拆分，首屏所需数据和结构通过服务端获取并渲染，非首屏数据和结构通过客户端获取并渲染。

示例代码：

no-ssr结构拆分
```
<template>
  <div>
    <!-- 顶部banner -->
    <banner :banner="banner" />
    <!-- 非首屏所需结构，通过no-ssr组件达到不在服务端渲染目的-->
    <no-ssr>
      <!-- 商品列表 -->
      <prod-list :listData="listData"/>
    </no-ssr>
  </div>
</template>
```
API数据拆分
```
export default {
  async asyncData({ app, query }) {
    try {
      // 获取页面顶部轮播图信息
      const getBanner = () => {
        return app.$axios.$get('zz/zy/banner')
      }
      // 获取底部配置信息
      const getFooter = () => {
        return app.$axios.$get('zz/zy/footer', {
          params: {
            smark: query.smark
          }
        })
      }
      // 并发获取首屏数据，服务端获取
      const [banner, footer] = await Promise.all([getBanner(), getFooter()])
      return {banner: banner, footer: footer}
    } catch (e) {
      console.log('interface timeout or format error => ', e)
      return {}
    }
  },
  mounted() {
    // 非首屏使用的数据, 客户端获取
    this.loadListData()
  },
  methods: {
    loadListData() {
      this.$axios.$get('zz/zy/list').then(() => {
        // 数据处理逻辑
      })
    }
  }
}
```
二、服务端引入缓存

服务端开发意味着缓存可作为性能优化的最直接法门，Nuxt.js作为一种服务端渲染框架，也不例外；针对不同的页面，不同的数据状态，可主要区分为下面三类缓存：

1、API接口数据缓存

将服务端获取的数据，全部缓存到node进程内存中，定时刷新，有效期内请求都通过缓存获取API接口数据，减小数据获取时间；

此种缓存适用于缓存的部分API数据，基本保持不变，变更不频繁，与用户个人数据无关。

示例代码：
```
  import LRU from 'lru-cache'
  const CACHED = new LRU({
    max: 100, // 缓存队列长度
    maxAge: 1000 * 60 // 缓存时间
  })
  export default {
    async asyncData({ app, query }) {
      try {
        let banner, footer
        if (CACHED.has('baseData')) {
          // 存在缓存，使用缓存数据
          let data = CACHED.get('baseData')
          data = JSON.parse(data)
          banner = data.banner
          footer = data.footer
        } else {
          // 获取页面顶部轮播图信息
          const getBanner = () => {
            return app.$axios.$get('zz/zy/banner')
          }
          // 获取底部配置信息
          const getFooter = () => {
            return app.$axios.$get('zz/zy/footer', {
              params: {
                smark: query.smark
              }
            })
          }
          [banner, footer] = await Promise.all([getBanner(), getFooter()])
          // 将数据写入缓存
          CACHED.set('baseData', JSON.stringify({ banner: banner, footer: footer}))
        }
        return {mods: mods, footer: footer}
      } catch (e) {
        console.log('interface timeout or format error => ', e)
        return {}
      }
    }
  }
```

2、组件级别缓存

将渲染后的组件DOM结构存入缓存，定时刷新，有效期通过缓存获取组件DOM结构，减小生成DOM接口所需时间；

适用于渲染后结构不变或只有几种变换、并不影响上下文的组件。

示例代码：

nuxt.config.js配置项修改
```
const LRU = require('lru-cache')
module.exports = {
  render: {
    bundleRenderer: {
      cache: LRU({
        max: 1000, // 缓存队列长度
        maxAge: 1000 * 60 // 缓存1分钟
      })
    }
  }
}
```
需要做缓存的 vue 组件， 需增加 name 以及 serverCacheKey 字段，以确定缓存的唯一键值。
```
export default {
  name: 'zzZyHome',
  props: ['type'],
  serverCacheKey: props => props.type
}
```
如果组件依赖于很多的全局状态，或者状态取值非常多，缓存会因频繁被设置而导致溢出，这样的组件做缓存就没有多大意义了；

另外组件缓存，只是缓存了dom结构，如created等钩子中的代码逻辑并不会被缓存，如果其中逻辑会影响上下边变更，是不会再执行的，此种组件也不适合缓存。

3、页面整体缓存

当整个页面与用户数据无关，依赖的数据基本不变的情况下，可以对整个页面做缓存，减小页面获取时间;

页面整体缓存前提是在使用Nuxt.js脚手架工具create-nuxt-app初始化项目时，必须选择集成服务器框架，如express、koa，只有这样才具有服务端中间件扩展的功能。

示例代码：

服务端中间件middleware/page-cache.js
```
const LRU = require('lru-cache')
let cachePage = new LRU({
 max: 100, // 缓存队列长度
 maxAge: 1000 * 60 // 缓存1分钟
})
export default function(req, res, next){
  let url = req._parsedOriginalUrl
  let pathname = url.pathname
  // 通过路由判断，只有首页才进行缓存
  if (['/home'].indexOf(pathname) > -1) {
    const existsHtml = cachePage.get('homeData')
    if (existsHtml) {
      return res.end(existsHtml.html, 'utf-8')
    } else {
      res.original_end = res.end
      // 重写res.end
      res.end = function (data) {
        if (res.statusCode === 200) {
         // 设置缓存
         cachePage.set('homeData', { html: data})
        }
        // 最终返回结果
        res.original_end(data, 'utf-8')
      }
    }
  }
  next()
}
```
nuxt.config.js配置项修改，引入服务端中间件
```
//针对home路由做缓存
serverMiddleware: [
  { path: '/home', handler: '~/middleware/page-cache.js' },
]
```
### 总结

本文主要是针对Nuxt.js框架实现的页面，性能优化方案进一步探索和实践的总结，汇总一些思路与方向；期望各位小伙伴在其它SSR相关页面优化过程中，能起到一定的启发作用。

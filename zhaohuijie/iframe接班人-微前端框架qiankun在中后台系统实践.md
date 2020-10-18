# iframe接班人-微前端框架qiankun在中后台系统实践

> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦


## 背景

在转转的中台业务中，交易流转、业务运营和商户赋能等功能，主要集中在两个系统中（暂且命名为 `inner/outer` ）。 两个系统基座(功能框架)类似，以inner系统为例，如图：

![inner系统基座](https://pic3.zhuanstatic.com/zhuanzh/c477a8af-c897-46e8-a8df-cccb2c58a239.jpg)


## 业务现状问题

> **维护迭代，随时间延续是不可避免的**

至今，`inner/outer` 均有以下特点：

- **页面结构繁杂** 分类较多，菜单页面多；布局五花八门，不统一
- **技术栈不统一** 历史原因，存在 `jquery`、`静态模板`、`react` 等技术栈
- **权限不统一** 不同用户，权限不一样，使用的功能模块不同
- **项目管理不统一** 部分功能模块是由业务方维护；同一功能模块面向不同用户角色，也需要在不同系统中使用

初次接触上述问题时，闪现在脑海里的是：用 **iframe** 呀。确实，刚开始也是这样做的。


> **问题暴露，在维护迭代中是个契机**

系统在一个长时间跨度的运行下，随着维护人员的变迁、使用人群的增多，更多的问题也接踵而至：

- **样式不统一**

由于没有统一规范，每个功能模块在不同的开发者键盘下设想的结构不同，输出的风格也不统一，使整个系统看起来略显杂乱。

- **浏览器前进/后退**

首先，`iframe` 页面没有自己的历史记录，使用的是基座(父页面)的浏览历史。
所以，当`iframe` 页在内部进行跳转时，浏览器地址栏无变化，基座中加载的 `src` 资源也无变化，当浏览器刷新时，无法停留在`iframe`内部跳转后的页面上，需要用户重新走一遍操作，体验上会大打折扣。

- **弹窗遮罩层覆盖可视范围**

`iframe` 页产生的弹窗，一般只能遮罩 `iframe` 区域。

- **页面间消息传递**

与基座非同源下，`iframe` 无法直接获取基座 `url` 的参数，消息传递需要周转一下，如使用`postmessage`来实现；而动态创建的 `iframe` 页，或许还需要借助本地存储等。

- **页面缓存**

`iframe` 资源变更上线后，打开系统会发现 `iframe` 页依旧是老资源。需要用时间戳方案或强制刷新。

- **加载异常处理**

与基座非同源下，`onerror` 事件无法使用。
使用 `try catch` 解决此问题，尝试获取 `contentDocument` 时将抛出异常

---

以上问题，从业务价值看，对用户的使用体验会有损失；从工程价值看，希望能通过技术提升业务体验的同时，也提高系统的维护性。


## 改进实践 - 微前端

> **实践新技术，在问题暴露时是方向**

大多数工程师，包括我，一边儿嘴里说着：学不动啦！ 一边儿想尝试一些新方式来优化系统。

结合问题分类，有思考一些尝试方向，如：

- **中后台UI规范**：历经迭代，百花齐放，然而更需要的是找到合适我司的风格，保持一致性。

  此部分这次不再细说，可以 **关注我们公众号 - 大转转FE**，后续我们会有专门的文章讲这部分。

另外，大互联网时代，从工程角度看，社区对类似系统的探索有很多，除了 `iframe` 外，也有不少相对成熟的替代方案：

**1. single-spa**
**2. qiankun**

提起这两个，就要提一下微前端理念，目前社区有很多关于微前端架构的介绍，这里简单提一下：

>Techniques, strategies and recipes for building a modern web app with multiple teams that can ship features independently. — Micro Frontends

大致是说，微前端有以下特点：

1. 技术栈无关：基座不限制子应用的技术栈
2. 完全独立：子应用独立部署维护，接入时基座同步更新；又可独立运行

基于此，不难想到：`iframe` 也是符合微前端理念的。那其他方案又是如何做的呢？

### single-spa

社区里single-spa介绍也不少。根据demo比葫芦画瓢，可以知道它的架构分布：

![single-spa架构](https://pic5.zhuanstatic.com/zhuanzh/46cb0e25-4989-45e1-bcfb-d5305e769b14.png)

启动服务的配置主要是在`single-spa-config` 文件中，包含项目名称、
项目地址、路由配置等：

``` js
// single-spa-config.js
import {registerApplication, start } from 'single-spa';

// 子应用唯一ID
const microAppName = 'react';

// 子应用入口
const loadingFunction = () => import('./react/app.js');

// url前缀校验
const activityFunction = location => location.pathname.startsWith('/react');

// 注册
registerApplication(
  microAppName,
  loadingFunction,
  activityFunction
);

//singleSpa 启动
start();

```

single-spa让基座和子应用共用一个 `document`，那就需要对子应用进行改造：把子项目的容器和生成的 `js` 插入到基座项目中。

- 不需要 `HTML` 入口文件，
- `js` 入口文件导出的模块，必须包括 `bootstrap`、`mount` 和 `unmount` 三个方法。

``` html
<div id='micro-react'></div>
<script src=/js/chunk-vendors.js> </script>
<script src=/js/app.js> </script>
```

不过这种方式需要对现有项目的打包方式和配置项进行改造，成本很大。所以，对于已有的工程项目，我选择了放弃使用。

### qiankun

qiankun 也是社区提到比较多的一个开源框架，是基于`single-spa` 实现了开箱即用。可以采用`html entry` 方式接入子应用，且子应用只需暴露一些生命周期，改动较少。【**少**】这个点，真是让我跃跃欲试。

目前我司业务场景是**单实例模式**（一个运行时只有一个子应用被激活），我们可以根据一张图来看看单实例下以`html entry`方式qiankun实现流程：

![qiankun原理](https://pic4.zhuanstatic.com/zhuanzh/290b1665-cae8-490a-aea9-e52b0a826700.png)


如上图所示，一个子应用的全过程有：

- 初始化配置，匹配出子应用
- 初始化子应用，加载对应的html资源，以及创建JS沙箱环境
- 挂载子应用，执行生命周期钩子函数
- 卸载子应用，当切换路由时，执行各卸载钩子函数，以及卸载JS沙箱环境，清除容器节点

具体实现细节，大家可以参考`qiankun`源码。

#### 实践

- **基座**

从规范化开发角度，我司的中后台系统是基于umi开发（详细可参考我们之前的文章 [umi中后台项目实践](https://mp.weixin.qq.com/s/Vb3HaJE5o5Rz87I6YlHwPA)）。在构建主应用使用了配套的qiankun插件：`@umijs/plugin-qiankun`。

**1. 初始化配置项，注册子应用**

插件安装之后，我们可以在入口文件里配置：

此处主要以**运行时**为例

``` js
// app.js
export const qiankun = Promise.resolve().then(() => ({
  // 运行时注册子应用信息
  apps: [
    {
      // 结算单管理
      name: 'settlement', // 唯一id，与子应用的library 保持一致
      entry: '//xxx', // html entry
      history: 'hash', // 子应用的 history 配置，默认为当前主应用 history 配置
      container: '#root-content', // 子应用存放节点
      mountElementId: 'root-content' // 子应用存放节点
    }, {
      // 公告消息
      name: 'news', // 唯一id，与子应用的library 保持一致
      entry: '//xxx', // html entry
      history: 'hash', // 子应用的 history 配置，默认为当前主应用 history 配置
      container: '#root-content', // 子应用存放节点
      mountElementId: 'root-content' // 子应用存放节点
    }
  ],
  jsSandbox: { strictStyleIsolation: true }, // 是否启用 js 沙箱，默认为 false
  prefetch: true, // 是否启用 prefetch 特性，默认为 true
  lifeCycles: {
    // see https://github.com/umijs/qiankun#registermicroapps
    beforeLoad: (props) => {
      return Promise.resolve(props).then(() => loading())
    },
    afterMount: (props) => {
      console.log('afterMount', props)
    },
    afterUnmount: (props) => {
      console.log('afterUnmount', props)
    }
  }
}))
```

**2. 装载子应用，在路由配置中使用`microApp`来获取相应的子应用名称：**

``` js
// router.config.js
export default [
  {
    path: '/',
    component: '../layouts/BasicLayout',
    routes: [
      ...
      {
        path: '/settlement/list',
        name: '结算单管理',
        icon: 'RedEnvelopeOutlined',
        microApp: 'settlement',  // 子应用唯一id
      },
      {
        path: '/settlement/detail/:id',
        name: '结算单管理',
        icon: 'RedEnvelopeOutlined',
        microApp: 'settlement', // 子应用唯一id
        hideInMenu: true,
      },
      ...
      ...
      {
        component: './404',
      },
    ],
  },
  {
    component: './404',
  },
]
```

以上就是基座的改动点，看起来代码侵入性很少。


- **子应用**

在子应用中，需要做如下的配置

**1. 入口文件设置baseName，及暴露钩子函数**

``` js
//设置主应用下的子应用路由命名空间
const BASE_NAME = window.__POWERED_BY_QIANKUN__ ? "/settlement" : "";

// 独立运行时，直接挂载应用
if (!window.__POWERED_BY_QIANKUN__) {
  effectRender();
}

// 在子应用初始化的时候调用一次
export async function bootstrap() {
  console.log("ReactMicroApp bootstraped");
}

export async function mount(props) {
  console.log("ReactMicroApp mount", props);
  effectRender(props);
}

//卸载子应用的应用实例
export async function unmount(props) {
  const { container } = props || {};
  ReactDOM.unmountComponentAtNode(document.getElementById('root-content')
  );
}
```

**2. webpack配置中，需要设置输出为umd格式：**

``` js
// 设置别名
merge: {
  plugins: [new webpack.ProvidePlugin({
    React: 'react',
    PropTypes: 'prop-types'
  })],
  output: {
    library: `[name]`, // 子应用的包名，这里与主应用中注册子应用名称一致
    libraryTarget: "umd", // 所有的模块定义下都可运行的方式
    jsonpFunction: `webpackJsonp_ReactMicroApp`, // 按需加载
  }
} //自定义webpack配置
```

OK，配置完成!

理论上，启动项目，部署等都应该没有问题了。 咦，打开地址，页面一直在loading，控制台一堆报错，看起来要踩一踩坑了。


#### 踩坑

**1. 版本一致性**

如果主应用和子应用都是基于 `umi` 框架，在使用 `@umijs/umi-plugin-qiankun` 插件时，要使用同一个版本，否则子应用报错。

**2. 跨域**

qiankun 是通过 `fetch` 去获取子应用资源的，所以必须支持跨域

``` js
const mountDOM = appWrapperGetter();
const { fetch } = frameworkConfiguration;
const referenceNode = mountDOM.contains(refChild) ? refChild : null;

if (src) {
  execScripts(null, [src], proxy, {
    fetch,
    strictGlobal: !singular,
    beforeExec: () => {
      Object.defineProperty(document, 'currentScript', {
        get(): any {
          return element;
        },
        configurable: true,
      })
    };
  })
}
```

比如：基座地址为 `b.zhuanzhuan.com`， 子应用为 `d.zhuanzhuan.com` 。 当基座去加载子应用时，会出现跨域错误。

曾经有采用通过 `Node` 服务做一层中转，跳过跨域问题：

``` js
  ....
  maxDays: 3, // 保留最大天数日志文件
}

// 代理
config.httpProxy = {
  '/cors': {
    target: 'https://d.zhuanzhuan.com',
    pathRewrite: {'^/cors' : ''}
  }
};

return config
```

但考虑应用的访问量，以及线上线下环境维护成本，觉得必要性不是很大，最终选择通过 `nginx` 解决跨域。

**3. 子应用内部跳转**

子应用内部跳转，需要在基座路由上提前注册好，否则在跳转后，页面识别不到。

``` js
{
  path: '/settlement/detail/:id',
  name: '结算单管理',
  icon: 'RedEnvelopeOutlined',
  microApp: 'settlement',
  hideInMenu: true,
},
```

**4. css污染**

qiankun 只能解决子应用之间的样式相互污染，不能解决**子应用样式污染基座**的样式。
比如：当切换到某个子应用时，左侧菜单栏突然往右移了。

![系统右移](https://pic2.zhuanstatic.com/zhuanzh/2ca800d5-23db-4002-ba34-eccad12e11f7.png)

查看控制台，不难发现，子应用的相同模块覆盖了基座：

![样式覆盖](https://pic2.zhuanstatic.com/zhuanzh/a209a92b-6a11-48b4-a19a-2d6e95586fb3.png)

这个问题，可以通过改变基座的前缀来解决，搞一个`postcss` 插件给不同的组件添加不同的前缀。

这里补充一个css隔离常用的方式如：`css前缀`、`CSS Module`、`动态加载/卸载样式表`。

qiankun中 `css沙箱机制` 采用的是 **动态加载/卸载样式表**。

1. 重写 `HTMLHeadElement.prototype.appendChild` 事件

``` js
// Just overwrite it while it have not been overwrite
if (
  HTMLHeadElement.prototype.appendChild === rawHeadAppendChild &&
  HTMLBodyElement.prototype.appendChild === rawBodyAppendChild &&
  HTMLHeadElement.prototype.insertBefore === rawHeadInsertBefore
) {
  HTMLHeadElement.prototype.appendChild = getOverwrittenAppendChildOrInsertBefore({
    rawDOMAppendOrInsertBefore: rawHeadAppendChild,
    appName,
    appWrapperGetter,
    proxy,
    singular,
    dynamicStyleSheetElements,
    scopedCSS,
    excludeAssetFilter,
  }) as typeof rawHeadAppendChild;
....
```

2. 当子应用加载时，在 `head` 插入 `style/link` ; 当卸载时，直接移除。

``` js
// Just overwrite it while it have not been overwrite
if (
  HTMLHeadElement.prototype.removeChild === rawHeadRemoveChild &&
  HTMLBodyElement.prototype.removeChild === rawBodyRemoveChild
) {
  HTMLHeadElement.prototype.removeChild = getNewRemoveChild({
    appWrapperGetter,
    headOrBodyRemoveChild: rawHeadRemoveChild,
  });
  HTMLBodyElement.prototype.removeChild = getNewRemoveChild({
    appWrapperGetter,
    headOrBodyRemoveChild: rawBodyRemoveChild,
  });
}
```

看起来很完美，但有时候会出现，基座样式丢失的问题。这个跟子应用卸载的时机有关系：**当切换子应用时，当前子应用沙箱环境还未被卸载，但基座css已被插入，当卸载时会连带基座css一起被清除。**

**5. 错误捕获，降级处理**

若子应用加载失败，需要给相应的提示或动态插入`iframe`页：

``` js
// iframe.js
export default ({ sourceUrl }) =>
  <iframe
    src={sourceUrl}
    title="xxxx"
    width="100%"
    height="100%"
    border="0"
    frameBorder="0"
  />

import { render } from 'react-dom';

// 全局未捕获异常处理器
addGlobalUncaughtErrorHandler((event) => {
  console.error(event);
  const { message, location: { hash } } = event;
  // 加载失败时提示
  if (message && message.includes("died in status LOADING_SOURCE_CODE")) {
    Modal.Confirm({
    content: "子应用加载失败，请检查应用是否可运行"
    onOk: () => import('./Inframe.js')
    });
  }
});
```

**6. 路由懒加载样式丢失**
子应用中存在按需加载的路由，在加载时页面样式丢失，这是官方库产生的问题，issue里已有大佬提PR啦，可参考 https://github.com/umijs/qiankun/issues/857

---

以上，就是我们的不完全踩坑。

应用间的通信，在我司的业务场景中复杂度不高，使用官方提供的方案就可以解决，此处没有详说。

## 后续

> **持续性思考会带来的技术红利**

此次接入 `qiankun`，也只是处于表面应用。后续我们更要思考接入它之后更深的工程价值，如：

**- 自动接入qiankun**

结合我司已有的脚手架和umi模板，额外添加一个命令，自动注册子应用，做到自动化

**- 子应用间组件共享**

基座和子应用大概率都用到了react/dva等，是否可以在基座加载完之后，子应用直接复用？当然，浅显思考应该少不了 `webpack` 的 `externals`。

## 文末福利
转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~

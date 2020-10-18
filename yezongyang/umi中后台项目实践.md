> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦

## 背景
中后台项目一般都有较强的页面结构或者逻辑一致性，页面比如像搜索、表格、导航菜单、布局，逻辑方面比如像数据流，权限。
如果基于Webpack封装这些功能就需要比较大的前期工作，Umi则以路由为基础，并以此进行功能扩展，包含微前端、组件打包、请求库、hooks 库、数据流等。基于此在公司内落地 `umi` 的实践。

## 目录结构
基于 `umi` 的项目整体目录结构说明，对项目能有个大致的了解

``` js
├── package.json
├── config
		└── config.js
├── dist
├── mock
├── public
└── src
    ├── .umi
    ├── layouts/index.js
    ├── locales
    ├── models
    ├── pages
        ├── index.less
        └── index.js
    ├── services
    ├── wrappers
    ├── global.js
    └── app.js
```

* **config.js** — 主要是路由配置，插件配置，`webpack` 配置
* **layouts** — 布局相关
* **locales** — 国际化
* **models** — `dva` 数据流方案或者 `plugin-model`
* **wrappers** — 配置路由的高阶组件封装，比如路由级别的权限校验
* **app.js** — 运行时配置，比如需要动态修改路由，覆盖渲染 `render`，监听路由变化
* **global.js** — 全局执行入口，比如可以放置 `sentry` 等

## 路由
路由可以说是前端项目的基石，下面谈谈路由相关的配置

``` javascript
// config/route.js
export default [{
  path: '/merchant',
  name: '商户管理',
  routes: [
    {
      path: '/merchant/list',
      name: '商户列表'
      component: './list'
    },
    {
      path: '/merchant/detail',
      name: '商户详情',
      hideInMenu: true,
      component: './detail'
    }
  ]
}]
```
路由配置除了常规的 `name`，`path`，`component` 也可以支持配置 `umi` 插件的配置选项，比如**pro-layout**的hideInMenu来隐藏路由对应导航菜单项

路由组件按需加载可以在 `config.js` 中配置开启

```javascript
// config/config.js
export default {
  dynamicImport: {}
}
```

路由也支持 hook 钩子操作，比如登录后再访问登录页面就重定向到首页

```javascript
// config/route.js
{
  path: '/login',
	wrappers: [
    '@/wrappers/checkLogin',
  ],
  component: './Login'
}
```

某些项目的路由可能是数据库配置的，这个时候就需要动态路由，从接口获取数据创建路由

```javascript
// src/app.js
let extraRoutes;

export function patchRoutes({ routes }) {
  merge(routes, extraRoutes);
}

export function render() {
  fetch('/api/routes').then((res) => { extraRoutes = res.routes })
}
```

## 数据流方案选择

1. 使用 **@umijs/plugin-dva**，开发方式类似 `redux`

```javascript
// config/config.js
export default {
  dva: {
    immer: true,
    hmr: false,
  }
}
```

- **约定是到 model 组织方式**，不用手动注册 `model`
- **文件名即 namespace**，`model` 内如果没有声明 `namespace`，会以文件名作为 `namespace`
- **内置 dva-loading**，直接 connect `loading` 字段使用即可

2. 使用 **@umijs/plugin-model**

一种基于 `hooks` 范式的简易数据管理方案（部分场景可以取代 `dva`），通常用于中台项目的全局共享数据。

```javascript
// src/models/useAuthModel.js
import { useState, useCallback } from 'react'

export default function useAuthModel() {
  const [user, setUser] = useState(null)
  const signin = useCallback((account, password) => {
    // signin implementation
    // setUser(user from signin API)
  }, [])
  const signout = useCallback(() => {
    // signout implementation
    // setUser(null)
  }, [])
  return {
    user,
    signin,
    signout
  }
}
```

使用Model

```javascript
import { useModel } from 'umi';

export default () => {
  const { user, fetchUser } = useModel('user', model => ({ user: model.user, fetchUser: model.fetchUser }));
  return <>hello</>
};
```

从使用体验来讲，中台项目基本就是表单和表格，跨页面共享数据场景并不是很多，使用 `dva` 有点过重，因此推荐使用第2种 `plugin-model` 这种轻量级的

## 布局

![布局图片](https://pic6.zhuanstatic.com/zhuanzh/9eb0e7f6-0f20-4133-9a65-313aaab32599.png)

`@umijs/plugin-layout` 插件提供了更加方便的布局

- 默认为 Ant Design 的 Layout [@ant-design/pro-layout](https://www.npmjs.com/package/@ant-design/pro-layout)，支持它全部配置项。
- 侧边栏菜单数据根据路由中的配置自动生成。
- 默认支持对路由的 403/404 处理和 Error Boundary。
- 搭配 @umijs/plugin-access 插件一起使用，可以完成对路由权限的控制。

```javascript
// src/app.js
export const layout = {
  logout: () => {}, // do something
  rightRender:(initInfo)=> { return 'hahah'; },// return string || ReactNode;
};
```
## 权限
一般项目离不开权限的管理， umi使用 **@umijs/plugin-access** 来提供权限设置

```javascript
// src/access.js
export default function(initialState) {
  const { permissions } = initialState; // getInitialState方法执行后

  return {
    canAccessMerchant: true,
    ...permissions
  }
}
```

1. 对路由页面的权限控制，在路由配置中新增 `access` 属性

```javascript
// config/route.js
export default [{
  path: '/merchant',
  name: '商户管理',
  routes: [
    {
      path: '/merchant/list',
      name: '商户列表'
      component: './list',
      access: 'canAccessMerchant'
    }
  ]
}]
```

2. 当然也可以在页面或组件内用 `useAccess` 获取到权限相关信息

```javascript
import React from 'react'
import { useAccess } from 'umi'

const PageA = props => {
  const { foo } = props;
  const access = useAccess();

  if (access.canReadFoo) {
    // 如果可以读取 Foo，则...
  }

  return <>TODO</>
}

export default PageA
```

3. 实际业务开发中，权限需要从接口动态获取，就需要使用 **@umijs/plugin-initial-state** 和 **@umijs/plugin-model**

```javascript
// src/app.js
/**
getInitialState会在整个应用最开始执行，返回值会作为全局共享的数据。Layout 插件、Access 插件以及用户都可以通过 useModel('@@initialState') 直接获取到这份数据
*/
export async function getInitialState() {
  const permissions = await fetchUserPermissions()
  return { permissions }
}
```

## 国际化

**@umijs/plugin-locale** 国际化插件，用于解决 `i18n` 问题

使用 `antd` 开发，默认是英文，显示中文就需要开启国际化配置

```javascript
// config/config.js
export default {
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
  }
}
```
在路由中的 `title` 或者 `name` 可直接使用国际化 `key`，自动被转成对应语言的文案

```javascript
// src/locales/zh-CN.js
export default {
  'about.title': '关于 - 标题',
}
// src/locales/en-US.js
export default {
  'about.title': 'About - Title',
}
```

项目配置如下

```javascript
export default {
  routes: [
    {
      path: '/about',
      component: 'About',
      title: 'about.title',
    }
  ]
}
```

## 集成redux插件

如果开启 `dva`，也就是使用 `redux` 来集中管理数据流，那么使用 **redux-persist** 插件持久化 `redux` 数据到 `localStorage` 里，大致使用如下

```javascript
// src/app.js
import { getDvaApp } from 'umi'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import createFilter from 'redux-persist-transform-filter'

export const dva = {
  config: {
    onError(e) {
      e.preventDefault()
    },
    onReducer(reducer) {
      const globalCollapsedFilter = createFilter('global', ['collapsed'])
      const persistConfig = {
        key: 'root',
        storage,
        whitelist: ['global'],
        transforms: [globalCollapsedFilter],
        stateReconciler: autoMergeLevel2
      }
      return persistReducer(persistConfig, reducer)
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = getDvaApp()
  persistStore(app._store)
})
```

## 插件开发

`umi` 实现了完整的生命周期，并使其插件化，这样就为使用者提供了扩展入口。比如设置默认配置插件

```javascript
export default api => {
  api.modifyDefaultConfig(config => {
    return Object.assign({}, config, {
      title: false,
      history: {
        type: 'hash'
      },
      hash: true,
      antd: {},
      dva: {
        hmr: true
      },
      dynamicImport: {
        loading: '@/components/PageLoading'
      },
      targets: {
        ie: 10
      },
      runtimePublicPath: true,
      terserOptions: {
        compress: {
          drop_console: true
        }
      }
    });
  });
}
```

## Umi2升级到Umi3的优势

组内电商项目在升级之前使用的是内嵌 `umi2` 的 `antd-design-pro4`， 虽然可以满足业务开发，但是模板依然还是有较多不符合业务的部分，比如权限校验这块。

Umi3的发布也带来更好的架构和开发体验

- 配置层做了大量精简
- 最新的Umi3插件提供了Layout， 数据流，权限等新方案
- 终于把模板内的权限相关代码内置化了

## 基于Umi搭建脚手架模板

基于Umi搭建内部中台脚手架模板如下图显示

![布局图片](https://pic1.zhuanstatic.com/zhuanzh/149157d4-7176-4e50-bce8-f77eddc59513.png)

基于Umi此脚手架模板扩展了如下能力

- 编译打包符合公司beetle（内部CI/CD平台）部署规范的dist目录
- 自定义默认配置插件，减少配置项配置
- `eslint` 校验
- `prettier` 格式化代码
- git提交规范
- 结合 `pro-layout` 实现更加方便的布局
- 利用运行时配置 `app.js` 动态生成本地和远程相结合的配置式导航菜单
- 结合 `plugin-access` 插件和内部权限系统实现页面或按钮级别权限控制

新建项目根据公司内的脚手架工具选择中台模板可快速创建带有权限、布局、代码规范、通用页面等功能的初始项目，可以很大的避免重复工作。

## 总结
Umi提供了开箱即用能力， 你不需要配置webpack，babel这些，最佳实践配置已内置化。当然也可以自定义开发插件扩展。Umi 在性能上做了很多努力，这些对于开发者是无感知的。

稍有不足的是Umi对 `webpack-dev-server` 配置开放较少，如果有对 `webpack-dev-server` 有比较大配置需求则需要考量一下~~

## 本月文章预告
预告下，接下来我们会陆续发布转转在微前端、iOS离线包等基础架构和中台技术相关的实践与思考，欢迎大家关注，期望与大家多多交流

## 文末福利
转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~

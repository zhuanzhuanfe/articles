# 原有vue项目接入typescript
## 为什么要接入typescript
javascript由于自身的弱类型，使用起来非常灵活。

这也就为大型项目、多人协作开发埋下了很多隐患。如果是自己的私有业务倒无所谓，主要是对外接口和公共方法，对接起来非常头疼。主要表现在几方面：
1. 参数类型没有校验，怎么传都有，有时会出现一些由于类型转换带来的未知问题。
2. 接口文档不规范，每次都要通过读代码才能知道传什么，怎么传
3. 接口编写符合规范，但是公共库中有大量的处理类型校验的代码

这就非常不利于工程标准化。于是我们决定引入typescript进行代码层面的强校验。


## 概览
原有vue项目接入ts主要包含下面几大步骤：
1. 安装typescript相关npm包
2. 修改webpack和ts配置文件
3. 项目公共库和vue文件改造


## ok，我们开始

### 1. 安装typescript相关npm包
这块有个非常重要的点需要注意：
> 就是要根据你本地的环境，去升级对应版本的typescript

这块是很多初次使用的同学都会遇到的问题。

因为只是看到了官网的教程，一步一步安装完发现各种报错。主要问题就是webpack版本不匹配，或者其他一些npm包版本不匹配

#### 以我本地为例：

我本地环境是webpack3，所以直接安装最新版本的typescript，控制台会报错webpack版本过低的问题。

所以你要不把自己的webpack升级到webapck4.要不就采用与之相匹配的typescript版本。

我选择的是后者，因为直接给自己的项目升级到webapck4，会花费更长的时间。我们用的脚手架是公司内部统一的。里面集成了很多底层通用的基础服务。冒然升级webpack4会带来更大的麻烦，更何况项目时间比较紧迫，你懂得。

下面是我安装的包和对应的版本：
- "typescript": "^3.1.4"  (这个是必须的，ts库)
- "ts-loader": "^3.5.0"  (识别ts的laoder)
- "tslint": "^5.11.0"  (tslint校验库)
- "tslint-loader": "^3.5.4" (tslint的loader)
- "tslint-config-standard": "^8.0.1" (用于tslint默认校验规则)
- "vue-property-decorator": "^7.2.0" (用于在.vue文件中使用ts语法)

### 2. 修改配置文件
- 修改webpack配置文件（加入ts的相关配）

```
base: {
  entry: {
    ...
    app: resolve('src/main.ts') // 把main.js改为main.ts
  }
...
resolve: {
  ...
  extensions: ['vue', '.js', '.ts']
}
module: {
  rules: [
    ...,
    {                           // 加入对文件的ts识别         
      test: /\.ts$/,
      exclude: /node_modules/,
      enforce: 'pre',
      loader: 'tslint-loader'
    }, {
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
      options: {
        appendTsSuffixTo: [/\.vue$/],
      }
    }
  ]
}
```
> 注意： main.js改成main.ts后，还要做一些改造，这个比较简单，按照tslint的错误提示改就可以了

- 在根目录下创建tslint.json（类似eslint，这里设定一个校验标准）

```
{
  "extends": "tslint-config-standard",
  "globals": {
    "require": true
  }
}
```
- 在根目录创建tsconfig.json（typescript配置文件）

```
{
  "compilerOptions": {
    // 编译目标平台
    "target": "es5",
    // 输出目录
    "outDir": "./dist/",
    // 添加需要的解析的语法，否则TS会检测出错。
    "lib": ["es2015", "es2016", "dom"],
    // 模块的解析
    "moduleResolution": "node",
    // 指定生成哪个模块系统代码
    "module": "esnext",
    // 在表达式和声明上有隐含的any类型时报错
    "noImplicitAny": false,
    // 把 ts 文件编译成 js 文件的时候，同时生成对应的 map 文件
    "sourceMap": true,
    // 允许编译javascript文件
    "allowJs": true,
    // 指定基础目录
    "baseUrl": "./",
    // 启用装饰器
    "experimentalDecorators": true,
    // 移除注释
    "removeComments": true,
    "pretty": true,
    // 是相对于"baseUrl"进行解析
    "paths": {
      "vue": ["node_modules/vue/types"],
      "@/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules"
  ]
}
```
- 在src目录下创建sfc.d.ts（用来声明全局变量、class、module、function、命名空间）

我们在这里主要是让ts识别.vue文件、window对象和一些module

具体declare的使用方式请看[这里](https://www.tslang.cn/docs/handbook/declaration-files/by-example.html)

```
/**
 * 告诉 TypeScript *.vue 后缀的文件可以交给 vue 模块来处理
 * 而在代码中导入 *.vue 文件的时候，需要写上 .vue 后缀。
 * 原因还是因为 TypeScript 默认只识别 *.ts 文件，不识别 *.vue 文件
 */
declare module "*.vue" {
  import Vue from 'vue'
  export default Vue
}
/**
 * 告诉 TypeScript window是个全局对象，直接可用，这样就不会在window.xx = 123时报错
 */
declare var window: any
/**
 * 引入部分第三方库/自己编写的模块的时候需要额外声明文件
 * 引入的时候，需要使用类似 import VueLazyLaod from 'vue-lazyload' 的写法
 */
declare module 'vue-lazyload'
declare module '@zz/perf/vue'
declare module 'raven-js'
declare module 'raven-js/plugins/vue'

```

将src/main.js改为main.ts

### 项目改造

这个部分是最麻烦的，主要有几大块

- 基础库改造

  如果你的基础库引用了大量的npm包，那么恭喜你，这部分你的改造成本会低很多。
  
  如果你的lib库有相当一部分都是自己手写的，那么，我也得恭喜你。。。
  
  我们自己的lib库里，有大量的自己维护的js文件。那么如果你要进行ts改造的话，通通都要改。
  
  举个例子：
  lib/url.js 中的getParam (算法并不高级，就是易读、兼容性好)
  
```
export default class URL{
  /**
   * @memberOf URL
   * @summary 获取当前页面连接中指定参数
   * @type {function}
   * @param {string} param1                     - 如果param2为undefined，param1是指从当前页面url中获取指定参数的key, 如果param2不为空，param1为指定的url
   * @param {string} param2                     - 可选参数，如果param2存在，则从指定的param1连接中获取对应参数的key
   * @return {string|null}
   */
  static getParam (param1, param2) {
    let url = ''
    let param = null;
    // 如果只有一个参数，默认从当前页面链接获取参数
    if (typeof param2 === 'undefined') {
      url = window && window.location.href || ''
      param = param1
    // 从指定url中获取参数
    } else {
      url = param1
      param = param2
    }
    // 排除hash的影响
    url = url.split('#')[0]
    if (url.indexOf('?') > -1) {
      url = url.split('?')[1]
    }
    const reg = new RegExp('(^|&)' + param + '=([^&]*)[&#$]*', 'i')
    const rstArr = url.match(reg)
    if (rstArr !== null) {
      return decodeURIComponent(rstArr[2])
    }
    return null
  }
  ...
}
```

  
  改造后的文件为：lib/url.ts
  
```
export default class URL {
  /**
   * @memberOf URL
   * @summary 获取url中指定参数
   * @type {function}
   * @param {string} param1                     - 如果param2为undefined，param1是指从当前页面url中获取指定参数的key, 如果param2不为空，param1为指定的url
   * @param {string} param2                     - 可选参数，如果param2存在，则从指定的param1连接中获取对应参数的key
   * @return {string|null}
   */
  static getParam (param1: string, param2?: string): string {
    let url: string = ''
    let param = null
    // 如果只有一个参数，默认从当前页面链接获取参数
    if (typeof param2 === 'undefined') {
      url = window && window.location.href || ''
      param = param1
    // 从指定url中获取参数
    } else {
      url = param1
      param = param2
    }
    url = url.split('#')[0]
    if (url.indexOf('?') > -1) {
      url = url.split('?')[1]
    }
    const reg = new RegExp('(^|&)' + param + '=([^&]*)[&#$]*', 'i')
    const rstArr = url.match(reg)
    if (rstArr !== null) {
      return decodeURIComponent(rstArr[2])
    }
    return null
  }
  ...
}
```
对于一个方法多种调用方式，如果你想完全改成typescript推荐的方式，你可以用到方法[重载](https://www.tslang.cn/docs/handbook/functions.html)。

我没有用是因为我不希望改变原有页面的使用方式。
  
  
  
>   注：对于一个大型项目来讲，我们并不建议上来就对全部的文件进行ts改造。

>   我们更建议采用渐进式改造方案，在不影响原有页面的情况下，逐一改造。具体方案后面会介绍

- vue文件改造

src/components/helper/newUser/index.vue

```
<template>...</template>
<script>
import { LEGO_ATTR, initLegoData, legic } from '@/lib/legic'
import { getMyProfile } from '@/api/helper'
import { toast } from '@/lib/ZZSDK'
import myComponent from './myComponent.vue'
let flag = false // 是否发送视频点击埋点
export default {
  components: {
    // 自定义组件
    myComponent
  },
  data () {
    return {
      // 用户头像
      portrait: '',
      // 用户名称
      nickName: '',
      // 是否点击播放
      isPlay: false
    }
  },
  mounted () {
    this.initData()
    initLegoData({
      type: 'newUserGuide'
    });
    legic(LEGO_ATTR.newUserGuide.SHOW);
  },
  methods: {
    initData () {
      getMyProfile().then(data => {
        console.log('data', data)
        const { respData } = data
        this.portrait = respData.portrait || ''
        this.nickName = respData.nickname || ''
      }).catch(err => {
        toast({ msg: err })
      })
    },
    goPageClick (type) {
      switch (type) {
        case 'SUN':
          legic(LEGO_ATTR.newUserGuide.SUNVILLAGECLICK)
          break
        case 'FOOTBALL':
          legic(LEGO_ATTR.newUserGuide.FOOTBALLCLICK)
          break
        case 'SIGN':
          legic(LEGO_ATTR.newUserGuide.SIGNCLICK)
          break
        default:
          return
      }
    },
    videoClick () {
      if (flag) {
        return
      } else {
        flag = true
        legic(LEGO_ATTR.newUserGuide.SIGNCLICK)
        this.isPlay = true
        this.$refs.video.play()
      }
    }
  }
}
</script>
<style lang="scss" scoped>...</style>
```

改造后
```
<template>...</template>
<script lang="ts">
import { LEGO_ATTR, initLegoData, legic } from '@/lib/legic'
import { getMyProfile } from '@/api/helper.ts'
import { toast } from '@/lib/ZZSDK'
import { Component, Vue } from 'vue-property-decorator'
import test from './test.vue'

let flag: boolean = false // 是否发送视频点击埋点
@Component({
  components: {
    test
  }
})
export default class NewUser extends Vue {
  // 用户头像
  portrait = ''
  // 用户名称
  nickName = ''
  // 是否点击播放
  isPlay = false

  mounted (): void {
    this.initData()
    initLegoData({
      type: 'newUserGuide'
    });
    legic(LEGO_ATTR.newUserGuide.SHOW)
  }

  initData () {
    // 获取profile信息
    getMyProfile().then((data: any) => {
      console.log('data', data)
      const { respData } = data
      this.portrait = respData.portrait || ''
      this.nickName = respData.nickname || ''
    }).catch((err: string) => {
      toast({ msg: err })
    })
  }

  goPageClick (type: string) {
    switch (type) {
      case 'SUN':
        legic(LEGO_ATTR.newUserGuide.SUNVILLAGECLICK)
        break
      case 'FOOTBALL':
        legic(LEGO_ATTR.newUserGuide.FOOTBALLCLICK)
        break
      case 'SIGN':
        legic(LEGO_ATTR.newUserGuide.SIGNCLICK)
        break
      default:
        return
    }
  }

  videoClick () {
    if (flag) {
      return
    } else {
      flag = true
      legic(LEGO_ATTR.newUserGuide.SIGNCLICK)
      this.isPlay = true
      this.$refs.video['play']()
    }
  }
}
</script>
<style lang="scss" scoped>...</style>
```

myComponent.vue改造前略，这里只展示改造后的组件

```
<template>
  <div class="main">{{title}}{{name}}</div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class MyComponent extends Vue {

  @Prop({ type: String, default: '' })
  name: string

  title: string = '您好'
}
</script>
<style lang="scss" scoped>
  .main{
    display: none;
  }
</style>
```

这里需要注意的是：

- ts默认不会识别.vue文件，所以需要在sfc.d.ts文件中声明，同时在引入vue组件时，要加.vue后缀
- 引入vue-property-decorator插件。采用修饰符的方式进行组件注册，这样里面的data、prop和function都通过扁平化方式调用（这也是官方推荐的方式）
- ts中import引入文件，如果不写后缀，默认是js文件。如果js文件没有，则才识别ts文件

现在说下前面提到的改造方案：

这里其实主要涉及.vue文件和lib库的改造，vue文件没啥可说的，一个个改就可以了。主要说lib里面的文件，这里我建议：
- 一开始保留原来的js文件，并不删除。这样目前尚未改造的文件可以继续使用
- 新建对应的ts文件，比如lib中有util.js，新创建util.ts
- 新改造的vue文件通通引入lib库中xx.ts（要加.ts后缀）,如import Util from '@/lib/util.ts'
这样可以一点点改造整个项目，同时未改造的页面照样可以运行。

ok以上就是我们改造的全部过程。
有什么问题可以指正，大家互相学习




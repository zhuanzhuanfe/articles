# 带你了解 vue-next（Vue 3.0）之 初入茅庐

这几天，陆续学习了解了关于[vue-next（Vue 3.0）](https://github.com/vuejs/vue-next)的一些新特性，尤其是新的`Composition API`的用法。这套新的API中最重要、最核心的部分，恐怕就是实现响应式功能的这一块了。而且，这套响应式API不仅可以在`vue-next`环境下使用，也可以独立使用。

笔者在阅读源码看到，`vue-next`已全部由`TypeScript`构建，看来 ts 必学技能。接下来带你了解[vue-next](https://github.com/vuejs/vue-next)。

`vue-next`计划并已实现的主要架构改进和新功能：

- 使用模块化架构
- 优化 "Block tree"
- 更激进的 static tree hoisting 功能
- 支持 Source map
- 内置标识符前缀（又名 "stripWith"）
- 内置整齐打印（pretty-printing）功能
- 移除 source map 和标识符前缀功能后，使用 Brotli 压缩的浏览器版本精简了大约 **10KB**

运行时（Runtime）的更新主要体现在以下几个方面：

- 速度显著提升
- 同时支持 Composition API 和 Options API，以及 typings
- 基于 Proxy 实现的数据变更检测
- 支持 Fragments
- 支持 Portals
- 支持 Suspense w/ async setup()

最后，还有一些 2.x 的功能尚未移植过来，如下：

- SFC compiler
- Server-side rendering （服务端渲染SSR）

==**目前不支持IE11**==

[vue-next（Vue 3.0）](https://github.com/vuejs/vue-next) 的源码虽然发布了，但是预计最早也需要等到 2020 年第一季度才有可能发布 3.0 正式版。

## 目录剖析
代码仓库中有个 packages 目录，里面主要是 `vue-next` 的相关源码功能实现，具体内容如下所示。

```
├── packages
│   ├── compiler-core # 所有平台的编译器
│   ├── compiler-dom # 针对浏览器而写的编译器
│   ├── reactivity # 数据响应式系统
│   ├── runtime-core # 虚拟 DOM 渲染器 ，Vue 组件和 Vue 的各种API
│   ├── runtime-dom # 针对浏览器的 runtime。其功能包括处理原生 DOM API、DOM 事件和 DOM 属性等。
│   ├── runtime-test # 专门为测试写的runtime
│   ├── server-renderer # 用于SSR
│   ├── shared # 帮助方法
│   ├── template-explorer
│   └── vue # 构建vue runtime + compiler
```

- compiler-core：平台无关的编译器，它既包含可扩展的基础功能，也包含所有平台无关的插件。暴露了 AST 和 baseCompile 相关的 API，它能把一个字符串变成一棵 AST

- compiler-dom：基于compiler-core封装针对浏览器的compiler

- runtime-core：与平台无关的运行时环境。支持实现的功能有虚拟 DOM 渲染器、Vue 组件和 Vue 的各种API， 可以用来自定义 renderer ，vue2中也有

- runtime-dom：针对浏览器的 runtime。其功能包括处理原生 DOM API、DOM 事件和 DOM 属性等， 暴露了重要的render和createApp方法

```js
const { render, createApp } = createRenderer<Node, Element>({
  patchProp,
  ...nodeOps
})

export { render, createApp }
```

- runtime-test：一个专门为了测试而写的轻量级 runtime。比如对外暴露了renderToString方法，在此感慨和react越来越像了

- server-renderer：用于 SSR，尚未实现。

- shared：没有暴露任何 API，主要包含了一些平台无关的内部帮助方法。

- vue：「完整」版本，引用了上面提到的 runtime 和 compiler目录。入口文件代码如下
```js
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/vue.cjs.prod.js')
} else {
  module.exports = require('./dist/vue.cjs.js')
}
```
    所以想阅读源码，还是要看构建流程，这个和vue2也是一致的

## 回顾 Vue2.0 响应式原理机制 - defineProperty

这个原理老生常谈了，就是拦截对象，给对象的属性增加`set` 和 `get`方法，因为核心是`defineProperty`所以还需要对数组的方法进行拦截

### 对对象进行拦截

```js
function observer(target){
  // 如果不是对象数据类型直接返回即可
  if(typeof target !== 'object'){
    return target
  }
  // 重新定义key
  for(let key in target){
    defineReactive(target,key,target[key])
  }
}

function update(){
  console.log('update view')
}

function defineReactive(obj,key,value){
  observer(value); // 有可能对象类型是多层，递归劫持
  Object.defineProperty(obj,key,{
    get(){
      // 在get 方法中收集依赖
      return value
    },
    set(newVal){
      if(newVal !== value){
        observer(value);
        update(); // 在set方法中触发更新
      }
    }
  })
}

const obj = {name:'zhuanzhuan'}
observer(obj);

obj.name = 'new-name';
```

```
输出：
update view
```

### 数组方法劫持

```js
const oldProtoMehtods = Array.prototype
const proto = Object.create(oldProtoMehtods)

function update(){
  console.log('update view')
}

function defineReactive(obj,key,value){
  observer(value) // 有可能对象类型是多层，递归劫持
  Object.defineProperty(obj,key,{
    get(){
      // 在get 方法中收集依赖
      return value
    },
    set(newVal){
      if(newVal !== value){
        observer(value)
        update() // 在set方法中触发更新
      }
    }
  })
}

['push','pop','shift','unshift'].forEach(method=>{
  Object.defineProperty(proto, method,{
    get(){
      update()
      return oldProtoMehtods[method]
    }
  })
})

function observer(target){
  if(typeof target !== 'object'){
    return target
  }
  // 如果不是对象数据类型直接返回即可
  if(Array.isArray(target)){
    Object.setPrototypeOf(target, proto)
    // 给数组中的每一项进行observr
    for(let i = 0 ; i < target.length; i++){
      observer(target[i])
    }
    return
  }
  // 重新定义key
  for(let key in target){
    defineReactive(target, key, target[key])
  }
}

let obj = {hobby:[{name:'zhuanzhuan'}]}
observer(obj)
// 使用['push','pop','shift','unshift'] 方法，更改数组会触发视图更新
obj.hobby.push('转转')
// 更改数组中的对象也会触发视图更新
obj.hobby[0].name = 'new-name'
console.log(obj.hobby)

```

```
输出：
update view
update view
[ { name: [Getter/Setter] }, '转转' ]
```

Object.defineProperty缺点：

- 无法监听数组的变化
- 需要深度遍历，浪费内存


## vue-next 预备知识

无论是阅读这篇文章，还是阅读 `vue-next` 响应式模块的源码，首先有两个知识点是必备的：

- [Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)：对象用于定义基本操作的自定义行为（如属性查找，赋值，枚举，函数调用等）。ES6 中新的代理内建工具类。
- [Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)：是一个内置的对象，它提供拦截 JavaScript 操作的方法。这些方法与proxy handlers的方法相同。Reflect不是一个函数对象，因此它是不可构造的。ES6 中新的反射工具类

### Proxy

```js
let data = [1,2,3]
let p = new Proxy(data, {
  get(target, key) {
    console.log('获取值:', key)
    return target[key]
  },
  set(target, key, value) {
    console.log('修改值:', key, value)
    target[key] = value
    return true
  }
})

p.push(4)
```

```
输出：
获取值: push
获取值: length
修改值: 3 4
修改值: length 4
```

比`defineproperty`优秀的 就是数组和对象都可以直接触发`getter`和`setter`， 但是数组会触发两次，因为获取`push`和修改`length`的时候也会触发

Proxy 取代 deineProperty 除了性能更高以外，还有以下缺陷，也是为啥会有$set，$delete的原因 :

1. 属性的新加或者删除也无法监听；
2. 数组元素的增加和删除也无法监听
### Reflect

```js
let data = [1,2,3]
let p = new Proxy(data, {
  get(target, key) {
    console.log('获取值:', key)
    return Reflect.get(target,key)
  },
  set(target, key, value) {
    console.log('修改值:', key, value)
    return Reflect.set(target,key, value)
  }
})

p.push(4)
```

```
输出：
获取值: push
获取值: length
修改值: 3 4
修改值: length 4
```

### 多次触发和深层嵌套问题

```js
let data = {name:{ title:'zhuanzhuan'}}
let p = new Proxy(data, {
  get(target, key) {
    console.log('获取值:', key)
    return Reflect.get(target,key)
  },
  set(target, key, value) {
    console.log('修改值:', key, value)
    return Reflect.set(target,key, value)
  }
})

p.name.title = 'xx'
```

```
输出：
获取值: name
```

之后会带你看下`vue-next`是怎么解决的。

## 初始化项目

### 依赖 项目 vue.global.js【推荐】

1. clone 项目
```sh
$ git clone https://github.com/vuejs/vue-next.git
```
1. 编辑文件
```sh
$ npm run dev
```
1. 拷贝文件

    运行上面命令后，就会生成 `[项目根路径]/packages/vue/dist/vue.global.js` 文件

### 依赖  @vue/composition-api

1. 安装 vue-cli
```sh
$ npm install -g @vue/cli
# OR
$ yarn global add @vue/cli
```

2. 创建项目
```sh
$ vue create my-project
# OR
$ vue ui
```

3. 在项目中安装 `composition-api` 体验 `vue-next` 新特性

```sh
$ npm install @vue/composition-api --save
# OR
$ yarn add @vue/composition-api
```

4. 在使用任何 `@vue/composition-api` 提供的能力前，必须先通过 `Vue.use()` 进行安装

```js
import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'

Vue.use(VueCompositionApi)
```
安装插件后，您就可以使用新的 [Composition API](https://vue-composition-api-rfc.netlify.com/) 来开发组件了。

## vue-next 尝鲜
直接拷贝下面代码，去运行看效果吧。推荐使用高版本的chrome浏览器，记得打开F12调试工具哦！

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <script src="https://s1.zhuanstatic.com/common/js/vue-next-3.0.0-alpha.0.js"></script>
</head>
<body>
<div id='app'></div>
</body>
<script>
  const { createApp, reactive, computed, effect } = Vue;

  const RootComponent = {
    template: `
    <button @click="increment">
      {{ state.name }}今年{{state.age}}岁了，乘以2是{{state.double}}
    </button>
  `,
    setup() {
      const state = reactive({
        name: '转转',
        age: 3,
        double: computed(() => state.age * 2)
      })

      effect(() => {
        console.log(`effect 触发了！ - ${state.name}今年${state.age}岁了，乘以2是${state.double}`)
      })

      function increment() {
        state.age++
      }

      return {
        state,
        increment
      }
    }
  }
  createApp().mount(RootComponent, '#app')
</script>
</html>
```

这个**reactive**和react-hooks越来越像了, 大家可以去[Composition API RFC](https://vue-composition-api-rfc.netlify.com/#api-introduction)这里看细节。

1. `template`和之前一样，同样`vue-next`也支持手写`render`的写法，`template`和`render`同时存在的情况，优先`render`。

2. `setup`选项是新增的主要变动，顾名思义，`setup`函数会在组件挂载前（`beforeCreate`和`created`生命周期之间）运行一次，类似组件初始化的作用，`setup`需要返回一个对象或者函数。返回对象会被赋值给组件实例的`renderContext`，在组件的模板作用域可以被访问到，类似`data`的返回值。返回函数会被当做是组件的`render`。具体可以细看文档。

3. `reactive`的作用是将对象包装成响应式对象，通过`Proxy`代理后的对象。

4. 上面的计数器的例子，在组件的`setup`函数中，创建了一个响应式对象`state`包含一个`age`属性。然后创建了一个`increment`递增的函数，最后将`state`和`increment`返回给作用域，这样`template`里的`button`按钮就能访问到`increment`函数绑定到点击的回调，`age`。我们点击按钮，按钮上的数值就能跟着递增。

## 参考

- 快速进阶Vue3.0：https://segmentfault.com/a/1190000020709962?utm_source=tag-newest
- Vue Function-based API RFC：https://zhuanlan.zhihu.com/p/68477600

---
相信大家已经对 [vue-next（Vue 3.0）](https://github.com/vuejs/vue-next) 有了初步认识，并且已经成功运行尝鲜代码了吧。

下一章`vue-next（Vue 3.0）之 小试牛刀`继续带你掌握 `vue-next` 函数式的API。

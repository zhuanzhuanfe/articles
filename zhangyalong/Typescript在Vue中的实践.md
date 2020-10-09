# Typescript在Vue中的实践

> 「福利」 ✿✿ ヽ(°▽°)ノ ✿：文章最后有抽奖，**转转纪念T恤**，走过路过不要错过哦

## 1 使用 typescript 的优势

聊到 ts 时有一个不能规避的问题：为什么要使用 ts ，相比 js 有什么优势吗？下面我从两个方面试着回答一下这个问题：

#### 1.1 项目开发时的便利

1. 避免低级 bug 产生

相信大家都遇到在编辑器一顿操作，打开浏览器页面空白的尴尬翻车现场，然后一顿 debug 最后发现是把变量名拼错了, 用上 ts 之后再也不会有这样的烦恼了，类似的错误编辑器立马就提示你了：

![image](https://pic3.zhuanstatic.com/zhuanzh/8254eef3-fd0a-4ad1-8d8e-b370f73d5194.png)

2. 编辑器智能提示

项目变的越来越庞大时，记住一个变量描述的具体是什么也是一件很困难的事，可能需要我们不停的去查找类型的定义，事实上 ts 可以很好的解决这个问题，虽然一开始的类型定义稍显繁琐，但是他带来的类型提示、代码补全等会让我们觉得这份工作量是值得的。

#### 1.2 后期项目维护成本

1. 类型即注释

工作中难免会需要我们对某个模块升级或者修改等，有时候没有注释或者注释不全的话就需要我们去读代码了，其实很多时候我们并不关心某个模块内部的具体实现，我们只想知道他的输入输出，这时候 ts 就很适合这个场景了：

```js
type Pay = (orderId: string) => Promise<-1 | 0>

const pay: Pay = orderId => {
  // do something
}
```

类似于上面的代码，从类型定义就可以大致推断出其目的

2. 利于重构

这可能是类型系统一个比较大的优势了，之前在重构 js 项目时可谓是如履薄冰，生怕修改了某个模块后搞崩整个项目，有了类型系统就可以安心多了，编辑器哪里飘红去修改哪个地方就可以了。

## 2 让类型流动起来

通常情况下我们会为项目中的接口添加类型定义，这可能也是最繁琐的地方。假设我们有一个获取商品信息的接口如下：

```js
// goodApi.ts
export type GoodInfo = {
  infoId: string,
  price: string,
  title: string,
  label: {
    labeltxt: string,
    labelImg: string
  }[]
}

const getGoodInfo = (): GoodInfo[] => {
  // do something
}
```

现在有一个方法 `processLabel` 需要输入商品的 `label` 来对 `labelImg` 做一些处理，如下：

```js
type LabelMsg = {
  labeltxt: string,
  labelImg: string
}[]

const processLabel = (labelArr: LabelMsg) => {
  // do something
}
```

显然 `labelArr` 的源自于 `GoodInfo` 的 `label`，所以更好的方式是复用 `GoodInfo` 中的类型：

```ts
import { GoodInfo } from './goodApi.ts'

const processLabel = (labelArr: GoodInfo['label']) => {
  // do something
}
```

当然，我们遇到的场景不可能都如此的简单，可能有一个复杂点的函数 `processLabel` 依赖于两个或多个接口的返回数据：

```js
import { GoodInfo } from './goodApi.ts'
import { UserInfo } from './userApi.ts'

type Info = Pick<GoodInfo, 'label'> & Pick<UserInfo, 'tag | avatar'>
const processLabel = (info: Info) => {
  // do something
}
```

总之，我想表达的是应该尽量的复用类型或者使用类型推导，而不是一味的去声明新的类型，这样在项目后期维护或者代码重构时能带来一些方便。

## 3 在 Vue@2.x 中使用 ts

好的接下来进入本文的主题，在 Vue 中使用 ts，Vue 中一个常规的组件可能是这样的：

```js
export default {
  template: '<button @click="onClick">Click!</button>',
  data() {
    return {
      preStr: 'Hello!'
    }
  },
  props: {
    message: {
      type: String,
      default: 'world'
    }
  },
  methods: {
    onClick () {
      window.alert(this.preStr + this.message)
    }
  }
}
```

Vue@2.x 要用上 ts 通常需要借助于 [vue-property-decorator](https://github.com/kaorun343/vue-property-decorator) 这个库，我们大致看一下它的使用方式：

```js
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator';

@Component({
  template: '<button @click="onClick">Click!</button>'
})
export default class Test extends Vue {
  preStr: string = 'Hello!'

  @Prop({ type: String, default: 'world' })
  message: string

  onClick (): void {
    window.alert(this.preStr + this.message)
  }
}
```

可以看到需要将对象字面量的写法转换为基于类的组件定义方式，这样很容易就可以对组件的 state 、 prop 、 method 等添加类型，同时其利用装饰器在运行时导出了标准的 vue 组件，我们来大致看下 [Component 装饰器](https://github.com/vuejs/vue-class-component/blob/master/src/component.ts)的内部原理：

```js
export function componentFactory (
  // Component即定义的组件类
  Component: VueClass<Vue>,
  // options为传给Component装饰器的初始选项
  options: ComponentOptions<Vue> = {}
): VueClass<Vue> {
  options.name = options.name || (Component as any)._componentTag || (Component as any).name

  const proto = Component.prototype
  Object.getOwnPropertyNames(proto).forEach(function (key) {

    // 如果方法名与vue生命周期同名 直接放进options内
    if ($internalHooks.indexOf(key) > -1) {
      options[key] = proto[key]
      return
    }
    const descriptor = Object.getOwnPropertyDescriptor(proto, key)
    // 普通方法放进options的methods内
    if (descriptor.value !== void 0) {
      if (typeof descriptor.value === 'function') {
        (options.methods || (options.methods = {}))[key] = descriptor.value
      }
    // get set函数放进options的计算computed内
    } else if (descriptor.get || descriptor.set) {
      (options.computed || (options.computed = {}))[key] = {
        get: descriptor.get,
        set: descriptor.set
      }
    }
  })

  ;(options.mixins || (options.mixins = [])).push({
    data (this: Vue) {
      // 类实例上的属性当做options中data函数的返回值，即state
      return collectDataFromConstructor(this, Component)
    }
  })

  // Super就是Vue 根据计算得到的options选项extend一个常规的vue组件
  const Extended = Super.extend(options)

  return Extended
}
```

上面是 `Component` 装饰器的部分源码，大致就是收集组件类原型上的方法，按照不同的条件分发到 `options` 的生命周期方法、普通方法和计算属性上，然后收集类实例上的属性作为 `options` 中 `data` 函数的返回值，最后根据 `options` 去 `extend` 一个标准的 `vue` 组件。

下面再简单看下 `Prop` 装饰器的原理：

```js
export function Prop(options: PropOptions | Constructor[] | Constructor = {}) {
  return (target: Vue, key: string) => {
    applyMetadata(options, target, key)
    createDecorator((componentOptions, k) => {
      // componentOptions即上文中的options对象  k即被修饰的键名
      ;(componentOptions.props || ((componentOptions.props = {}) as any))[
        k
      ] = options
    })(target, key)
  }
}
```

`Prop` 的工作很简单，将 `Prop` 修饰的键名和传入的参数组成键值对放进 `options.props` 中，类似的[vue-property-decorator](https://github.com/kaorun343/vue-property-decorator)还提供了很多别的装饰器（Model 、Watch 、 Ref 等），覆盖了常见的使用场景，其基本原理大致都是在运行时修改构造组件的参数 options。

## 4 在 Vue@3.x 中使用 ts

Vue@3.x 已经发布了正式版，带来了 Composition Api 和更好的 typescript 支持。对于 Vue@3.x + ts 的项目，只需通过 defineComponent 定义组件即可完美推断出 component options 中的类型：

```js
import { defineComponent } from 'vue'

const Component = defineComponent({
  data() {
    return {
      preStr: 'hello!'
    }
  },
  props: {
    message: {
      type: String,
      required: true
    }
  },
  methods: {
    onClick() {
      this.preStr = 'hi!' // ok    preStr被推断成 string
      this.preStr = 123   // error number类型不能分配给string类型
      this.message = 'zz' // error message是read-only属性
    }
  }
})
```

对于 Composition Api 的支持度也很高：

```js
import { defineComponent, ref, PropType } from 'vue';

export default defineComponent({
  props: {
    callback: {
      required: true,
      type: Function as PropType<(nums: number) => void>
    },
    message: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const nums = ref(0)

    props.callback(props.message)  // error callback的参数应该是number类型

    props.callback(nums.value)     // ok
  }
})
```

本人也是通过 demo 大概尝试了一下在 Vue@3.x 中使用 ts，可以说是十分顺滑，相较于 Vue@2.x 中基于类的组件定义方式，Vue@3.x 不需要我们改变什么代码习惯就可轻松接入 ts，并且其类型推导也是相当的强大。

最后如果非要找出个不足的话，Vue 的模板写法还是不能与 ts 兼容，虽说还有 tsx 的备选方案，但是用 tsx 就不太 Vue 了，不过相信后续也会有优秀的工具来弥补这个不足。总而言之，Vue 对 ts 的支持已足够强大，赶紧用起来吧，真香！

## 文末福利
转发本文并留下评论，我们将抽取第 10 名留言者（依据公众号后台排序），送出转转纪念 T 恤一件，大家转发起来吧~

<div algin="center">
  <img src="https://pic4.zhuanstatic.com/zhuanzh/9d1732f7-6f1c-4291-b2a0-45c1778cba0b.png" alt="奖品">
</div>

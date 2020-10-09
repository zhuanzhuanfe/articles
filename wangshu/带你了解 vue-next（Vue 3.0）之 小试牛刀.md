# 带你了解 vue-next（Vue 3.0）之 小试牛刀

看完上一章 `初入茅庐`之后，相信大家已经对[vue-next（Vue 3.0）](https://github.com/vuejs/vue-next)有所了解了。本章带你掌握 `vue-next` 函数式的API，了解这些的话，无论是对于源码的阅读，还是当正式版发布时开始学习，应该都会有起到一定的辅助作用。

## 基本例子

直接拷贝下面代码，去运行看效果吧。推荐使用高版本的chrome浏览器，记得打开F12调试工具哦！

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body>
<script src="https://s1.zhuanstatic.com/common/js/vue-next-3.0.0-alpha.0.js"></script>
<div id="app"></div>
<script>
  const { ref, reactive, createApp, watch, effect } = Vue

  function useMouse() {
    const x = ref(0)
    const y = ref(0)

    const update = e => {
      x.value = e.pageX
      y.value = e.pageY
    }

    Vue.onMounted(() => {
      window.addEventListener('mousemove', update)
    })

    Vue.onUnmounted(() => {
      window.removeEventListener('mousemove', update)
    })

    return { x, y }
  }

  const App = {
    props: {
      age: Number
    },
    // Composition API 使用的入口
    setup(props, context){
      console.log('props.age', props.age)
      // 定义响应数据
      const state  = reactive({name:'zhuanzhuan'});
      // 使用公共逻辑
      const {x,y} = useMouse();

      Vue.onMounted(()=>{
        console.log('当组挂载完成')
      });
      Vue.onUpdated(()=>{
        console.log('数据发生更新')
      });
      Vue.onUnmounted(()=>{
        console.log('组件将要卸载')
      })

      function changeName(){
        state.name = '转转';
      }

      // 创建监视，并得到 停止函数
      const stop = watch(() => console.log(`watch state.name：`, state.name))
      // 调用停止函数，清除对应的监视
      // stop()

      // 观察包装对象
      watch(() => state.name, (value, oldValue) => console.log(`watch state.name value:${value} oldValue:${oldValue}`))

      effect(() => {
        console.log(`effect 触发了! 名字是：${state.name}，年龄：${props.age}`)
      })

      // 返回上下文,可以在模板中使用
      return {
        // state: Vue.toRefs(state), // 也可以这样写，将 state 上的每个属性，都转化为 ref 形式的响应式数据
        state,
        x,
        y,
        changeName,
      }
    },
    template:`<button @click="changeName">名字是：{{state.name}} 鼠标x: {{x}} 鼠标: {{y}}</button>`
  }

  createApp().mount(App, '#app', {age: 123});
</script>
</body>
</html>

```

## 设计动机

### 逻辑组合与复用

组件 API 设计所面对的核心问题之一就是如何组织逻辑，以及如何在多个组件之间抽取和复用逻辑。基于 Vue 2.x 目前的 API 有一些常见的逻辑复用模式，但都或多或少存在一些问题。这些模式包括：

- Mixins
- 高阶组件 (Higher-order Components, aka HOCs)
- Renderless Components (基于 scoped slots / 作用域插槽封装逻辑的组件）

网络上关于这些模式的介绍很多，这里就不再赘述细节。总体来说，以上这些模式存在以下问题：

- 模版中的数据来源不清晰。举例来说，当一个组件中使用了多个 `mixin` 的时候，光看模版会很难分清一个属性到底是来自哪一个 `mixin`。`HOC` 也有类似的问题。

- 命名空间冲突。由不同开发者开发的 `mixin` 无法保证不会正好用到一样的属性或是方法名。`HOC` 在注入的 `props` 中也存在类似问题。

- 性能。`HOC` 和 `Renderless Components` 都需要额外的组件实例嵌套来封装逻辑，导致无谓的性能开销。


从以上`useMouse`例子中可以看到：

- 暴露给模版的属性来源清晰（从函数返回）；
- 返回值可以被任意重命名，所以不存在命名空间冲突；
- 没有创建额外的组件实例所带来的性能损耗。

### 类型推导

`vue-next` 的一个主要设计目标是增强对 `TypeScript` 的支持。原本期望通过 `Class API` 来达成这个目标，但是经过讨论和原型开发，认为 `Class` 并不是解决这个问题的正确路线，基于 `Class` 的 `API` 依然存在类型问题。

基于函数的 `API` 天然对类型推导很友好，因为 `TS` 对函数的参数、返回值和泛型的支持已经非常完备。更值得一提的是基于函数的 `API` 在使用 `TS` 或是原生 `JS` 时写出来的代码几乎是完全一样的。

## setup() 函数

我们将会引入一个新的组件选项，`setup()`。顾名思义，这个函数将会是我们 `setup` 我们组件逻辑的地方，它会在一个组件实例被创建时，初始化了 props 之后调用。它为我们使用 `vue-next` 的 `Composition API` 新特性提供了统一的入口。

### 执行时机

`setup` 函数会在 `beforeCreate` 之后、`created` 之前执行。

### state

声明 `state` 主要有以下几种类型。

#### 基础类型

基础类型可以通过 `ref` 这个`api` 来声明，如下：


```js
const App = {
    setup(props, context){
        const msg = ref('hello')

        function appendName(){
            msg.value = `hello ${props.name}`
        }

        return {appendName, msg}
    },
    template:`<div @click="appendName">{{ msg }}</div>`
}

```

我们知道在 `JavaScript` 中，原始值类型如 `string` 和 `number` 是只有值，没有引用的。如果在一个函数中返回一个字符串变量，接收到这个字符串的代码只会获得一个值，是无法追踪原始变量后续的变化的。

因此，包装对象的意义就在于提供一个让我们能够在函数之间以引用的方式传递任意类型值的容器。这有点像 `React Hooks` 中的 `useRef` —— 但不同的是 `Vue` 的包装对象同时还是响应式的数据源。有了这样的容器，我们就可以在封装了逻辑的组合函数中将状态以引用的方式传回给组件。组件负责展示（追踪依赖），组合函数负责管理状态（触发更新）：


```js
setup(props, context){
    // x,y 可能被 useMouse() 内部的代码修改从而触发更新
    const {x,y} = useMouse();

    return { x, y }
}
```

包装对象也可以包装非原始值类型的数据，被包装的对象中嵌套的属性都会被响应式地追踪。用包装对象去包装对象或是数组并不是没有意义的：它让我们可以对整个对象的值进行替换 —— 比如用一个 `filter` 过的数组去替代原数组：


```js
const numbers = ref([1, 2, 3])
// 替代原数组，但引用不变
numbers.value = numbers.value.filter(n => n > 1)
```

这里补充一下，在 基础类型 第一个例子中你可能注意到了，虽然 `setup()` 返回的 `msg`是一个包装对象，但在模版中我们直接用了 `{{ msg }}`这样的绑定，没有用 `.value`。这是因为当包装对象被暴露给模版渲染上下文，或是被嵌套在另一个响应式对象中的时候，它会被自动展开 `(unwrap) `为内部的值。

#### 引用类型

引用类型除了可以使用 `ref` 来声明，也可以直接使用 `reactive`，如下：

```js
const App = {
    setup(props, context){
        const state  = reactive({name:'zhuanzhuan'});

        function changeName(){
            state.name = '转转';
        }

        return {state, changeName, msg}
    },
    template:`<button @click="changeName">名字是：{{state.name}}</button>`
}

```


### 接收 props 数据

- 在 `props` 中定义当前组件允许外界传递过来的参数名称：

```js
props: {
    age: Number
}
```
- 通过 `setup` 函数的第一个形参，接收 `props` 数据：

```js
setup(props) {
  console.log('props.age', props.age)

  watch(() => props.age, (value, oldValue) => console.log(`watch props.age value:${value} oldValue:${oldValue}`))
}
```

除此之外，还可以直接通过 `watch` 方法来观察某个 `prop` 的变动，这是为什么呢？答案非常简单，就是 `props `本身在源码中，也是一个被 `reactive` 包裹后的对象，因此它具有响应性，所以在`watch` 方法中的回调函数会自动收集依赖，之后当 `age` 变动时，会自动调用这些回调逻辑。
### context

`setup` 函数的第二个形参是一个上下文对象，这个上下文对象中包含了一些有用的属性，这些属性在 `vue 2.x` 中需要通过 `this` 才能访问到，那我想通过 `this` 像在 `vue2` 中访问一些内置属性，怎么办？比如 `attrs` 或者 `emit`。我们可以通过 setup 的第二个参数，在 `vue-next` 中，它们的访问方式如下：

```js
const MyComponent = {
  setup(props, context) {
    context.attrs
    context.slots
    context.parent
    context.root
    context.emit
    context.refs
  }
}
```
注意：==在 `setup()` 函数中无法访问到 `this`==

## reactive() 函数

`reactive()` 函数接收一个普通对象，返回一个响应式的数据对象。

### 基本语法

等价于 `vue 2.x` 中的 `Vue.observable() `函数，`vue 3.x` 中提供了 `reactive()` 函数，用来创建响应式的数据对象，基本代码示例如下：

```js
//  创建响应式数据对象，得到的 state 类似于 vue 2.x 中 data() 返回的响应式对象
const state  = reactive({name:'zhuanzhuan'});
```

### 定义响应式数据供 template 使用

1. 按需导入 reactive 函数：

```js
const { reactive } = Vue
```

2. 在 `setup()` 函数中调用 `reactive()` 函数，创建响应式数据对象：

```js
const { reactive } = Vue

setup(props, context){
    const state  = reactive({name:'zhuanzhuan'});

    return state
}
```

3. 在`template` 中访问响应式数据：

```js
template:`<button>名字是：{{name}} </button>`
```

Value Unwrapping（包装对象的自动展开）

## ref() 函数

`ref()` 函数用来根据给定的值创建一个响应式的数据对象，`ref()` 函数调用的返回值是一个对象，这个对象上只包含一个 `.value` 属性。

### 基本语法

```js
const { ref } = Vue

// 创建响应式数据对象 age，初始值为 3
const age = ref(3)

// 如果要访问 ref() 创建出来的响应式数据对象的值，必须通过 .value 属性才可以
console.log(age.value) // 输出 3
// 让 age 的值 +1
age.value++
// 再次打印 age 的值
console.log(age.value) // 输出 4
```

### 在 template 中访问 ref 创建的响应式数据

1. 在 `setup()` 中创建响应式数据：

```js
setup() {
 const age = ref(3)

     return {
         age,
         name: ref('zhuanzhuan')
     }
}
```

2. 在 `template` 中访问响应式数据：

```js
template:`<p>名字是：{{name}}，年龄是{{age}}</p>`
```

###  在 reactive 对象中访问 ref 创建的响应式数据

当把 `ref()` 创建出来的响应式数据对象，挂载到 `reactive()` 上时，会自动把响应式数据对象展开为原始的值，不需通过 `.value` 就可以直接被访问。

换句话说就是当一个包装对象被作为另一个响应式对象的属性引用的时候也会被自动展开例如：



```js
const age = ref(3)
const state = reactive({
  age
})

console.log(state.age) // 输出 3
state.age++            // 此处不需要通过 .value 就能直接访问原始值
console.log(age)       // 输出 4
```

以上这些关于包装对象的细节可能会让你觉得有些复杂，但实际使用中你只需要记住一个基本的规则：只有当你直接以变量的形式引用一个包装对象的时候才会需要用 .value 去取它内部的值 —— 在模版中你甚至不需要知道它们的存在。

==注意：新的 ref 会覆盖旧的 ref，示例代码如下：==

```js
// 创建 ref 并挂载到 reactive 中
const c1 = ref(0)
const state = reactive({
  c1
})

// 再次创建 ref，命名为 c2
const c2 = ref(9)
// 将 旧 ref c1 替换为 新 ref c2
state.c1 = c2
state.c1++

console.log(state.c1) // 输出 10
console.log(c2.value) // 输出 10
console.log(c1.value) // 输出 0
```

## isRef() 函数

`isRef()` 用来判断某个值是否为 `ref()` 创建出来的对象；应用场景：当需要展开某个可能为 `ref()` 创建出来的值的时候，例如：

```js
const { isRef } = Vue

const unwrapped = isRef(foo) ? foo.value : foo
```

## toRefs() 函数

```js
const { toRefs } = Vue

setup() {
    // 定义响应式数据对象
	const state = reactive({
      age: 3
    })

    // 定义页面上可用的事件处理函数
    const increment = () => {
      state.age++
    }

    // 在 setup 中返回一个对象供页面使用
    // 这个对象中可以包含响应式的数据，也可以包含事件处理函数
    return {
      // 将 state 上的每个属性，都转化为 ref 形式的响应式数据
      ...toRefs(state),
      // 自增的事件处理函数
      increment
    }
}
```

页面上可以直接访问 setup() 中 return 出来的响应式数据：

```js
template:`
<div>
    <p>当前的age值为：{{age}}</p>
    <button @click="increment">+1</button>
</div>
`
```

## computed() 函数

`computed()` 用来创建计算属性，`computed()` 函数的返回值是一个 `ref` 的实例。使用 `computed` 之前需要按需导入：

```js
const { computed } = Vue
```

### 创建只读的计算属性

```js
const { computed } = Vue

// 创建一个 ref 响应式数据
const count = ref(1)

// 根据 count 的值，创建一个响应式的计算属性 plusOne
// 它会根据依赖的 ref 自动计算并返回一个新的 ref
const plusOne = computed(() => count.value + 1)

console.log(plusOne.value) // 输出 2
plusOne.value++            // error
```

### 创建可读可写的计算属性

在调用 `computed()` 函数期间，传入一个包含 `get` 和 `set` 函数的对象，可以得到一个可读可写的计算属性，示例代码如下：

```js
const { computed } = Vue

// 创建一个 ref 响应式数据
const count = ref(1)

// 创建一个 computed 计算属性
const plusOne = computed({
  // 取值函数
  get: () => count.value + 1,
  // 赋值函数
  set: val => { count.value = val - 1 }
})

// 为计算属性赋值的操作，会触发 set 函数
plusOne.value = 9
// 触发 set 函数后，count 的值会被更新
console.log(count.value) // 输出 8
```

## watch() 函数

`watch()` 函数用来监视某些数据项的变化，从而触发某些特定的操作，使用之前需要按需导入：

```js
const { watch } = Vue
```

### 基本用法

```js
const { watch } = Vue

const count = ref(0)

// 定义 watch，只要 count 值变化，就会触发 watch 回调
// watch 会在创建时会自动调用一次
watch(() => console.log(count.value))
// 输出 0

setTimeout(() => {
  count.value++
  // 输出 1
}, 1000)
```

### 监视指定的数据源

监视 `reactive` 类型的数据源：

```js
const { watch, reactive } = Vue

const state  = reactive({name:'zhuanzhuan'});

watch(() => state.name, (value, oldValue) => { /* ... */ })
```

### 监视 ref 类型的数据源：

```js
const { watch, ref } = Vue

// 定义数据源
const count = ref(0)
// 指定要监视的数据源
watch(count, (value, oldValue) => { /* ... */ })
```

###  监视多个数据源

监视 reactive 类型的数据源：

```js
const { reactive, watch, ref } = Vue

onst state = reactive({ age: 3, name: 'zhuanzhuan' })

watch(
  [() => state.age, () => state.name],    // Object.values(toRefs(state)),
  ([age, name], [prevCount, prevName]) => {
    console.log(age)         // 新的 age 值
    console.log(name)          // 新的 name 值
    console.log('------------')
    console.log(prevCount)     // 旧的 age 值
    console.log(prevName)      // 新的 name 值
  },
  {
    lazy: true // 在 watch 被创建的时候，不执行回调函数中的代码
  }
)

setTimeout(() => {
  state.age++
  state.name = '转转'
}, 1000)
```

### 清除监视

在 `setup()` 函数内创建的 `watch` 监视，会在当前组件被销毁的时候自动停止。如果想要明确地停止某个监视，可以调用 `watch()` 函数的返回值即可，语法如下

```js
// 创建监视，并得到 停止函数
const stop = watch(() => { /* ... */ })

// 调用停止函数，清除对应的监视
stop()
```

### 在 watch 中清除无效的异步任务

有时候，当被 `watch` 监视的值发生变化时，或 `watch` 本身被 `stop` 之后，我们期望能够清除那些无效的异步任务，此时，`watch` 回调函数中提供了一个 `cleanup registrator function` 来执行清除的工作。这个清除函数会在如下情况下被调用：

- watch 被重复执行了
- watch 被强制 stop 了

Template 中的代码示例如下：

```html

/* template 中的代码 */
<input type="text" v-model="keywords" />

```

Script 中的代码示例如下：

```js
// 定义响应式数据 keywords
const keywords = ref('')

// 异步任务：打印用户输入的关键词
const asyncPrint = val => {
  // 延时 1 秒后打印
  return setTimeout(() => {
    console.log(val)
  }, 1000)
}

// 定义 watch 监听
watch(
  keywords,
  (keywords, prevKeywords, onCleanup) => {
    // 执行异步任务，并得到关闭异步任务的 timerId
    const timerId = asyncPrint(keywords)

    // keywords 发生了变化，或是 watcher 即将被停止.
    // 取消还未完成的异步操作。
    // 如果 watch 监听被重复执行了，则会先清除上次未完成的异步任务
    onCleanup(() => clearTimeout(timerId))
  },
  // watch 刚被创建的时候不执行
  { lazy: true }
)

// 把 template 中需要的数据 return 出去
return {
  keywords
}
```

之所以要用传入的注册函数来注册清理函数，而不是像 `React` 的 `useEffect` 那样直接返回一个清理函数，是因为`watcher` 回调的返回值在异步场景下有特殊作用。我们经常需要在 `watcher` 的回调中用 `async function` 来执行异步操作：

```js
const data = ref(null)
watch(getId, async (id) => {
  data.value = await fetchData(id)
})
```

我们知道 `async function` 隐性地返回一个 `Promise` - 这样的情况下，我们是无法返回一个需要被立刻注册的清理函数的。除此之外，回调返回的 `Promise` 还会被 `Vue` 用于内部的异步错误处理。

### watch 回调的调用时机

默认情况下，所有的 `watch` 回调都会在当前的 `renderer flush` 之后被调用。这确保了在回调中 `DOM` 永远都已经被更新完毕。如果你想要让回调在 `DOM` 更新之前或是被同步触发，可以使用 flush 选项：

```js
watch(
  () => count.value + 1,
  () => console.log(`count changed`),
  {
    flush: 'post', // default, fire after renderer flush
    flush: 'pre', // fire right before renderer flush
    flush: 'sync' // fire synchronously
  }
)
```

### 全部的 watch 选项（TS 类型声明）

```js
interface WatchOptions {
  lazy?: boolean
  deep?: boolean
  flush?: 'pre' | 'post' | 'sync'
  onTrack?: (e: DebuggerEvent) => void
  onTrigger?: (e: DebuggerEvent) => void
}

interface DebuggerEvent {
  effect: ReactiveEffect
  target: any
  key: string | symbol | undefined
  type: 'set' | 'add' | 'delete' | 'clear' | 'get' | 'has' | 'iterate'
}
```

- lazy与 2.x 的 immediate 正好相反
- deep与 2.x 行为一致
- onTrack 和 onTrigger 是两个用于 debug 的钩子，分别在 watcher - 追踪到依赖和依赖发生变化的时候被调用，获得的参数是一个包含了依赖细节的 debugger event。


## LifeCycle Hooks 生命周期函数

所有现有的生命周期钩子都会有对应的 onXXX 函数（只能在 setup() 中使用）：

```js
const { onMounted, onUpdated, onUnmounted } = Vue

const MyComponent = {
  setup() {
    onMounted(() => {
      console.log('mounted!')
    })

    onUpdated(() => {
      console.log('updated!')
    })

    // destroyed 调整为 unmounted
    onUnmounted(() => {
      console.log('unmounted!')
    })
  }
}
```

下面的列表，是 `vue 2.x` 的生命周期函数与新版 `Composition API` 之间的映射关系：

- `beforeCreate` -> `setup()`
- `created` -> `setup()`
- `beforeMount` -> `onBeforeMount`
- `mounted` -> `onMounted`
- `beforeUpdate` -> `onBeforeUpdate`
- `updated` -> `onUpdated`
- `beforeDestroy` -> `onBeforeUnmount`
- `destroyed` -> `onUnmounted`
- `errorCaptured` -> `onErrorCaptured`


## provide & inject

`provide()` 和 `inject()` 可以实现嵌套组件之间的数据传递。这两个函数只能在 `setup()` 函数中使用。父级组件中使用 `provide()` 函数向下传递数据；子级组件中使用 `inject()` 获取上层传递过来的数据。

### 共享普通数据

`App.vue` 根组件：

```html
<template>
  <div id="app">
    <h1>App 根组件</h1>
    <hr />
    <LevelOne />
  </div>
</template>

<script>
import LevelOne from './components/LevelOne'
// 1. 按需导入 provide
import { provide } from '@vue/composition-api'

export default {
  name: 'app',
  setup() {
    // 2. App 根组件作为父级组件，通过 provide 函数向子级组件共享数据（不限层级）
    //    provide('要共享的数据名称', 被共享的数据)
    provide('globalColor', 'red')
  },
  components: {
    LevelOne
  }
}
</script>
```

`LevelOne.vue` 组件：

```html
<template>
  <div>
    <!-- 4. 通过属性绑定，为标签设置字体颜色 -->
    <h3 :style="{color: themeColor}">Level One</h3>
    <hr />
    <LevelTwo />
  </div>
</template>

<script>
import LevelTwo from './LevelTwo'
// 1. 按需导入 inject
import { inject } from '@vue/composition-api'

export default {
  setup() {
    // 2. 调用 inject 函数时，通过指定的数据名称，获取到父级共享的数据
    const themeColor = inject('globalColor')

    // 3. 把接收到的共享数据 return 给 Template 使用
    return {
      themeColor
    }
  },
  components: {
    LevelTwo
  }
}
</script>
```

`LevelTwo.vue` 组件：

```html
<template>
  <div>
    <!-- 4. 通过属性绑定，为标签设置字体颜色 -->
    <h5 :style="{color: themeColor}">Level Two</h5>
  </div>
</template>

<script>
// 1. 按需导入 inject
import { inject } from '@vue/composition-api'

export default {
  setup() {
    // 2. 调用 inject 函数时，通过指定的数据名称，获取到父级共享的数据
    const themeColor = inject('globalColor')

    // 3. 把接收到的共享数据 return 给 Template 使用
    return {
      themeColor
    }
  }
}
</script>
```

### 共享 ref 响应式数据

如下代码实现了点按钮切换主题颜色的功能，主要修改了 `App.vue` 组件中的代码，`LevelOne.vue` 和 `LevelTwo.vue` 中的代码不受任何改变：

```html
<template>
  <div id="app">
    <h1>App 根组件</h1>

	<!-- 点击 App.vue 中的按钮，切换子组件中文字的颜色 -->
    <button @click="themeColor='red'">红色</button>
    <button @click="themeColor='blue'">蓝色</button>
    <button @click="themeColor='orange'">橘黄色</button>

    <hr />
    <LevelOne />
  </div>
</template>

<script>
import LevelOne from './components/LevelOne'
import { provide, ref } from '@vue/composition-api'

export default {
  name: 'app',
  setup() {
    // 定义 ref 响应式数据
    const themeColor = ref('red')

    // 把 ref 数据通过 provide 提供的子组件使用
    provide('globalColor', themeColor)

    // setup 中 return 数据供当前组件的 Template 使用
    return {
      themeColor
    }
  },
  components: {
    LevelOne
  }
}
</script>
```

## template refs

通过 `ref()` 还可以引用页面上的元素或组件。

### 元素的引用

示例代码如下：

```html
<template>
  <div>
    <h3 ref="h3Ref">TemplateRefOne</h3>
  </div>
</template>

<script>
import { ref, onMounted } from '@vue/composition-api'

export default {
  setup() {
    // 创建一个 DOM 引用
    const h3Ref = ref(null)

    // 在 DOM 首次加载完毕之后，才能获取到元素的引用
    onMounted(() => {
      // 为 dom 元素设置字体颜色
      // h3Ref.value 是原生DOM对象
      h3Ref.value.style.color = 'red'
    })

    // 把创建的引用 return 出去
    return {
      h3Ref
    }
  }
}
</script>
```

### 组件的引用

`TemplateRefOne.vue` 中的示例代码如下：

```html
<template>
  <div>
    <h3>TemplateRefOne</h3>

    <!-- 4. 点击按钮展示子组件的 count 值 -->
    <button @click="showNumber">获取TemplateRefTwo中的count值</button>

    <hr />
    <!-- 3. 为组件添加 ref 引用 -->
    <TemplateRefTwo ref="comRef" />
  </div>
</template>

<script>
import { ref } from '@vue/composition-api'
import TemplateRefTwo from './TemplateRefTwo'

export default {
  setup() {
    // 1. 创建一个组件的 ref 引用
    const comRef = ref(null)

    // 5. 展示子组件中 count 的值
    const showNumber = () => {
      console.log(comRef.value.count)
    }

    // 2. 把创建的引用 return 出去
    return {
      comRef,
      showNumber
    }
  },
  components: {
    TemplateRefTwo
  }
}
</script>
```

`TemplateRefTwo.vue` 中的示例代码：

```html
<template>
  <div>
    <h5>TemplateRefTwo --- {{count}}</h5>
    <!-- 3. 点击按钮，让 count 值自增 +1 -->
    <button @click="count+=1">+1</button>
  </div>
</template>

<script>
import { ref } from '@vue/composition-api'

export default {
  setup() {
    // 1. 定义响应式的数据
    const count = ref(0)

    // 2. 把响应式数据 return 给 Template 使用
    return {
      count
    }
  }
}
</script>
```

## createComponent

这个函数不是必须的，除非你想要完美结合 `TypeScript` 提供的类型推断来进行项目的开发。

这个函数仅仅提供了类型推断，方便在结合 `TypeScript` 书写代码时，能为 `setup()` 中的 `props` 提供完整的类型推断。

```js
import { createComponent } from 'vue'

export default createComponent({
  props: {
    foo: String
  },
  setup(props) {
    props.foo // <- type: string
  }
}
```

## 参考

- 尝鲜 vue3.x 新特性 - CompositionAPI：https://www.cnblogs.com/liulongbinblogs/p/11649393.html
- Vue Function-based API RFC：https://zhuanlan.zhihu.com/p/68477600

---
以上就是 [vue-next（Vue 3.0）](https://github.com/vuejs/vue-next) API，相信大家已经可以灵活运用了吧。

那么大家一定很好奇 `vue-next` 响应式的原理，下一章`vue-next（Vue 3.0）之 炉火纯青` 带你解密。

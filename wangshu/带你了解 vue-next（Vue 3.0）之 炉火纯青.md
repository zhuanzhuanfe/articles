# 带你了解 vue-next（Vue 3.0）之 炉火纯青

看完上两章 `初入茅庐` `小试牛刀` 之后，大家应该对[vue-next（Vue 3.0）](https://github.com/vuejs/vue-next) 的 API 使用已经了如指掌了。好奇的同学一定对 `vue-next` 响应式的原理充满好奇，本章就带你解密！

## 前言
最新`vue-next` 的源码发布了，虽然是 `pre-alpha` 版本，但这时候其实是阅读源码的比较好的时机。在 `vue` 中，比较重要的东西当然要数它的响应式系统，在之前的版本中，已经有若干篇文章对它的响应式原理和实现进行了介绍，这里就不赘述了。在 `vue-next` 中，其实现原理和之前还是相同的，即通过观察者模式和数据劫持，只不过对其实现方式进行了改变。

因此，这篇文章我也打算按这种风格来写一下利用最近空闲时间阅读 `vue-next` 响应式模块的源码的一些心得与体会，算是抛砖引玉，同时实现一个极简的响应式系统。

如有错误，还望指正。

## vue-next 数据响应机制 - Proxy

在学习`vue-next`之前，你必须要先熟练掌握ES6中的 `Proxy`、`Reflect` 及 `ES6`中为我们提供的 `Map`、`Set`两种数据结构

先应用再说原理:

```js
const { reactive, effect} = Vue

let p = reactive({name:'zhuanzhuan'});

// effect方法会立即被触发
effect(()=>{
    console.log(p.name);
})
p.name = '转转'; // 修改属性后会再次触发effect方法
```

源码是采用`ts`编写，为了便于大家理解原理，这里我们采用js来从0编写，之后再看源码就非常的轻松啦！

## reactive方法实现

看源码

```js
function reactive(target) {
      // if trying to observe a readonly proxy, return the readonly version.
      if (readonlyToRaw.has(target)) {
          return target;
      }
      // target is explicitly marked as readonly by user
      if (readonlyValues.has(target)) {
          return readonly(target);
      }
      return createReactiveObject(
        target,
        rawToReactive,
        reactiveToRaw,
        mutableHandlers,
        mutableCollectionHandlers
        );
  }

function createReactiveObject(
    target,
    toProxy,
    toRaw,
    baseHandlers,
    collectionHandlers
    ) {
      if (!isObject(target)) {
          {
              console.warn(`value cannot be made reactive: ${String(target)}`);
          }
          return target;
      }
      // target already has corresponding Proxy
      let observed = toProxy.get(target);
      if (observed !== void 0) {
          return observed;
      }
      // target is already a Proxy
      if (toRaw.has(target)) {
          return target;
      }
      // only a whitelist of value types can be observed.
      if (!canObserve(target)) {
          return target;
      }
      const handlers = collectionTypes.has(target.constructor)
          ? collectionHandlers
          : baseHandlers;
      observed = new Proxy(target, handlers);
      toProxy.set(target, observed);
      toRaw.set(observed, target);
      return observed;
  }
```

稍微精简下

```js
function reactive(target) {
    const handlers = collectionTypes.has(target.constructor)
        ? collectionHandlers
        : baseHandlers
    observed = new Proxy(target, handlers)
    return observed
}
```

```js
const collectionTypes = new Set([Set, Map, WeakMap, WeakSet]);
```

基本上除了`Set`, `Map`, `WeakMap`, `WeakSet`，都是`baseHandlers`。

`baseHandlers`实现：

```js
function createGetter(isReadonly, shallow = false) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver);
          if (isSymbol(key) && builtInSymbols.has(key)) {
              return res;
          }
          if (shallow) {
              track(target, "get" /* GET */, key);
              // TODO strict mode that returns a shallow-readonly version of the value
              return res;
          }
          if (isRef(res)) {
              return res.value;
          }
          track(target, "get" /* GET */, key);
          return isObject(res)
              ? isReadonly
                  ? // need to lazy access readonly and reactive here to avoid
                      // circular dependency
                      readonly(res)
                  : reactive(res)
              : res;
      };
  }
```

返回值如果是`object`，就再走一次`reactive`，实现深度

---

下面我们自己写个案例，通过proxy 自定义获取、增加、删除等行为

```js
function reactive(target){
    // 创建响应式对象
    return createReactiveObject(target);
}
function isObject(target){
    return typeof target === 'object' && target!== null;
}
function createReactiveObject(target){
    // 判断target是不是对象,不是对象不必继续
    if(!isObject(target)){
        return target;
    }
    const handlers = {
        get(target,key,receiver){ // 取值
            console.log('获取')
            let res = Reflect.get(target,key,receiver);
            return res;
        },
        set(target,key,value,receiver){ // 更改 、 新增属性
            console.log('设置')
            let result = Reflect.set(target,key,value,receiver);
            return result;
        },
        deleteProperty(target,key){ // 删除属性
            console.log('删除')
            const result = Reflect.deleteProperty(target,key);
            return result;
        }
    }
    // 开始代理
    observed = new Proxy(target,handlers);
    return observed;
}

let p = reactive({name:'zhuanzhuan'});

console.log(p.name); // 获取

p.name = '转转'; // 设置
delete p.name; // 删除
```

**我们继续考虑多层对象如何实现代理**

```js
let p = reactive({ name: "zhuanzhuan", age: { num: 3 } });
p.age.num = 4
```

由于我们只代理了第一层对象，所以对`age`对象进行更改是不会触发`set`方法的，但是却触发了`get`方法，这是由于` p.age`会造成 `get`操作

```js
get(target, key, receiver) {
      // 取值
    console.log("获取");
    let res = Reflect.get(target, key, receiver);
    return isObject(res) // 懒代理，只有当取值时再次做代理，vue2.0中一上来就会全部递归增加getter,setter
    ? reactive(res) : res;
}
```

这里我们将`p.age`取到的对象再次进行代理，这样在去更改值即可触发`set`方法


**我们继续考虑数组问题**

我们可以发现Proxy默认可以支持数组，包括数组的长度变化以及索引值的变化

```js
let p = reactive([1,2,3,4]);
p.push(5);
```

但是这样会触发两次`set`方法，第一次更新的是数组中的第`4`项，第二次更新的是数组的`length`

**看下源码是如何处理的：**

很简单，用的`hasOwProperty`, `set`肯定会出发多次，但是通知只出去一次， 比如数组修改`length`的时候，`hasOwProperty`是`true`， 那就不触发

```js
function set(target, key, value, receiver) {
      value = toRaw(value);
      const oldValue = target[key];
      if (isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
      }
      const hadKey = hasOwn(target, key);
      const result = Reflect.set(target, key, value, receiver);
      // don't trigger if target is something up in the prototype chain of original
      if (target === toRaw(receiver)) {
          /* istanbul ignore else */
          {
              const extraInfo = { oldValue, newValue: value };
              if (!hadKey) {
                  trigger(target, "add" /* ADD */, key, extraInfo);
              }
              else if (hasChanged(value, oldValue)) {
                  trigger(target, "set" /* SET */, key, extraInfo);
              }
          }
      }
      return result;
  }
```

我们来屏蔽掉多次触发，更新操作

```js
function hasOwn(target,key){
  return target.hasOwnProperty(key);
}

set(target, key, value, receiver) {
    // 更改、新增属性
    let oldValue = target[key]; // 获取上次的值
    let hadKey = hasOwn(target,key); // 看这个属性是否存在
    let result = Reflect.set(target, key, value, receiver);
    if(!hadKey){ // 新增属性
        console.log('更新 添加')
    }else if(oldValue !== value){ // 修改存在的属性
        console.log('更新 修改')
    }
    // 当调用push 方法第一次修改时数组长度已经发生变化
    // 如果这次的值和上次的值一样则不触发更新
    return result;
}
```

**解决重复使用reactive情况**

```js
// 情况1.多次代理同一个对象
let arr = [1,2,3,4];
let p = reactive(arr);
reactive(arr);

// 情况2.将代理后的结果继续代理
let p = reactive([1,2,3,4]);
reactive(p);
```

通过hash表的方式来解决重复代理的情况

```js
const toProxy = new WeakMap(); // 存放被代理过的对象
const toRaw = new WeakMap(); // 存放已经代理过的对象

function reactive(target) {
  // 创建响应式对象
  return createReactiveObject(target);
}

function isObject(target) {
  return typeof target === "object" && target !== null;
}

function hasOwn(target,key){
  return target.hasOwnProperty(key);
}

function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  let observed = toProxy.get(target);
  if(observed){ // 判断是否被代理过
    return observed;
  }
  if(toRaw.has(target)){ // 判断是否要重复代理
    return target;
  }
  const handlers = {
    get(target, key, receiver) {
      // 取值
      console.log("获取");
      let res = Reflect.get(target, key, receiver);
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      let hadKey = hasOwn(target,key);
      let result = Reflect.set(target, key, value, receiver);
      if(!hadKey){
        console.log('更新 添加')
      }else if(oldValue !== value){
        console.log('更新 修改')
      }
      return result;
    },
    deleteProperty(target, key) {
      console.log("删除");
      const result = Reflect.deleteProperty(target, key);
      return result;
    }
  };

  // 开始代理
  observed = new Proxy(target, handlers);
  toProxy.set(target,observed);
  toRaw.set(observed,target); // 做映射表
  return observed;
}
```

到这里`reactive`方法基本实现完毕，接下来就是与`Vue2`中的逻辑一样实现依赖收集和触发更新

![image](https://pic2.zhuanstatic.com/zhuanzh/n_v2ea59807a056c44dcab4383b9b22cc317.jpg)

```js
get(target, key, receiver) {
    let res = Reflect.get(target, key, receiver);
    track(target,'get',key); // 依赖收集==
    return isObject(res)
    ?reactive(res):res;
},
set(target, key, value, receiver) {
    let oldValue = target[key];
    let hadKey = hasOwn(target,key);
    let result = Reflect.set(target, key, value, receiver);
    if(!hadKey){
      trigger(target,'add',key); // 触发添加
    }else if(oldValue !== value){
      trigger(target,'set',key); // 触发修改
    }
    return result;
}
```

`track`的作用是依赖收集，收集的主要是`effect`，我们先来实现`effect`原理，之后再完善 `track`和`trigger`方法

## effect实现

effect意思是副作用，此方法默认会先执行一次。如果数据变化后会再次触发此回调函数。

```js
const p = reactive({name:'zhuanzhuan'})

effect(()=>{
    console.log(p.name);  // zhuanzhuan
})
```

我们来实现`effect`方法，我们需要将`effect`方法包装成响应式`effect`。

```js
const activeReactiveEffectStack = []; // 存放响应式effect

function effect(fn) {
  const effect = createReactiveEffect(fn); // 创建响应式的effect
  effect(); // 先执行一次
  return effect;
}

function createReactiveEffect(fn) {
  const effect = function() {
    // 响应式的effect
    return run(effect, fn);
  };
  return effect;
}

function run(effect, fn) {
    try {
      activeReactiveEffectStack.push(effect);
      return fn(); // 先让fn执行,执行时会触发get方法，可以将effect存入对应的key属性
    } finally {
      activeReactiveEffectStack.pop(effect);
    }
}
```

当调用`fn()`时可能会触发`get`方法，此时会触发`track`

```js
const targetMap = new WeakMap();

function track(target,type,key){
    // 查看是否有effect
    const effect = activeReactiveEffectStack[activeReactiveEffectStack.length-1];
    if(effect){
        let depsMap = targetMap.get(target);
        if(!depsMap){ // 不存在map
            targetMap.set(target,depsMap = new Map());
        }
        let dep = depsMap.get(target);
        if(!dep){ // 不存在set
            depsMap.set(key,(dep = new Set()));
        }
        if(!dep.has(effect)){
            dep.add(effect); // 将effect添加到依赖中
        }
    }
}
```

当更新属性时会触发`trigger`执行，找到对应的存储集合拿出`effect`依次执行

**我们发现如下问题**

```js
function trigger(target,type,key){
    const depsMap = targetMap.get(target);
    if(!depsMap){
        return
    }
    let effects = depsMap.get(key);
    if(effects){
        effects.forEach(effect=>effect())
    }
}
```

新增了值，`effect`方法并未重新执行，因为`push`中修改`length`已经被我们屏蔽掉了触发`trigger`方法，所以当新增项时应该手动触发`length`属性所对应的依赖。

```js
function trigger(target, type, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let effects = depsMap.get(key);
  if (effects) {
    effects.forEach(effect => effect());
  }
  // 处理如果当前类型是增加属性，如果用到数组的length的effect应该也会被执行
  if (type === "add") {
    let effects = depsMap.get("length");
    if (effects) {
      effects.forEach(effect => {
        effect();
      });
    }
  }
```

## ref实现

`ref`可以将原始数据类型也转换成响应式数据，需要通过`.value`属性进行获取值

```js
function convert(val) {
  return isObject(val) ? reactive(val) : val;
}

function ref(raw) {
  raw = convert(raw);
  const v = {
    _isRef:true, // 标识是ref类型
    get value() {
      track(v, "get", "");
      return raw;
    },
    set value(newVal) {
      raw = newVal;
      trigger(v,'set','');
    }
  };
  return v;
}
```

问题又来了我们再编写个案例

```js
let r = ref(1);
let c = reactive({
    a:r
});
console.log(c.a.value);
```

这样做的话岂不是每次都要多来一个.value，这样太难用了

在`get`方法中判断如果获取的是`ref`的值，就将此值的`value`直接返回即可


```js
let res = Reflect.get(target, key, receiver);

if(res._isRef){
  return res.value
}
```

## computed实现

`computed` 实现也是基于 `effect` 来实现的，特点是`computed`中的函数不会立即执行，多次取值是有缓存机制的

先来看用法:

```js
let a = reactive({name:'zhuanzhuan'});

let c = computed(()=>{
  console.log('执行次数')
  return a.name +'今年3岁了';
})
// 不取不执行，取n次只执行一次
console.log(c.value);
console.log(c.value);
```

```js
function computed(getter){
  let dirty = true;
  const runner = effect(getter,{ // 标识这个effect是懒执行
    lazy:true, // 懒执行
    scheduler:()=>{ // 当依赖的属性变化了，调用此方法，而不是重新执行effect
      dirty = true;
    }
  });
  let value;
  return {
    _isRef:true,
    get value(){
      if(dirty){
        value = runner(); // 执行runner会继续收集依赖
        dirty = false;
      }
      return value;
    }
  }
}

```

修改`effect`方法

```js
function effect(fn,options) {
  let effect = createReactiveEffect(fn,options);
  if(!options.lazy){ // 如果是lazy 则不立即执行
    effect();
  }
  return effect;
}

function createReactiveEffect(fn,options) {
  const effect = function() {
    return run(effect, fn);
  };
  effect.scheduler = options.scheduler;
  return effect;
}
```

在`trigger`时判断

```js
deps.forEach(effect => {
  if(effect.scheduler){ // 如果有scheduler 说明不需要执行effect
    effect.scheduler(); // 将dirty设置为true,下次获取值时重新执行runner方法
  }else{
    effect(); // 否则就是effect 正常执行即可
  }
});

```

```js
let a = reactive({name:'zhuanzhuan'});

let c = computed(()=>{
  console.log('执行次数')
  return a.name +'今年3岁了';
})
// 不取不执行，取n次只执行一次
console.log(c.value);
a.name = '转转'; // 更改值 不会触发重新计算,但是会将dirty变成true

console.log(c.value); // 重新调用计算方法

```

## 实现 vue-next 极简的响应式系统

直接拷贝下面代码，去运行看效果吧。推荐使用高版本的chrome浏览器！

`my-vue-next.js` 文件

```js
// 存放被代理过的对象
let toProxy = new WeakMap()
// 存放已经代理过的对象
let toRaw = new WeakMap()
let tagetMap = new WeakMap()
let effectStack = []

const baseHander = {
  get(target, key){
    const res = Reflect.get(target, key)
    // 收集依赖
    track(target, key)
    // 递归寻找
    return typeof res == 'object' ? reactive(res) : res
  },
  set(target, key, val){
    const info = {oldValue: target[key], newValue:val}
    const res = Reflect.set(target, key, val)
    // 触发更新
    trigger(target, key, info)
    return res
  }
}
function reactive(target){
  // 查询缓存
  let observed = toProxy.get(target)
  if(observed){
    return observed
  }
  // 如果已经代理过了这个对象，则直接返回代理后的结果即可
  if(toRaw.get(target)){
    return target
  }
  observed = new Proxy(target, baseHander)
  // 设置缓存
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
}

function trigger(target, key, info){
  // 触发更新
  const depsMap = tagetMap.get(target)

  if(depsMap===undefined){
    return
  }
  const effects = new Set()
  const computedRunners = new Set()
  if(key){
    let deps = depsMap.get(key)

    if(!deps) return

    deps.forEach(effect=>{
      if(effect.computed){
        computedRunners.add(effect)
      }else{
        effects.add(effect)
      }
    })
  }
  effects.forEach(effect=> effect())
  computedRunners.forEach(effect=> effect())
}

function track(target, key){
  let effect = effectStack[effectStack.length - 1]

  if(effect){
    let depsMap = tagetMap.get(target)
    if(depsMap===undefined){
      depsMap = new Map()
      tagetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(dep===undefined){
      dep = new Set()
      depsMap.set(key, dep)
    }
    if(!dep.has(effect)){
      dep.add(effect)
    }
  }
}

// 存储effect
function effect(fn,options={}){
  let e = createReactiveEffect(fn, options)

  // 首次页面加载就需要先运行一次 effect 方法，让页面渲染
  if(!options.lazy){
    e()
  }
  return e
}

function createReactiveEffect(fn,options){
  const effect = function(...args){
    return run(effect, fn , args)
  }
  // 为了调试查看
  effect.fn = fn
  effect.computed = options.computed
  effect.lazy = options.lazy
  return effect
}

function run(effect, fn , args){
  if(effectStack.indexOf(effect)===-1){
    try{
      effectStack.push(effect)
      return fn(...args)
    }
    finally{
      effectStack.pop()
    }
  }
}

function computed(fn){
  const runner = effect(fn,{computed:true, lazy:true})
  return {
    effect:runner,
    get value(){
      return runner()
    }
  }
}

```

`index.html` 文件

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <script src="./my-vue-next.js"></script>
</head>
<body>
  <div id='app'></div>
  <button id="btn">点我</button>
  <script>
    const root = document.querySelector('#app')
    const btn = document.querySelector('#btn')

    const obj = reactive({
      name:'转转',
      age: 3
    })

    const double = computed(()=> obj.age *2)

    effect(()=>{
      root.innerHTML = `<h1>${obj.name}今年${obj.age}岁了，乘以2是${double.value}</h1>`
    })

    btn.addEventListener('click', ()=>{
      const age = obj.age
      obj.age = age + 1
    }, false)

  </script>
</body>
</html>


```

## 参考

- 快速进阶Vue3.0：https://segmentfault.com/a/1190000020709962?utm_source=tag-newest
- vue-next：https://github.com/vuejs/vue-next

---

看完`初入茅庐`、`小试牛刀`、`炉火纯青`三章之后， 已经将`vue-next`核心的 `Composition Api` 就讲解完毕了！ 不管是面试还是后期的应用也再也不需要担心啦！~

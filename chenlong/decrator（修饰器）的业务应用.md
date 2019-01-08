# decrator（修饰器）的业务应用
ES6问世的时间也不短了，而且很多时候对ES6所谓的“熟练应用”基本还停留在下面的几种api应用：

- const/let
- 箭头函数
- Promise
- async await
- 解构、扩展运算符
- Object.assign
- class static
- 数组遍历api

(当然也可能是我用的比较简单)
 
最近也是看了很多大神写的代码，确实学到了很多东西，这也让我下定决心要更深层次的应用ES6

本次我们介绍decrator（修饰器）在业务中的应用

# decrator 基础
首先我们先看下decrator的用法：

1.类修饰器（只有一个参数）：

target -> 指向类，如果是类型是function，则指向MyFunction.prototype

```
// 类修饰器
const animalDecorator = (target) => {
  target.isAnimal = true
  target.prototype.nickname = 'nimo'
};
 
@animalDecorator
class Cat {
 ...
}

console.log(Cat.isAnimal); // true
console.log((new Cat()).nickname); // 'nimo'
```
2.方法修饰器（有三个参数）

target -> 方法所在的类

key -> 方法名称

descriptor -> 描述对象
```
// 方法修饰器
const log = (target, key, descriptor) => {
  const oriFunc = descriptor.value
  descriptor.value = (...args) => {
    console.log(`${key}:', args)
    oriFunc.apply(this, args)
  }
  return descriptor
};
 
class Util {

  @log
  static setParam (param) {
    ...
  }
}

Util.setParam({name: 'xxx'})    // 'setParam: {name: "xxx"}'
```
上面的用法没有传参数，如果需要传参数的话,内部需要return一个方法,以方法修饰器为例

```
// 方法修饰器
const log = (name) => {
  return (target, key, descriptor) => {
    const oriFunc = descriptor.value
    descriptor.value = (...args) => {
      console.log(`${key} ${name}:`, args)
      oriFunc.apply(this, args)
    }
    return descriptor
  }
};
 
class Util {

  @log('forTest')
  static setParam (param) {
    ...
  }
}

Util.setParam({name: 'xxx'})    // 'setParam forTest: {name: "xxx"}'
```
# decrator 实际应用

上面说的大家从网络上各种文章基本都能看到。

应用的话打日志也算是一种，但是感觉应用场景有限，一般对关键业务操作才会用到。常规的业务感觉应用并不多。

下面介绍几个常见的场景：

1. 某个场景下需要同时请求多个接口，但这些接口都需要做登录验证
2. 发送行为埋点，发送前需要获取token（如果cookie中有就从本地获取，否则从接口获取。注：这个token和登录没关系，是用来计算pv和uv的唯一标识）

### 我们以发送行为统计前需要获取token为例：

**场景：** 页面加载完成后，需要同时发送多个行为埋点统计（如：pv、某些模块曝光点）

**特点：** 每次发送埋点都要检查token是否存在，在本地cookie中没有token的时候，就会从接口获取，并种到本地。

看着逻辑好像没问题。

**实际：** 这些行为埋点方法调用的时机，基本上是同时发生。如果cookie中没用token，这几次api调用都会触发获取token接口的调用，这就导致多次不必要的请求。

**目标：** 我们希望，就请求一次接口就可以了。

那么，我们就需要处理发送埋点的方法，一般有两种方式：

- 传统方式：修改统计方法，建立callback缓存数组，只有第一次调用接口，修改标志位，把后面调用的callback通通缓存在数组里，等请求结束，在统一调用数组里的callbakc
- 通过修饰器处理（但实现原理也是如此）


统计方法：

```
...
/**
   * 上报埋点
   * @param {string} actiontype
   * @param {string, optional} pagetype
   * @param {Object, optional} backup
   */
  static report (actiontype, pagetype, backup = {}) {
    try {
      // 处理actiontype字段
      if (!actiontype) return
      actiontype = actiontype.toUpperCase()  // 转为大写
      // 处理pagetype字段
      if (!pagetype) {
        // 获取当前页面的页面名称
        pagetype = Util.getPageName()
      }
      pagetype = pagetype.toUpperCase()

      // 处理backup字段
      if (backup && typeof backup !== 'object') {
        console.error('[埋点失败] backup字段应为对象类型, actionType:', actiontype, 'pageType:', pagetype, 'backup:', backup)
        return
      }
      let commonParams = LeStatic._options.commonBackup.call(this)
      for (let param in backup) {
        if (param in commonParams) {
          console.warn(`[埋点冲突] 参数名称: ${param} 与统一埋点参数名称冲突，请注意检查`, `actionType:`, actiontype, 'pageType:', pagetype, 'backup:', backup)
        }
      }
      backup = Object.assign(commonParams, backup)
      backup = JSON.stringify(backup)
      // 保证token的存在
      ZZLogin.ensuringExistingToken().then(() => {
        // 获取cookieid字段
        let cookieid = Cookies.get('tk')
        // 发送埋点请求
        wx.request({
          url: LeStatic._options.LOG_URL,
          data: {
            cookieid,
            actiontype,
            pagetype,
            appid: 'ZHUANZHUAN',
            _t: Date.now(),
            backup
          },
          success: (res) => {
            if (res.data === false) {
              console.warn('[埋点上报失败] 接口返回false, actionType:', actiontype, 'pageType:', pagetype)
            }
          },
          fail: (res) => {
            console.warn('[埋点上报失败] 网络异常, res:', res)
          }
        })
      })
    } catch (e) {
      console.warn('[埋点上报失败] 捕获代码异常:', e)
    }
  }
```
这块看着好像没做缓存处理，别着急

关键点在：**ZZLogin.ensuringExistingToken()的调用**，我们来看下ZZLogin中的ensuringExistingToken方法

lib/ZZLogin.js


```
import { mergeStep } from '@/lib/decorators'

class ZZLogin {
  ...
  /**
   * token机制，请求发起前，先确保本地有token，如果没有，调用接口生成一个临时token，登录后
   * @return {Promise}
   */
  @mergeStep
  static ensuringExistingToken () {
    return new Promise((resolve, reject) => {
      const tk = cookie.get('tk') || ''
      // token已存在
      if (/^wt-/.test(tk)) {
        resolve()
        return
      }
      // 获取用户token
      ZZLogin.getToken().then(res => {
        resolve()
      })
    })
  }
}
```
我们在调用ensuringExistingToken 时加了修饰器，目的就是，**即使同时刻多次调用，异步请求也是被合并成了一次，其他次的调用也是在第一次异步请求完成后，再进行统一调用**。

来看看修饰器是怎么写的（mergeStep）

lib/decorators.js
```
...
// 缓存对象
const mergeCache = {}
export function mergeStep (target, funcName, descriptor) {
  const oriFunc = descriptor.value
  descriptor.value = (...args) => {
    // 如果第一次调用
    if (!mergeCache[funcName]) {
      mergeCache[funcName] = {
        state: 'doing', // 表示处理中
        fnList: []
      }
      return new Promise((resolve, reject) => {
        // 进行第一次异步处理
        oriFunc.apply(null, args).then(rst => {
          // 处理完成后，将状态置为done
          mergeCache[funcName].state = 'done'
          resolve(rst)
          // 将缓存中的回调逐一触发
          mergeCache[funcName].fnList.forEach(fnItem => {
            fnItem()
          })
          // 触发后将数组置空
          mergeCache[funcName].fnList.length = 0
        })
      })
    // 同时刻多次调用
    } else {
      // 后面重复的调用的回调直接缓存到数组
      if (mergeCache[funcName].state === 'doing') {
        return new Promise((resolve, reject) => {
          mergeCache[funcName].fnList.push(() => {
            resolve(oriFunc.apply(null, args))
          })
        })
      // 如果之前异步状态已经完成，则直接调用
      } else {
        return oriFunc.apply(null, args)
      }
    }
  }
  return descriptor
}
```

**原理：**
- 如果是第一次调用：创建缓存，建立promise对象，直接进行异步请求，并将状态改为doing
- 后面重复调用时，发现是doing状态，就将每个调用包装成一个promise，将callback，放到缓存数组中
- 第一次异步请求完成后，将状态改为done，并将缓存数组中的callback统一调用
- 后面再重复调用，发现状态已经是done了，就直接触发回调

其实修饰器大家知道么，基本上都了解，可业务里就是从来不用。包括es6中其它api也一样，会用了才是自己的。

最近也是全组一起重新深入学习es6的应用，并且是结合实际业务。

后面也是打算对现有项目的公共库进行算法优化升级。如果有机会再进行分享。
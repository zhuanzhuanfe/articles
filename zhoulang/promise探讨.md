## 一、前言

大家都知道JavaScript一大特点就是单线程，为了不阻塞主线程，有些耗时操作（比如ajax）必须放在任务队列中异步执行。传统的异步编程解决方案之一回调，很容易产生臭名昭著的回调地狱问题。
```
fs.readdir(source, function(err, files) {
  if (err) {
    console.log('Error finding files: ' + err)
  } else {
    files.forEach(function(filename, fileIndex) {
      console.log(filename)
      gm(source + filename).size(function(err, values) {
        if (err) {
          console.log('Error identifying file size: ' + err)
        } else {
          console.log(filename + ' : ' + values)
          aspect = (values.width / values.height)
          widths.forEach(function(width, widthIndex) {
            height = Math.round(width / aspect)
            console.log('resizing ' + filename + 'to ' + height + 'x' + height)
            this.resize(width, height).write(dest + 'w' + width + '_' + filename, function(err) {
              if (err) console.log('Error writing file: ' + err)
            })
          }.bind(this))
        }
      })
    })
  }
})
```
虽然回调地狱可以通过减少嵌套、模块化等方式来解决，但我们有更好的方案可以采取，那就是 `Promise`
## 二、含义
`Promise` 是一个对象，保存着异步操作的结果，在异步操作结束后，会变更 `Promise` 的状态，然后调用注册在 `then` 方法上回调函数。 `ES6` 原生提供了 `Promise` 对象，统一用法（具体可参考阮一峰的[ES6入门](http://es6.ruanyifeng.com/?search=promise&x=0&y=0#docs/promise#Promise-%E7%9A%84%E5%90%AB%E4%B9%89)）
## 三、实现
`Promise` 的使用想必大家都很熟练，可是究其内部原理，在这之前，我一直是一知半解。本着知其然，也要知其所以然的目的，开始对 `Promise` 的实现产生了兴趣。

众所周知，`Promise` 是对 `Promises/A+`  规范的一种实现，那我们首先得了解规范，
详情请看[Promise/A+规范](https://promisesaplus.com/)，个人github上有对应的中文翻译[README.md](https://github.com/zhoulang27426405/learn-promise/blob/master/README.md)

### promise构造函数
规范没有指明如何书写构造函数，那就参考下 `ES6` 的构造方式
```
const promise = new Promise(function(resolve, reject) {
  // ... some code

  if (/* 异步操作成功 */){
    resolve(value);
  } else {
    reject(error);
  }
});
```
`Promise` 构造函数接受一个函数作为参数，该函数的两个参数分别是 `resolve` 和 `reject`

`resolve` 函数的作用是将 `Promise` 对象的状态从 `pending` 变为  `fulfilled` ，在异步操作成功时调用，并将异步操作的结果，作为参数传递给注册在 `then` 方法上的回调函数（then方法的第一个参数）； `reject` 函数的作用是将 `Promise` 对象的状态从 `pending` 变为 `rejected` ，在异步操作失败时调用，并将异步操作报出的错误，作为参数传递给注册在 `then` 方法上的回调函数（then方法的第二个参数）

所以我们要实现的 `promise` (小写以便区分ES6的`Promise` )构造函数大体如下：
```
// promise 构造函数
function promise(fn) {
  let that = this
  that.status = 'pending' // 存储promise的state
  that.value = '' // 存储promise的value
  that.reason = '' // 存储promise的reason
  that.onFulfilledCb = [] // 存储then方法中注册的回调函数（第一个参数）
  that.onRejectedCb = [] // 存储then方法中注册的回调函数（第二个参数）

  // 2.1
  function resolve(value) {
    // 将promise的状态从pending更改为fulfilled，并且以value为参数依次调用then方法中注册的回调
    setTimeout(() => {
      if (that.status === 'pending') {
        that.status = 'fulfilled'
        that.value = value
        // 2.2.2、2.2.6
        that.onFulfilledCb.map(item => {
          item(that.value)
        })
      }
    }, 0)
  }

  function reject(reason) {
    // 将promise的状态从pending更改为rejected，并且以reason为参数依次调用then方法中注册的回调
    setTimeout(() => {
      if (that.status === 'pending') {
        that.status = 'rejected'
        that.reason = reason
        // 2.2.3、2.2.6
        that.onRejectedCb.map(item => {
          item(that.reason)
        })
      }
    }, 0)
  }

  fn(resolve, reject)
}
```
规范2.2.6中明确指明 `then` 方法可以被同一个 `promise` 对象调用，所以这里需要用一个数组 `onFulfilledCb` 来存储then方法中注册的回调

这里我们执行 `resolve` `reject` 内部代码使用setTimeout，是为了确保 `then` 方法上注册的回调能异步执行（规范3.1）
### then方法
`promise` 实例具有 `then` 方法，也就是说，`then` 方法是定义在原型对象 `promise.prototype` 上的。它的作用是为 `promise` 实例添加状态改变时的回调函数。

>规范2.2`promise` 必须提供一个 `then` 方法 `promise.then(onFulfilled, onRejected)`
>规范2.2.7 `then` 方法必须返回一个新的promise

阅读理解规范2.1和2.2，我们也很容易对then方法进行实现：
```
promise.prototype.then = function(onFulfilled, onRejected) {
  let that = this
  let promise2

  // 2.2.1、2.2.5
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
  onRejected = typeof onRejected === 'function' ? onRejected : r => r

  if (that.status === 'pending') {
    // 2.2.7
    return promise2 = new promise((resolve, reject) => {
      that.onFulfilledCb.push(value => {
        try {
          let x = onFulfilled(value)
        } catch(e) {
          // 2.2.7.2
          reject(e)
        }
      })

      that.onRejectedCb.push(reason => {
        try {
          let x = onRejected(reason)
        } catch(e) {
          // 2.2.7.2
          reject(e)
        }
      })
    })
  }
}
```
重点在于对 `onFulfilled` 、 `onRejected` 函数的返回值x如何处理，规范中提到一个概念叫
`Promise Resolution Procedure ` ，这里我们就叫做Promise解决过程

Promise 解决过程是一个抽象的操作，需要输入一个 `promise` 和一个值，我们表示为 `[[Resolve]](promise, x)`，如果 `x` 有 `then` 方法且看上去像一个 `Promise` ，解决程序即尝试使 `promise` 接受 `x` 的状态；否则用 `x` 的值来执行 `promise`
### promise解决过程
对照规范2.3，我们再来实现 `promise resolution` ， `promise resolution` 针对x的类型做了各种处理：如果 `promise` 和 `x` 指向同一对象，以 `TypeError` 为 `reason` 拒绝执行 `promise`、如果 `x` 为 `promise` ，则使 `promise` 接受 `x` 的状态、如果 `x` 为对象或者函数，判断 `x.then` 是否是函数、 如果 `x` 不为对象或者函数，以 `x` 为参数执行 `promise`（resolve和reject参数携带promise2的作用域，方便在x状态变更后去更改promise2的状态）
```
// promise resolution
function promiseResolution(promise2, x, resolve, reject) {
  let then
  let thenCalled = false
  // 2.3.1
  if (promise2 === x) {
    return reject(new TypeError('promise2 === x is not allowed'))
  }
  // 2.3.2
  if (x instanceof promise) {
    x.then(resolve, reject)
  }
  // 2.3.3
  if (typeof x === 'object' || typeof x === 'function') {
    try {
      // 2.3.3.1
      then = x.then
      if (typeof then === 'function') {
        // 2.3.3.2
        then.call(x, function resolvePromise(y) {
          // 2.3.3.3.3
          if (thenCalled) return
          thenCalled = true
          // 2.3.3.3.1
          return promiseResolution(promise2, y, resolve, reject)
        }, function rejectPromise(r) {
          // 2.3.3.3.3
          if (thenCalled) return
          thenCalled = true
          // 2.3.3.3.2
          return reject(r)
        })
      } else {
        // 2.3.3.4
        resolve(x)
      }
    } catch(e) {
      // 2.3.3.3.4.1
      if (thenCalled) return
      thenCalled = true
      // 2.3.3.2
      reject(e)
    }
  } else {
    // 2.3.4
    resolve(x)
  }
}
```

完整代码可查看[stage-4](https://github.com/zhoulang27426405/learn-promise/blob/master/stage-4/promise-4.js)
## 思考
以上，基本实现了一个简易版的 `promise` ，说白了，就是对 `Promises/A+` 规范的一个翻译，将规范翻译成代码。因为大家的实现都是基于这个规范，所以不同的 `promise` 实现之间能够共存(不得不说制定规范的人才是最厉害的)
```
function doSomething() {
  return new promise((resolve, reject) => {
    setTimeout(() => {
      resolve('promise done')
    }, 2000)
  })
}

function doSomethingElse() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('ES6 promise')
    }, 1000)
  })
}

this.promise2 = doSomething().then(doSomethingElse)
console.log(this.promise2)
```
至于 `ES6` 的 `finally` 、 `all` 等常用方法，规范虽然没有制定，但是借助 `then` 方法，我们实现起来也很方便[stage-5](https://github.com/zhoulang27426405/learn-promise/tree/master/stage-5)

`ES7` 的 `Async/Await` 也是基于 `promise` 来实现的，可以理解成  `async` 函数会隐式地返回一个 `Promise` ， `await` 后面的执行代码放到 `then` 方法中

更深层次的思考，你需要理解规范中每一条制定的意义，比如为什么then方法不像jQuery那样返回this而是要重新返回一个新的promise对象（如果then返回了this，那么promise2就和promise1的状态同步，promise1状态变更后，promise2就没办法接受后面异步操作进行的状态变更）、 `promise解决过程` 中为什么要规定 `promise2` 和 `x` 不能指向同一对象(防止循环引用)
## promise的弊端
promise彻底解决了callback hell，但也存在以下一些问题
1. 延时问题(涉及到[evnet loop](http://www.ruanyifeng.com/blog/2014/10/event-loop.html))
2. promise一旦创建，无法取消
3. pending状态的时候，无法得知进展到哪一步（比如接口超时，可以借助race方法）
4. promise会吞掉内部抛出的错误，不会反映到外部。如果最后一个then方法里出现错误，无法发现。（可以采取hack形式，在promise构造函数中判断onRejectedCb的数组长度，如果为0，就是没有注册回调，这个时候就抛出错误，某些库实现done方法，它不会返回一个promise对象，且在done()中未经处理的异常不会被promise实例所捕获）
5. then方法每次调用都会创建一个新的promise对象，一定程度上造成了内存的浪费
## 总结
支持 `promise` 的库有很多，现在主流的浏览器也都原生支持 `promise` 了，而且还有更好用的 `Async/Await` 。之所以还要花精力去写这篇文章,道理很简单，就是想对规范有一个更深的理解，希望看到这里的同学同样也能有所收获
## 背景
先来说说重复发送ajax请求带来的问题
- 场景一：用户快速点击按钮，多次相同的请求打到服务器，给服务器造成压力。如果碰到提交表单操作，而且恰好后端没有做兼容处理，那么可能会造成数据库中插入两条及以上的相同数据
- 场景二：用户频繁切换下拉筛选条件，第一次筛选数据量较多，花费的时间较长，第二次筛选数据量较少，请求后发先至，内容先显示在界面上。但是等到第一次的数据回来之后，就会覆盖掉第二次的显示的数据。筛选结果和查询条件不一致，用户体验很不好
## 常用解决方案
为了解决上述问题，通常会采用以下几种解决方案
- 状态变量

  发送ajax请求前，btnDisable置为true，禁止按钮点击，等到ajax请求结束解除限制，这是我们最常用的一种方案
![](https://user-gold-cdn.xitu.io/2019/12/2/16ec65eff4f78219?w=1584&h=986&f=png&s=153418)
  但该方案也存在以下弊端：
  - 与业务代码耦合度高
  - 无法解决上述场景二存在的问题

- 函数节流和函数防抖

  固定的一段时间内，只允许执行一次函数，如果有重复的函数调用，可以选择使用函数节流忽略后面的函数调用，以此来解决场景一存在的问题
![](https://user-gold-cdn.xitu.io/2019/12/2/16ec65c177e4f977?w=1584&h=578&f=png&s=101610)
![](https://user-gold-cdn.xitu.io/2019/12/2/16ec65bf624b153f?w=1584&h=1190&f=png&s=155460)
  也可以选择使用函数防抖忽略前面的函数调用，以此来解决场景二存在的问题
![](https://user-gold-cdn.xitu.io/2019/12/2/16ec65c45b92b94d?w=1584&h=578&f=png&s=102692)
![](https://user-gold-cdn.xitu.io/2019/12/2/16ec65c27c76ebd7?w=1584&h=918&f=png&s=139018)
  该方案能覆盖场景一和场景二，不过也存在一个大问题：
  - wait time是一个固定时间，而ajax请求的响应时间不固定，wait time设置小于ajax响应时间，两个ajax请求依旧会存在重叠部分，wait time设置大于ajax响应时间，影响用户体验。总之就是wait time的时间设定是个难题
## 请求拦截和请求取消
作为一个成熟的ajax应用，它应该能自己在pending过程中选择请求拦截和请求取消
- 请求拦截

  用一个数组存储目前处于pending状态的请求。发送请求前先判断这个api请求之前是否已经有还在pending的同类，即是否存在上述数组中，如果存在，则不发送请求，不存在就正常发送并且将该api添加到数组中。等请求完结后删除数组中的这个api。

- 请求取消

  用一个数组存储目前处于pending状态的请求。发送请求时判断这个api请求之前是否已经有还在pending的同类，即是否存在上述数组中，如果存在，则找到数组中pending状态的请求并取消，不存在就将该api添加到数组中。然后发送请求，等请求完结后删除数组中的这个api
## 实现
接下来介绍一下本文的主角 `axios` 的 `cancel token`([查看详情](https://github.com/axios/axios#cancellation))。通过`axios` 的 `cancel token`，我们可以轻松做到请求拦截和请求取消
```
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.get('/user/12345', {
  cancelToken: source.token
}).catch(function (thrown) {
  if (axios.isCancel(thrown)) {
    console.log('Request canceled', thrown.message);
  } else {
    // handle error
  }
});

axios.post('/user/12345', {
  name: 'new name'
}, {
  cancelToken: source.token
})

// cancel the request (the message parameter is optional)
source.cancel('Operation canceled by the user.');
```
官网示例中，先定义了一个 `const CancelToken = axios.CancelToken`，定义可以在axios源码`axios/lib/axios.js`目录下找到
```
// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
```
示例中调用了`axios.CancelToken`的source方法，所以接下来我们再去`axios/lib/cancel/CancelToken.js`目录下看看source方法
```
/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};
```
source方法返回一个具有`token`和`cancel`属性的对象，这两个属性都和`CancelToken`构造函数有关联，所以接下来我们再看看`CancelToken`构造函数
```
/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}
```
所以souce.token是一个CancelToken的实例，而source.cancel是一个函数，调用它会在CancelToken的实例上添加一个reason属性，并且将实例上的promise状态resolve掉

官网另一个示例
```
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // An executor function receives a cancel function as a parameter
    cancel = c;
  })
});

// cancel the request
cancel();
```
它与第一个示例的区别就在于每个请求都会创建一个CancelToken实例，从而它拥有多个cancel函数来执行取消操作

我们执行axios.get，最后其实是执行axios实例上的request方法，方法定义在`axios\lib\core\Axios.js`
```
Axios.prototype.request = function request(config) {
  ...
  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};
```
request方法返回一个链式调用的promise，等同于
```
Promise.resolve(config).then('request拦截器中的resolve方法', 'request拦截器中的rejected方法').then(dispatchRequest, undefined).then('response拦截器中的resolve方法', 'response拦截器中的rejected方法')
```
>在阅读源码的过程中，这些编程小技巧都是非常值得学些的

接下来看看`axios\lib\core\dispatchRequest.js`中的`dispatchRequest`方法
```
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);
  ...
  var adapter = config.adapter || defaults.adapter;
  return adapter(config).then()
};
```
如果是cancel方法立即执行，创建了CancelToken实例上的reason属性，那么就会抛出异常，从而被response拦截器中的rejected方法捕获，并不会发送请求，这个可以用来做请求拦截
```
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};
```
如果cancel方法延迟执行，那么我们接着去找`axios\lib\defaults.js`中的defaults.adapter
```
function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter()
}
```
终于找到`axios\lib\adapters\xhr.js`中的`xhrAdapter`
```
module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    ...
    var request = new XMLHttpRequest();
    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }
    // Send the request
    request.send(requestData);
  })
}
```
可以看到xhrAdapter创建了XMLHttpRequest对象，发送ajax请求，在这之后如果执行cancel函数将cancelToken.promise状态resolve掉，就会调用request.abort()，可以用来请求取消

## 解耦
剩下要做的就是将cancelToken从业务代码中剥离出来。我们在项目中，大多都会对axios库再做一层封装来处理一些公共逻辑，最常见的就是在response拦截器里统一处理返回code。那么我们当然也可以将cancelToken的配置放在request拦截器。可参考[demo](https://github.com/zhoulang27426405/axios-cancellation)

```
let pendingAjax = []
const fastClickMsg = '数据请求中，请稍后'
const CancelToken = axios.CancelToken
const removePendingAjax = (url, type) => {
  const index = pendingAjax.findIndex(i => i.url === url)
  if (index > -1) {
    type === 'req' && pendingAjax[index].c(fastClickMsg)
    pendingAjax.splice(index, 1)
  }
}

// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    const url = config.url
    removePendingAjax(url, 'req')
    config.cancelToken = new CancelToken(c => {
      pendingAjax.push({
        url,
        c
      })
    })
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  }
)

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    removePendingAjax(response.config.url, 'resp')
    return new Promise((resolve, reject) => {
      if (+response.data.code !== 0) {
        reject(new Error('network error:' + response.data.msg))
      } else {
        resolve(response)
      }
    })
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    Message.error(error)
    return Promise.reject(error)
  }
)
```
每次执行request拦截器，判断pendingAjax数组中是否还存在同样的url。如果存在，则删除数组中的这个api并且执行数组中在pending的ajax请求的cancel函数进行请求取消，然后就正常发送第二次的ajax请求并且将该api添加到数组中。等请求完结后删除数组中的这个api

```
let pendingAjax = []
const fastClickMsg = '数据请求中，请稍后'
const CancelToken = axios.CancelToken
const removePendingAjax = (config, c) => {
  const url = config.url
  const index = pendingAjax.findIndex(i => i === url)
  if (index > -1) {
    c ? c(fastClickMsg) : pendingAjax.splice(index, 1)
  } else {
    c && pendingAjax.push(url)
  }
}

// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    config.cancelToken = new CancelToken(c => {
      removePendingAjax(config, c)
    })
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  }
)

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    removePendingAjax(response.config)
    return new Promise((resolve, reject) => {
      if (+response.data.code !== 0) {
        reject(new Error('network error:' + response.data.msg))
      } else {
        resolve(response)
      }
    })
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    Message.error(error)
    return Promise.reject(error)
  }
)
```
每次执行request拦截器，判断pendingAjax数组中是否还存在同样的url。如果存在，则执行自身的cancel函数进行请求拦截，不重复发送请求，不存在就正常发送并且将该api添加到数组中。等请求完结后删除数组中的这个api
## 总结
`axios` 是基于 `XMLHttpRequest` 的封装，针对 `fetch` ,也有类似的解决方案 `AbortSignal` [查看详情](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)。大家可以针对各自的项目进行选取

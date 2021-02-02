# 从Webpack打包后的文件分析导入的原理

主流框架中，不论是React还是Vue，都是使用Webpack进行资源的打包，这篇文章我们试着分析打包后的bundle文件来了解下其是如何进行静态和动态导入的。

文章目录结构如下：
- bundle文件分析
- 静态导入文件
- 动态导入文件

## bundle文件分析

下面是代码整体的目录结构：

![markdown](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b3d1446adac741e8ac640ccb9f9d2c2c~tplv-k3u1fbpfcp-watermark.image "markdown")

入口文件 `main.js`

```javascript
import a from './a'
import b from './b'
```

a.js

```javascript
const asyncText = 'async'
export default asyncText
```

b.js

```javascript
import c from './c'
const b = 'b'
export default b
```

c.js

```javascript
export const c = 1
```

打包后的bundle文件过于冗长，删繁就简之后让我们看看他的主体部分：
![markdown](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7c135bf94e3b46988be40f16075622cd~tplv-k3u1fbpfcp-watermark.image "markdown")

我们看到整个文件就是一个自执行函数，所传入的参数是经过分析过后的文件路径，我们先来认识两个参数和一个函数：

- modules​：缓存 ​module​ 代码块，每个 ​module​ 有一个 ​id​，开发环境默认以 ​module​ 所在文件的文件名标识，生产环境默认以一个数字标识。​modules​ 是一个 ​object​， ​key​ 为 ​module id​，​value​ 为对应 ​module​ 的源代码块。

- ​installedModules​：缓存已经加载过的 ​module​，简单理解就是已经运行了源码中 `​import a from 'xxx'`​ 这样的语句。​installedModules​ 是一个 ​object​， ​key​ 为 ​module id​，​value​ 为对应 ​module​ 导出的变量。

- `__webpack_require__`: 根据传入的moduleId，判断是否加载过该模块，加载过则直接返回，未加载过则执行该模块代码。

## 静态导入文件

根据上面的内容分析，整个自执行函数执行的时候，传入的参数是根据我们文件内容生成的路径，参数内容如下。

```javascript
{
  "./src/a.js":
    function (module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    const asyncText = "async";
    __webpack_exports__["default"] = asyncText;
  },
  "./src/b.js":
    function (module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
      var _c__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
      /*! ./c */ "./src/c.js"
    );
    const b = "b";
    __webpack_exports__["default"] = b;
  },

  "./src/c.js":
    function (module, __webpack_exports__, __webpack_require__) {
    "use strict";
    __webpack_require__.r(__webpack_exports__);
    /* harmony export (binding) */ __webpack_require__.d(
      __webpack_exports__,
      "c",
      function () {
        return c;
      }
    );
    const c = 1;
  },
  "./src/main.js":
    function (module, __webpack_exports__, __webpack_require__) {
      "use strict";
      __webpack_require__.r(__webpack_exports__);
        var _a__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
          "./src/a.js"
      );
    var _b__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
        "./src/b.js"
    );
  }
}
```

对象以当前文件路径为key，文件内容为value，发现文件内容里有import，则转化成 `__webpack_require__` 函数执行。

回看我们的自执行函数，当函数执行的时候，会根据 webpack.config 配置首先去执行 moduleId 为 `./src/main.js` 的入口文件的内容。

```javascript
return __webpack_require__(
  (__webpack_require__.s = "./src/main.js")
);
```

**执行key为 `./src/main.js` 的模块内容时发现其依赖a.js、b.js，依次递归去执行对应的模块内容，由于installedModules的存在，不会再次去执行加载过的模块，依次类推，这就是Webpack导入静态依赖的过程。**

## 动态导入文件

前面分析了静态文件的导入，我们现在来改下main.js的内容，如下：

`main.js`

```javascript
import('./a').then((({ default: text}) => {
  console.log(text)
}))
```
在main.js通过动态导入语法导入a.js，生成的dist文件如下：

![markdown](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/99a52842087845e5854ab2f8016ee2d7~tplv-k3u1fbpfcp-watermark.image "markdown")

相比静态导入，动态导入多了个 `0.bundle.js`，我们再来看看bundle.js文件的主体：

![markdown](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f434b8ea5ec47a0b29c81548002618d~tplv-k3u1fbpfcp-watermark.image "markdown")

对比静态导入，动态导入多了几个重要的函数和对象installedChunks和`__webpack_require__.e`，我们还是先来说明下这两个新增成员的具体用途。

+ installedChunks​：缓存已经加载过的 ​chunk​，简单理解就是把其他 ​js​ 文件中的 ​chunk​ 包含的 ​modules​ 同步到了当前文件中。每个 ​chunk​ 有一个 ​id​，默认以一个数字标识。​installedChunks​ 也是一个对象，​key​ 为 ​chunk id​，​value​ 有四种情况：
  + undefined：chunk not loaded
  + null：chunk preloaded/prefetched
  + Promise：chunk loading
  + 0：chunk loaded

+ `__webpack_require__.e`：根据 installedChunks 检查是否加载过该 chunk，假如没加载过，则发起一个 JSONP 请求去加载 chunk，
设置一些请求的错误处理，然后返回一个 Promise。

我们还是来看看传入自执行函数中的参数

```javascript
{
  /***/ "./src/main.js": /***/ function (
    module,
    exports,
    __webpack_require__
  ) {
    __webpack_require__.e(/*! import() */ 0)
      .then(__webpack_require__.bind(null, "./src/a.js"))
      .then(({ default: text }) => {
        console.log(text);
      });
    /***/
  }
  /******/
}
```

有个新面孔，`__webpack_require__.e`，函数逻辑如下：

```javascript
__webpack_require__.e = function requireEnsure(chunkId) {
  var promises = []; // JSONP chunk loading for javascript
  var installedChunkData = installedChunks[chunkId];
  if (installedChunkData !== 0) {
    if (installedChunkData) {
      promises.push(installedChunkData[2]);
  } else {
      // setup Promise in chunk cache
      var promise = new Promise(function (resolve, reject) {
        installedChunkData = installedChunks[chunkId] = [
        resolve,
        reject
      ];

    });
    promises.push((installedChunkData[2] = promise)); // start chunk loading

    var script = document.createElement("script");
    var onScriptComplete;

    script.charset = "utf-8";
    script.timeout = 120;
    if (__webpack_require__.nc) {
      script.setAttribute("nonce", __webpack_require__.nc);
    }
    script.src = jsonpScriptSrc(chunkId); // create error before stack unwound to get useful stacktrace later
    var error = new Error();
    onScriptComplete = function (event) {
      script.onerror = script.onload = null;
      clearTimeout(timeout);
      var chunk = installedChunks[chunkId];
      if (chunk !== 0) {
        if (chunk) {
          var errorType =
          event && (event.type === "load" ? "missing" : event.type);
          var realSrc = event && event.target && event.target.src;
          error.message =
          "Loading chunk " +
          chunkId +
          " failed.\n(" +
          errorType +
          ": " +
          realSrc +
          ")";
          error.name = "ChunkLoadError";
          error.type = errorType;
          error.request = realSrc;
          chunk[1](error);

      }
        installedChunks[chunkId] = undefined;
    }
  };
    var timeout = setTimeout(function () {
      onScriptComplete({ type: "timeout", target: script });
    }, 120000);
    script.onerror = script.onload = onScriptComplete;
    document.head.appendChild(script);
  }
  return Promise.all(promises);
};
```

代码有点长，具体做了些什么前面已经说过，不再赘述，我们来看下重点返回的Promise，下面这段代码里，如果你读完了上述代码会发现，我们将promise的resolve和reject保存了起来

``` javascript
installedChunkData = installedChunks[chunkId] = [
  resolve,
  reject
];
```
但是仅仅在脚本文件的onerror事件中调用了reject，整个函数里并没有调用resolve的地方，那这边是在哪里调用了resolve让函数正常走下去呢？

我们先来看看我们请求的 `0.bundle.js` 的内容

```javascript
(window["webpackJsonp"] = window["webpackJsonp"] || []).push([
  [0],
  {
    "./src/a.js": function (module, __webpack_exports__, __webpack_require__) {
      "use strict";
      __webpack_require__.r(__webpack_exports__);
      const asyncText = "async";
      __webpack_exports__["default"] = asyncText;
    }
  }
]);
```

Webpack会往 `(window["webpackJsonp"] = window["webpackJsonp"] || [])` 对象里push对应chunk的chunkId和对应的模块代码，而在bundle文件里，有一段很巧妙的代码

```javascript
var jsonpArray = (window["webpackJsonp"] = window["webpackJsonp"] || []);

var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
jsonpArray.push = webpackJsonpCallback;
jsonpArray = jsonpArray.slice();

for (var i = 0; i < jsonpArray.length; i++) {
  webpackJsonpCallback(jsonpArray[i]);
}
```

这里将 `(window["webpackJsonp"] = window["webpackJsonp"] || [])` 对象赋值给了jsonpArray，当Webpack在` 0.bundle.js` 里执行了 `(window["webpackJsonp"] = window["webpackJsonp"] || []).push` 就相当于执行webpackJsonpCallback这个函数，现在我们再来看看webpackJsonpCallback这个函数里做了些什么

```javascript
function webpackJsonpCallback(data) {
  var chunkIds = data[0];
  var moreModules = data[1]; // add "moreModules" to the modules object, // then flag all "chunkIds" as loaded and fire callback

  var moduleId,
    chunkId,
    i = 0,
    resolves = [];
  for (; i < chunkIds.length; i++) {
    chunkId = chunkIds[i];
    if (
      Object.prototype.hasOwnProperty.call(installedChunks, chunkId) &&
      installedChunks[chunkId]
    ) {
      resolves.push(installedChunks[chunkId][0]);
    }
    installedChunks[chunkId] = 0;
  }
  for (moduleId in moreModules) {
    if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
      modules[moduleId] = moreModules[moduleId];
    }
  }
  if (parentJsonpFunction) parentJsonpFunction(data);

  while (resolves.length) {
    resolves.shift()();
  }
}
```

传入的data就是我们 `0.bundle.js` 里push的参数，所以逻辑就很简单了，主要是做了两件事，第一个是往modules里push异步模块，第二件事就是我们要找的执行resolve。
最后还有一步就是要利用 `__webpack_require__` 将异步模块注册到我们的installedModules里，防止重复加载

```javascript
__webpack_require__.e(/*! import() */ 0)
.then(__webpack_require__.bind(null, "./src/a.js"))
.then(({ default: text }) => {
  console.log(text);
});
```

**到这里我们就基本分析完了Webpack动态导入的过程，基本的逻辑就是将要加载的异步模块作为一个脚本文件发出新的请求，这样就避免了所有要导入的文件都要通过一个js文件去请求。**


本文参考：
[聊聊 webpack 异步加载](https://www.toutiao.com/i6790550018601255432/?group_id=6790550018601255432)
[webpack是如何实现动态导入的](https://zhuanlan.zhihu.com/p/73325163)

浅谈Async/Await
===========

### 概要

在很长一段时间里面，FE们不得不依靠回调来处理异步代码。使用回调的结果是，代码变得很纠结，不便于理解与维护，值得庆幸的是Promise带来了.then()，让代码变得井然有序，便于管理。于是我们大量使用，代替了原来的回调方式。但是不存在一种方法可以让当前的执行流程阻塞直到promise完成。JS里面，我们无法直接原地等promise完成，唯一可以用于提前计划promise完成后的执行逻辑的方式就是通过then附加回调函数。
现在随着Async/Await的增加，可以让接口按顺序异步获取数据，用更可读，可维护的方式处理回调。

### What Is Async/Await

Async/Await是一个期待已久的JavaScript特性，让我们更好的理解使用异步函数。它建立在Promises上，并且与所有现有的基于Promise的API兼容。那么下面我来学习下这两个函数吧，lets go~

1、Async—声明一个异步函数(async function someName(){...})
> * 自动将常规函数转换成Promise，返回值也是一个Promise对象
> * 只有async函数内部的异步操作执行完，才会执行then方法指定的回调函数
> * 异步函数内部可以使用await

2、Await—暂停异步的功能执行(var result = await someAsyncCall();)
> * 放置在Promise调用之前，await强制其他代码等待，直到Promise完成并返回结果
> * 只能与Promise一起使用，不适用与回调
> * 只能在async函数内部使用

3、使用小贴士：async函数完全可以看作多个异步操作，包装成的一个 Promise 对象，而await命令就是内部then命令的语法糖。

### How To Use Async/Await
如何来用呢？我们一起来敲一敲代码吧~

1、async 函数的几种使用形式

![enter description here][1]

![enter description here][2]

2、await的用法则相对简单了许多，他后面需要是一个Promise对象，如果不是则会被转成Promise对象。只要其中一个如果Promise对象变为reject状态，那么整个async函数都会中断操作。如果状态是resolve，那么他的返回值则会变成then里面的参数，如下。

![enter description here][3]

3、使用小贴士
> * 怎样容错呢，犹豫await后面的promise运行结果可能是rejected，最好把await放入try{}catch{}中
> * Await后的异步操作，如果彼此没有依赖关系最好同时触发，在下面场景一会有介绍
> * Await只能在async函数之中，如果在普通函数中，会报错

### 使用场景介绍

那么什么情况下适合用，什么情况下不适合使用呢？

1、场景一，我们同时发出三个不互相依赖的请求，如果用Async/Await就显得不明智了

![enter description here][4]

如上图所示，上面我们A需要2s，B需要4s，C需要3s，我们如上图所示发请求，就存在彼此依赖的关系，c等b执行完，b等a执行完，从开始到结束需要（2+3+4）9s。

此时我们需要用Promise.all()将异步调用并行执行，而不是一个接一个执行，如下所示：

![enter description here][5]

这样将会节省我们不少的时间，从原来的的9s缩减到4s，是不是很开心，耶~

2、场景二，我曾经遇到过一个场景，一个提交表单的页面，里面有姓名、地址等巴拉巴拉的信息，其中有一项是手机验证码，我们不得不等待手机验证码接口通过，才能发出后续的请求操作，这时候接口之间就存在了彼此依赖的关系，Async跟Await就有了用武之地，让异步请求之间可以按顺序执行。

其中不用Async/Await的写法，我们不得不用.then()的方式，在第一个请求验证码的接口有返回值之后，才能执行后续的的Promise，并且还需要一个then输出结果，如下图：

![enter description here][6]

而用Async/Await的方式去写就是下面这样，我们将逻辑分装在一个async函数里。这样我们就可以直接对promise使用await了，也就规避了写then回调。最后我们调用这个async函数，然后按照普通的方式使用返回的promise。要记得容错呢~~

![enter description here][7]

以上是两个模拟简单的场景，为的是让大家容易理解Async/Await的使用，那么接下来我们看看兼容性吧~

### 兼容性

Async / Await已经在大多数主流浏览器中可用。

![enter description here][8]

### 小结

Async/Await让我们用少量的代码来使用Promise，我们可以将一些有依赖关系的回调函数的处理逻辑放在async里面，然后在非async的区域使用，这样可以减少then或者catch回调。


  [1]: ./images/1513082891340.jpg "1513082891340.jpg"
  [2]: ./images/1513082899320.jpg "1513082899320.jpg"
  [3]: ./images/1513082943060.jpg "1513082943060.jpg"
  [4]: ./images/1513083213435.jpg "1513083213435.jpg"
  [5]: ./images/1513083274675.jpg "1513083274675.jpg"
  [6]: ./images/1513083333372.jpg "1513083333372.jpg"
  [7]: ./images/1513083355682.jpg "1513083355682.jpg"
  [8]: ./images/1513083427208.jpg "1513083427208.jpg"
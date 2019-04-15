# Node.js微服务实践(二) 

## 基于Seneca 和 PM2构建

本章主要分为三个小节：

- 选择Nodejs的理由：将证明选择Node.js来构建的正确性。介绍使用Node.js时设计的软件栈。
- 微服务架构[Seneca](http://senecajs.org)：关于Seneca 的基本知识。
- [PM2](http://pm2.keymetrics.io/)：PM2 是运行 Node.js 应用的最好选择。

### 选着Node.js的理由

 如今，Node.js 已经成为国际上许多科技公司的首选方案。特别的，对于在服务器端需要费阻塞特性的场景，Node.js 俨然成了最好的选择。
 
 本章我们主要讲Seneca 和 PM2 作为构建、运行微服务的框架。虽然选择了Seneca和PM2，但并不意味着其他框架不好。
 
 业界还存在一些其他被选方案，例如 restify或Express、Egg.js 可用于构建应用，forever或者nodemon可用于运行应用。而Seneca和PM2我觉得是构建微服务最佳的组合，主要原因如下：

- PM2 在应用部署方面有着异常的强大功能。
- Seneca 不仅仅是一个构建服务的架构，它还是个范例，能够重塑我们对于面向对象软件的认识。

### 第一个程序 --- Hello World

Node.js 中最兴奋的理念之一就是简单。只要熟悉 JavaScript，你就可以在几天内学会Node.js。用Node.js编写的代码要比使用其他语言编写的代码更加简短：

```JavaScript
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```
上述代码创建了一个服务端程序，并监听 3000 端口。运行代码后可在浏览器中输入：http://127.0.0.1:3000，既可预览到`Hello World`。

### Node.js 的线程模型

Node.js 采用的是异步处理机制。这表示在处理较慢的事件时，比如读取文件，Node.js 不会阻塞线程，而是继续处理其他事件，Noede.js 的控制流在读取文件完毕时，会执行相应的方法来处理返回信息。

以上一个小节代码为例，`http.createServer` 方法接受一个回调函数，这个回调函数将在接收一个HTTP请求时被执行。但是在等待HTTP请求同时，线程仍然可以处理其他事件。

### SOLID 设计原则

每当谈论微服务，我们总会提及模块化，而模块化归结于以下设计原则：
- 单一职责原则
- 开放封闭原则（对扩展开放、对修改关闭）
- 里氏替换原则（如果使用的是一个父类的话， 那么一定适用于其子类， 而察觉不出父类对象和子类对象的区别。 也即是说，把父类替换成它的子类， 行为不会有变化。 简单地说， 子类型必须能够替换掉它们的父类型。）
- 接口分离原则
- 依赖倒置原则（反转控制和依赖注入）

你应该将代码以模块的形式进行组织。一个模块应该是代码的聚合，他负责简单地处理某件事情，并且可以处理的很好，例如操作字符串。但是请注意，你的模块包含越多的函数（类、工具），它将越缺乏内聚性，这是应该极力避免的。

在Node.js中，每个JavaScript文件默认是一个模块。当然，也可以使用文件夹的形式组织模块，但是我们现在只关注的使用文件的形式：

```JavaScript
function contains(a, b) {
  return a.indexOf(b) > -1;
}

function stringToOrdinal(str) {
  let result = '';

  for (let i = 0, len = str.length; i < len; i++) {
    result += charToNuber(str[i]);
  }

  return result;
}

function charToNuber(char) {
  return char.charCodeAt(0) - 96;
}

module.exports = {
    contains,
    stringToOrdinal
}
```

以上代码是一个有效的Node.js模块。这三个模块有三个函数，其中两个作为共有函数暴露外部模块使用。

如果想使用这个模块只需要`require()`函数，如下所示：

```JavaScript
const stringManipulation = request('./string-manipulation');
console.log(stringManipulation.stringToOrdinal('aabb'));
```

输出结果是`1122`。

结合 SOLID原则，回顾一下我们的模块。
- **单一设计原则：** 模块只处理字符串。
- **开放封闭原则（对扩展开放，对修改关闭）：** 可以为模块添加更多的函数，那些已有的正确函数可以用于构建模块中的新函数，同时，我们不对公用代码进行修改。
- **里氏替换原则：** 跳过这个原则，因为该模块的结构并没有体现这一原则。
- **接口分离原则：** JavaScript 与 Java、C#不同，他不是一门纯面向接口的语言。但是本模块确实暴露了接口。通过`module.exports`变量将共有函数的接口暴露给调用者，这样具体实现的修改并不会影响到使用者的代码编写。
- **依赖倒置：** 这是失败的地方，虽然不是彻底失败，但也足以是我们必须重新考量所使用的方法。

### 微服务框架 Seneca

[Seneca](http://senecajs.org) 是一个能让您快速构建基于消息的微服务系统的工具集，你不需要知道各种服务本身被部署在何处，不需要知道具体有多少服务存在，也不需要知道他们具体做什么，任何你业务逻辑之外的服务（如数据库、缓存或者第三方集成等）都被隐藏在微服务之后。

这种解耦使您的系统易于连续构建与更新，Seneca 能做到这些，原因在于它的三大核心功能：

- 模式匹配：不同于脆弱的服务发现，模式匹配旨在告诉这个世界你真正关心的消息是什么；
- 无依赖传输：你可以以多种方式在服务之间发送消息，所有这些都隐藏至你的业务逻辑之后；
- 组件化：功能被表示为一组可以一起组成微服务的插件。

在 Seneca 中，消息就是一个可以有任何你喜欢的内部结构的 JSON 对象，它们可以通过 HTTP/HTTPS、TCP、消息队列、发布/订阅服务或者任何能传输数据的方式进行传输，而对于作为消息生产者的你来讲，你只需要将消息发送出去即可，完全不需要关心哪些服务来接收它们。

然后，你又想告诉这个世界，你想要接收一些消息，这也很简单，你只需在 Seneca 中作一点匹配模式配置即可，匹配模式也很简单，只是一个键值对的列表，这些键值对被用于匹配 JSON 消息的极组属性。

在本文接下来的内容中，我们将一同基于 Seneca 构建一些微服务。

#### 模式（ Patterns ）

让我们从一点特别简单的代码开始，我们将创建两个微服务，一个会进行数学计算，另一个去调用它：

```JavaScript
const seneca = require('seneca')();

seneca.add('role:math, cmd:sum', (msg, reply) => {
  reply(null, { answer: ( msg.left + msg.right )})
});

seneca.act({
  role: 'math',
  cmd: 'sum',
  left: 1,
  right: 2
}, (err, result) => {
  if (err) {
    return console.error(err);
  }
  console.log(result);
});
```

目前，这一切都发生在同一个过程中，没有网络流量。进程内函数调用也是一种消息传输！

该`seneca.add`方法将新的操作模式添加到Seneca实例。它有两个参数：

- pattern：要在Seneca实例接收的任何JSON消息中匹配的属性模式。
- action：模式匹配消息时要执行的函数。


动作功能有两个参数：

- msg：匹配的入站消息（作为普通对象提供）。
- respond：一个回调函数，用于提供对消息的响应。

响应函数是带有标准error, result签名的回调函数。

让我们再把这一切放在一起：

```JavaScript
seneca.add({role: 'math', cmd: 'sum'}, function (msg, respond) {
  var sum = msg.left + msg.right
  respond(null, {answer: sum})
})

```
在示例代码中，操作计算通过消息对象的`left`和 `right`属性提供的两个数字的总和。并非所有消息都会生成结果，但由于这是最常见的情况，因此Seneca允许您通过回调函数提供结果。

总之，操作模式`role:math,cmd:sum`对此消息起作用：

```
{role: 'math', cmd: 'sum', left: 1, right: 2}
```

产生这个结果：

```
{answer: 3}
```

这些属性`role`并没有什么特别之处`cmd`。它们恰好是您用于模式匹配的那些。

该`seneca.act`方法提交消息以进行操作。它有两个参数：

- msg：消息对象。
- response_callback：一个接收消息响应的函数（如果有）。

响应回调是您使用标准`error, result`签名提供的功能。如果存在问题（例如，消息不匹配任何模式），则第一个参数是 [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)对象。如果一切按计划进行，则第二个参数是结果对象。在示例代码中，这些参数只是打印到控制台：

```JavaScript
seneca.act({role: 'math', cmd: 'sum', left: 1, right: 2}, function (err, result) {
  if (err) return console.error(err)
  console.log(result)
})
```

[sum.js](https://github.com/senecajs/getting-started/blob/master/sum.js)文件中的示例代码向您展示了如何在同一个Node.js进程中定义和调用操作模式。您很快就会看到如何在多个进程中拆分此代码。

#### 匹配模式如何工作？

模式 - 与网络地址或主题相对 - 使扩展和增强系统变得更加容易。他们通过逐步添加新的微服务来实现这一点。

让我们的系统增加两个数相乘的能力。

我们希望看起来像这样的消息：

```
{role: 'math', cmd: 'product', left: 3, right: 4}

```
产生这样的结果：


```
{answer: 12}
```
您可以使用`role: math, cmd: sum`操作模式作为模板来定义新 `role: math, cmd: product`操作：

```JavaScript
seneca.add({role: 'math', cmd: 'product'}, function (msg, respond) {
  var product = msg.left * msg.right
  respond(null, { answer: product })
})
```

你可以用完全相同的方式调用它：

```JavaScript
seneca.act({role: 'math', cmd: 'product', left: 3, right: 4}, console.log)
```

在这里，您可以使用console.log快捷方式打印错误（如果有）和结果。运行此代码会产生：

```
{answer: 12}
```

把这一切放在一起，你得到：

```JavaScript
var seneca = require('seneca')()

seneca.add({role: 'math', cmd: 'sum'}, function (msg, respond) {
  var sum = msg.left + msg.right
  respond(null, {answer: sum})
})

seneca.add({role: 'math', cmd: 'product'}, function (msg, respond) {
  var product = msg.left * msg.right
  respond(null, { answer: product })
})


seneca.act({role: 'math', cmd: 'sum', left: 1, right: 2}, console.log)
      .act({role: 'math', cmd: 'product', left: 3, right: 4}, console.log)
```

在上面的代码示例中，seneca.act调用链接在一起。Seneca提供链接API作为方便。链接的调用按顺序执行，但不是按顺序执行，因此它们的结果可以按任何顺序返回。

#### 扩展模式以增加新功能

模式使您可以轻松扩展功能。您只需添加更多模式，而不是添加if语句和复杂逻辑。

让我们通过添加强制整数运算的能力来扩展加法动作。为此，您需要向消息对象添加一个新属性`integer：true`。然后，为具有此属性的邮件提供新操作：

```JavaScript
seneca.add({role: 'math', cmd: 'sum', integer: true}, function (msg, respond) {
  var sum = Math.floor(msg.left) + Math.floor(msg.right)
  respond(null, {answer: sum})
})
```

现在，这条消息
```
{role: 'math', cmd: 'sum', left: 1.5, right: 2.5, integer: true}
```

产生这个结果：

```
{answer: 3}  // == 1 + 2, as decimals removed
```
如果将两种模式添加到同一系统会发生什么？Seneca如何选择使用哪一个？更具体的模式总是赢。换句话说，具有最多匹配属性的模式具有优先权。

这里有一些代码来说明这一点：

```JavaScript
var seneca = require('seneca')()

seneca.add({role: 'math', cmd: 'sum'}, function (msg, respond) {
  var sum = msg.left + msg.right
  respond(null, {answer: sum})
})

//  下面两条消息都匹配  role: math, cmd: sum


seneca.act({role: 'math', cmd: 'sum', left: 1.5, right: 2.5}, console.log)
seneca.act({role: 'math', cmd: 'sum', left: 1.5, right: 2.5, integer: true}, console.log)

seneca.add({role: 'math', cmd: 'sum', integer: true}, function (msg, respond) {
  var sum = Math.floor(msg.left) + Math.floor(msg.right)
  respond(null, { answer: sum })
})

//下面这条消息同样匹配 role: math, cmd: sum
seneca.act({role: 'math', cmd: 'sum', left: 1.5, right: 2.5}, console.log)

// 但是，也匹配 role:math,cmd:sum,integer:true
  // 但是因为更多属性被匹配到，所以，它的优先级更高
seneca.act({role: 'math', cmd: 'sum', left: 1.5, right: 2.5, integer: true}, console.log)
```

它产生的输出是：

```
2016  ...  INFO  hello  ...
null { answer: 4 }
null { answer: 4 }
null { answer: 4 }
null { answer: 3 }
```
前两个.act调用都匹配`role: math, cmd: sum`动作模式。接下来，代码定义仅整数动作模式`role: math, cmd: sum, integer: true`。在那之后，第三次调用.act与`role: math, cmd: sum`行动一致，但第四次调用 `role: math, cmd: sum, integer: true`。此代码还演示了您可以链接.add和.act调用。此代码在[sum-integer.js](https://github.com/senecajs-attic/getting-started/blob/master/sum-integer.js)文件中可用。

通过匹配更具体的消息类型，轻松扩展操作行为的能力是处理新的和不断变化的需求的简单方法。这既适用于您的项目正在开发中，也适用于实时项目且需要适应的项目。它还具有您不需要修改现有代码的优点。添加新代码来处理特殊情况会更安全。在生产系统中，您甚至不需要重新部署。您现有的服务可以保持原样运行。您需要做的就是启动新服务。

#### 基于模式的代码复用

动作模式可以调用其他动作模式来完成它们的工作。让我们修改我们的示例代码以使用此方法：

```JavaScript
var seneca = require('seneca')()

seneca.add('role: math, cmd: sum', function (msg, respond) {
  var sum = msg.left + msg.right
  respond(null, {answer: sum})
})

seneca.add('role: math, cmd: sum, integer: true', function (msg, respond) {
  // 复用 role:math, cmd:sum
  this.act({
    role: 'math',
    cmd: 'sum',
    left: Math.floor(msg.left),
    right: Math.floor(msg.right)
  }, respond)
})

// 匹配 role:math,cmd:sum
seneca.act('role: math, cmd: sum, left: 1.5, right: 2.5',console.log)

// 匹配 role:math,cmd:sum,integer:true
seneca.act('role: math, cmd: sum, left: 1.5, right: 2.5, integer: true', console.log)
```

在此版本的代码中`，role: math, cmd: sum, integer: true`操作模式的定义使用先前定义的`role: math, cmd: sum`操作模式。但是，它首先修改消息以将left和right属性转换为整数。

在action函数内部，context变量this是对当前Seneca实例的引用。这是在行动中引用Seneca的正确方法，因为您获得了当前动作调用的完整上下文。这使您的日志更具信息性等。

此代码使用缩写形式的JSON来指定模式和消息。例如，对象文字形式
```
{role: 'math', cmd: 'sum', left: 1.5, right: 2.5}
```
变为：
```
'role: math, cmd: sum, left: 1.5, right: 2.5'
```

这种格式[jsonic](https://github.com/rjrodger/jsonic)，作为字符串文字提供，是一种方便的格式，可以使代码中的模式和消息更简洁。

[sum-reuse.js](https://github.com/senecajs-attic/getting-started/blob/master/sum-reuse.js)文件中提供了上述示例的代码。

#### 模式是唯一的

你定义的 Action 模式都是唯一了，它们只能触发一个函数，模式的解析规则如下：

- 更多我属性优先级更高
- 若模式具有相同的数量的属性，则按字母顺序匹配


这里有些例子：

`a:1, b:2`优先于 ，`a:1`因为它有更多的属性。

`a:1, b:2`优先于 `a:1, c:3`如b之前谈到c的字母顺序。

`a:1, b:2, d:4`优先于 `a:1, c:3, d:4`如b之前谈到c的字母顺序。

`a:1, b:2, c:3`优先于 ，`a:1, b:2`因为它有更多的属性。

`a:1, b:2, c:3`优先于 ，`a:1, c:3`因为它有更多的属性。

很多时间，提供一种可以让你不需要全盘修改现有 Action 函数的代码即可增加它功能的方法是很有必要的，比如，你可能想为某一个消息增加更多自定义的属性验证方法，捕获消息统计信息，添加额外的数据库结果中，或者控制消息流速等。

我下面的示例代码中，加法操作期望 left 和 right 属性是有限数，此外，为了调试目的，将原始输入参数附加到输出的结果中也是很有用的，您可以使用以下代码添加验证检查和调试信息：

```JavaScript
const seneca = require('seneca')()

seneca
  .add(
    'role:math,cmd:sum',
    function(msg, respond) {
      var sum = msg.left + msg.right
      respond(null, {
        answer: sum
      })
    })

// 重写 role:math,cmd:sum with ，添加额外的功能
.add(
  'role:math,cmd:sum',
  function(msg, respond) {

    // bail out early if there's a problem
    if (!Number.isFinite(msg.left) ||
      !Number.isFinite(msg.right)) {
      return respond(new Error("left 与 right 值必须为数字。"))
    }

    // 调用上一个操作函数 role:math,cmd:sum
    this.prior({
      role: 'math',
      cmd: 'sum',
      left: msg.left,
      right: msg.right,

    }, function(err, result) {
      if (err) return respond(err)

      result.info = msg.left + '+' + msg.right
      respond(null, result)
    })
  })

// 增加了的 role:math,cmd:sum
.act('role:math,cmd:sum,left:1.5,right:2.5',
  console.log // 打印 { answer: 4, info: '1.5+2.5' }
)
```
seneca 实例提供了一个名为 prior 的方法，让可以在当前的 action 方法中，调用被其重写的旧操作函数。

prior 函数接受两个参数：

- msg：消息体
- response_callback：回调函数

在上面的示例代码中，已经演示了如何修改入参与出参，修改这些参数与值是可选的，比如，可以再添加新的重写，以增加日志记录功能。

在上面的示例中，也同样演示了如何更好的进行错误处理，我们在真正进行操作之前，就验证的数据的正确性，若传入的参数本身就有错误，那么我们直接就返回错误信息，而不需要等待真正计算的时候由系统去报错了。

>错误消息应该只被用于描述错误的输入或者内部失败信息等，比如，如果你执行了一些数据库的查询，返回没有任何数据，这并不是一个错误，而仅仅只是数据库的事实的反馈，但是如果连接数据库失败，那就是一个错误了。

上面的代码可以在 [sum-valid.js](https://github.com/pantao/getting-started-seneca/blob/master/sum-valid.js) 文件中找到。

#### 使用插件组织模式

一个 seneca 实例，其实就只是多个 Action Patterm 的集合而已，你可以使用命名空间的方式来组织操作模式，例如在前面的示例中，我们都使用了 role: math，为了帮助日志记录和调试， Seneca 还支持一个简约的插件支持。

同样，Seneca插件只是一组操作模式的集合，它可以有一个名称，用于注释日志记录条目，还可以给插件一组选项来控制它们的行为，插件还提供了以正确的顺序执行初始化函数的机制，例如，您希望在尝试从数据库读取数据之前建立数据库连接。

简单来说，Seneca插件就只是一个具有单个参数选项的函数，你将这个插件定义函数传递给 seneca.use 方法，下面这个是最小的Seneca插件（其实它什么也没做！）：

```JavaScript
function minimal_plugin(options) {
  console.log(options)
}

require('seneca')()
  .use(minimal_plugin, {foo: 'bar'})

```
seneca.use 方法接受两个参数：

- plugin ：插件定义函数或者一个插件名称；
- options ：插件配置选项

上面的示例代码执行后，打印出来的日志看上去是这样的：

```
{"kind":"notice","notice":"hello seneca 3qk0ij5t2bta/1483584697034/62768/3.2.2/-","level":"info","when":1483584697057}
(node:62768) DeprecationWarning: 'root' is deprecated, use 'global'
{ foo: 'bar' }
```

Seneca 还提供了详细日志记录功能，可以提供为开发或者生产提供更多的日志信息，通常的，日志级别被设置为 INFO，它并不会打印太多日志信息，如果想看到所有的日志信息，试试以下面这样的方式启动你的服务：

```
node minimal-plugin.js --seneca.log.all
```
会不会被吓一跳？当然，你还可以过滤日志信息：

```
node minimal-plugin.js --seneca.log.all | grep plugin:define
```
通过日志我们可以看到， seneca 加载了很多内置的插件，比如 basic、transport、web 以及 mem-store，这些插件为我们提供了创建微服务的基础功能，同样，你应该也可以看到 minimal_plugin 插件。

现在，让我们为这个插件添加一些操作模式：

```JavaScript
function math(options) {

  this.add('role:math,cmd:sum', function (msg, respond) {
    respond(null, { answer: msg.left + msg.right })
  })

  this.add('role:math,cmd:product', function (msg, respond) {
    respond(null, { answer: msg.left * msg.right })
  })

}

require('seneca')()
  .use(math)
  .act('role:math,cmd:sum,left:1,right:2', console.log)
```

运行 [math-plugin.js](https://github.com/pantao/getting-started-seneca/blob/master/math-plugin.js) 文件，得到下面这样的信息：

```
null { answer: 3 }
```
看打印出来的一条日志：

```
{
  "actid": "7ubgm65mcnfl/uatuklury90r",
  "msg": {
    "role": "math",
    "cmd": "sum",
    "left": 1,
    "right": 2,
    "meta$": {
      "id": "7ubgm65mcnfl/uatuklury90r",
      "tx": "uatuklury90r",
      "pattern": "cmd:sum,role:math",
      "action": "(bjx5u38uwyse)",
      "plugin_name": "math",
      "plugin_tag": "-",
      "prior": {
        "chain": [],
        "entry": true,
        "depth": 0
      },
      "start": 1483587274794,
      "sync": true
    },
    "plugin$": {
      "name": "math",
      "tag": "-"
    },
    "tx$": "uatuklury90r"
  },
  "entry": true,
  "prior": [],
  "meta": {
    "plugin_name": "math",
    "plugin_tag": "-",
    "plugin_fullname": "math",
    "raw": {
      "role": "math",
      "cmd": "sum"
    },
    "sub": false,
    "client": false,
    "args": {
      "role": "math",
      "cmd": "sum"
    },
    "rules": {},
    "id": "(bjx5u38uwyse)",
    "pattern": "cmd:sum,role:math",
    "msgcanon": {
      "cmd": "sum",
      "role": "math"
    },
    "priorpath": ""
  },
  "client": false,
  "listen": false,
  "transport": {},
  "kind": "act",
  "case": "OUT",
  "duration": 35,
  "result": {
    "answer": 3
  },
  "level": "debug",
  "plugin_name": "math",
  "plugin_tag": "-",
  "pattern": "cmd:sum,role:math",
  "when": 1483587274829
}
```
所有的该插件的日志都被自动的添加了 plugin 属性。

在 Seneca 的世界中，我们通过插件组织各种操作模式集合，这让日志与调试变得更简单，然后你还可以将多个插件合并成为各种微服务，在接下来的章节中，我们将创建一个 math 服务。

插件通过需要进行一些初始化的工作，比如连接数据库等，但是，你并不需要在插件的定义函数中去执行这些初始化，定义函数被设计为同步执行的，因为它的所有操作都是在定义一个插件，事实上，你不应该在定义函数中调用 seneca.act 方法，只调用 seneca.add 方法。

要初始化插件，你需要定义一个特殊的匹配模式 init: <plugin-name>，对于每一个插件，将按顺序调用此操作模式，init 函数必须调用其 callback 函数，并且不能有错误发生，如果插件初始化失败，则 Seneca 会立即退出 Node 进程。所以的插件初始化工作都必须在任何操作执行之前完成。

为了演示初始化，让我们向 math 插件添加简单的自定义日志记录，当插件启动时，它打开一个日志文件，并将所有操作的日志写入文件，文件需要成功打开并且可写，如果这失败，微服务启动就应该失败。

```JavaScript
const fs = require('fs')

function math(options) {

  // 日志记录函数，通过 init 函数创建
  var log

  // 将所有模式放在一起会上我们查找更方便
  this.add('role:math,cmd:sum',     sum)
  this.add('role:math,cmd:product', product)

  // 这就是那个特殊的初始化操作
  this.add('init:math', init)

  function init(msg, respond) {
    // 将日志记录至一个特写的文件中
    fs.open(options.logfile, 'a', function (err, fd) {

      // 如果不能读取或者写入该文件，则返回错误，这会导致 Seneca 启动失败
      if (err) return respond(err)

      log = makeLog(fd)
      respond()
    })
  }

  function sum(msg, respond) {
    var out = { answer: msg.left + msg.right }
    log('sum '+msg.left+'+'+msg.right+'='+out.answer+'\n')
    respond(null, out)
  }

  function product(msg, respond) {
    var out = { answer: msg.left * msg.right }
    log('product '+msg.left+'*'+msg.right+'='+out.answer+'\n')
    respond(null, out)
  }

  function makeLog(fd) {
    return function (entry) {
      fs.write(fd, new Date().toISOString()+' '+entry, null, 'utf8', function (err) {
        if (err) return console.log(err)

        // 确保日志条目已刷新
        fs.fsync(fd, function (err) {
          if (err) return console.log(err)
        })
      })
    }
  }
}

require('seneca')()
  .use(math, {logfile:'./math.log'})
  .act('role:math,cmd:sum,left:1,right:2', console.log)
```

在上面这个插件的代码中，匹配模式被组织在插件的顶部，以便它们更容易被看到，函数在这些模式下面一点被定义，您还可以看到如何使用选项提供自定义日志文件的位置（不言而喻，这不是生产日志！）。

初始化函数 init 执行一些异步文件系统工作，因此必须在执行任何操作之前完成。 如果失败，整个服务将无法初始化。要查看失败时的操作，可以尝试将日志文件位置更改为无效的，例如 /math.log。

以上代码可以在 [math-plugin-init.js](https://github.com/pantao/getting-started-seneca/blob/master/math-plugin-init.js) 文件中找到。

#### 创建微服务

现在让我们把 math 插件变成一个真正的微服务。首先，你需要组织你的插件。 math 插件的业务逻辑 ---- 即它提供的功能，与它以何种方式与外部世界通信是分开的，你可能会暴露一个Web服务，也有可能在消息总线上监听。

将业务逻辑（即插件定义）放在其自己的文件中是有意义的。 Node.js 模块即可完美的实现，创建一个名为 math.js 的文件，内容如下：

```JavaScript
module.exports = function math(options) {

  this.add('role:math,cmd:sum', function sum(msg, respond) {
    respond(null, { answer: msg.left + msg.right })
  })

  this.add('role:math,cmd:product', function product(msg, respond) {
    respond(null, { answer: msg.left * msg.right })
  })

  this.wrap('role:math', function (msg, respond) {
    msg.left  = Number(msg.left).valueOf()
    msg.right = Number(msg.right).valueOf()
    this.prior(msg, respond)
  })
}
```
然后，我们可以在需要引用它的文件中像下面这样添加到我们的微服务系统中：

```JavaScript
// 下面这两种方式都是等价的（还记得我们前面讲过的 `seneca.use` 方法的两个参数吗？）
require('seneca')()
  .use(require('./math.js'))
  .act('role:math,cmd:sum,left:1,right:2', console.log)

require('seneca')()
  .use('math') // 在当前目录下找到 `./math.js`
  .act('role:math,cmd:sum,left:1,right:2', console.log)
```
seneca.wrap 方法可以匹配一组模式，同使用相同的动作扩展函数覆盖至所有被匹配的模式，这与为每一个组模式手动调用 seneca.add 去扩展可以得到一样的效果，它需要两个参数：

- pin ：模式匹配模式
- action ：扩展的 action 函数

pin 是一个可以匹配到多个模式的模式，它可以匹配到多个模式，比如 role:math 这个 pin 可以匹配到 role:math, cmd:sum 与 role:math, cmd:product。

在上面的示例中，我们在最后面的 wrap 函数中，确保了，任何传递给 role:math 的消息体中 left 与 right 值都是数字，即使我们传递了字符串，也可以被自动的转换为数字。

有时，查看 Seneca 实例中有哪些操作是被重写了是很有用的，你可以在启动应用时，加上 --seneca.print.tree 参数即可，我们先创建一个 [math-tree.js](https://github.com/pantao/getting-started-seneca/blob/master/math-tree.js) 文件，填入以下内容：

```JavaScript
require('seneca')()
  .use('math')
```

然后再执行它：

```
❯ node math-tree.js --seneca.print.tree
{"kind":"notice","notice":"hello seneca abs0eg4hu04h/1483589278500/65316/3.2.2/-","level":"info","when":1483589278522}
(node:65316) DeprecationWarning: 'root' is deprecated, use 'global'
Seneca action patterns for instance: abs0eg4hu04h/1483589278500/65316/3.2.2/-
├─┬ cmd:sum
│ └─┬ role:math
│   └── # math, (15fqzd54pnsp),
│       # math, (qqrze3ub5vhl), sum
└─┬ cmd:product
  └─┬ role:math
    └── # math, (qnh86mgin4r6),
        # math, (4nrxi5f6sp69), product
```
从上面你可以看到很多的键/值对，并且以树状结构展示了重写，所有的 Action 函数展示的格式都是 #plugin, (action-id), function-name。

但是，到现在为止，所有的操作都还存在于同一个进程中，接下来，让我们先创建一个名为 [math-service.js](https://github.com/pantao/getting-started-seneca/blob/master/math-service.js) 的文件，填入以下内容：

```JavaScript
require('seneca')()
  .use('math')
  .listen()
````
然后启动该脚本，即可启动我们的微服务，它会启动一个进程，并通过 10101 端口监听HTTP请求，它不是一个 Web 服务器，在此时， HTTP 仅仅作为消息的传输机制。

你现在可以访问 http://localhost:10101/act?ro... 即可看到结果，或者使用 curl 命令：
```
curl -d '{"role":"math","cmd":"sum","left":1,"right":2}' http://localhost:10101/act
```
两种方式都可以看到结果：
```
{"answer":3}
```
接下来，你需要一个微服务客户端 math-client.js：
```JavaScript
require('seneca')()
  .client()
  .act('role:math,cmd:sum,left:1,right:2',console.log)
```
打开一个新的终端，执行该脚本：
```
null { answer: 3 } { id: '7uuptvpf8iff/9wfb26kbqx55',
  accept: '043di4pxswq7/1483589685164/65429/3.2.2/-',
  track: undefined,
  time:
   { client_sent: '0',
     listen_recv: '0',
     listen_sent: '0',
     client_recv: 1483589898390 } }
```
在 Seneca 中，我们通过 seneca.listen 方法创建微服务，然后通过 seneca.client 去与微服务进行通信。在上面的示例中，我们使用的都是 Seneca 的默认配置，比如 HTTP 协议监听 10101 端口，但 seneca.listen 与 seneca.client 方法都可以接受下面这些参数，以达到定抽的功能：

- port ：可选的数字，表示端口号；
- host ：可先的字符串，表示主机名或者IP地址；
- spec ：可选的对象，完整的定制对象

注意：在 Windows 系统中，如果未指定 host， 默认会连接 0.0.0.0，这是没有任何用处的，你可以设置 host 为 localhost。

只要 client 与 listen 的端口号与主机一致，它们就可以进行通信：

- seneca.client(8080) → seneca.listen(8080)
- seneca.client(8080, '192.168.0.2') → seneca.listen(8080, '192.168.0.2')
- seneca.client({ port: 8080, host: '192.168.0.2' }) → seneca.listen({ port: 8080, host: '192.168.0.2' })

Seneca 为你提供的 无依赖传输 特性，让你在进行业务逻辑开发时，不需要知道消息如何传输或哪些服务会得到它们，而是在服务设置代码或配置中指定，比如 math.js 插件中的代码永远不需要改变，我们就可以任意的改变传输方式。

虽然 HTTP 协议很方便，但是并不是所有时间都合适，另一个常用的协议是 TCP，我们可以很容易的使用 TCP 协议来进行数据的传输，尝试下面这两个文件：

[math-service-tcp.js](https://github.com/pantao/getting-started-seneca/blob/master/math-service-tcp.js) :
```JavaScript
require('seneca')()
  .use('math')
  .listen({type: 'tcp'})
```

[math-client-tcp.js](https://github.com/pantao/getting-started-seneca/blob/master/math-service-tcp.js)

```JavaScript
require('seneca')()
  .client({type: 'tcp'})
  .act('role:math,cmd:sum,left:1,right:2',console.log)
```

默认情况下， client/listen 并未指定哪些消息将发送至哪里，只是本地定义了模式的话，会发送至本地的模式中，否则会全部发送至服务器中，我们可以通过一些配置来定义哪些消息将发送到哪些服务中，你可以使用一个 pin 参数来做这件事情。

让我们来创建一个应用，它将通过 TCP 发送所有 role:math 消息至服务，而把其它的所有消息都在发送至本地：

[math-pin-service.js](https://github.com/pantao/getting-started-seneca/blob/master/math-pin-service.js)：
```JavaScript
require('seneca')()

  .use('math')

  // 监听 role:math 消息
  // 重要：必须匹配客户端
  .listen({ type: 'tcp', pin: 'role:math' })
```

[math-pin-client.js](https://github.com/pantao/getting-started-seneca/blob/master/math-pin-client.js)：

```JavaScript
require('seneca')()

  // 本地模式
  .add('say:hello', function (msg, respond){ respond(null, {text: "Hi!"}) })

  // 发送 role:math 模式至服务
  // 注意：必须匹配服务端
  .client({ type: 'tcp', pin: 'role:math' })

  // 远程操作
  .act('role:math,cmd:sum,left:1,right:2',console.log)

  // 本地操作
  .act('say:hello',console.log)
```
你可以通过各种过滤器来自定义日志的打印，以跟踪消息的流动，使用 --seneca... 参数，支持以下配置：

- date-time： log 条目何时被创建；
- seneca-id： Seneca process ID；
- level：DEBUG、INFO、WARN、ERROR 以及 FATAL 中任何一个；
- type：条目编码，比如 act、plugin 等；
- plugin：插件名称，不是插件内的操作将表示为 root$；
- case： 条目的事件：IN、ADD、OUT 等
- action-id/transaction-id：跟踪标识符，_在网络中永远保持一致_；
- pin：action 匹配模式；
- message：入/出参消息体

如果你运行上面的进程，使用了 --seneca.log.all，则会打印出所有日志，如果你只想看 math 插件打印的日志，可以像下面这样启动服务：

```
node math-pin-service.js --seneca.log=plugin:math
```

#### Web 服务集成

Seneca不是一个Web框架。 但是，您仍然需要将其连接到您的Web服务API，你永远要记住的是，不要将你的内部行为模式暴露在外面，这不是一个好的安全的实践，相反的，你应该定义一组API模式，比如用属性 role：api，然后你可以将它们连接到你的内部微服务。

下面是我们定义 [api.js](https://github.com/pantao/getting-started-seneca/blob/master/api.js) 插件。

```JavaScript
module.exports = function api(options) {

  var validOps = { sum:'sum', product:'product' }

  this.add('role:api,path:calculate', function (msg, respond) {
    var operation = msg.args.params.operation
    var left = msg.args.query.left
    var right = msg.args.query.right
    this.act('role:math', {
      cmd:   validOps[operation],
      left:  left,
      right: right,
    }, respond)
  })

  this.add('init:api', function (msg, respond) {
    this.act('role:web',{routes:{
      prefix: '/api',
      pin: 'role:api,path:*',
      map: {
        calculate: { GET:true, suffix:'/{operation}' }
      }
    }}, respond)
  })

}
```
然后，我们使用 hapi 作为Web框架，建了 [hapi-app.js](https://github.com/pantao/getting-started-seneca/blob/master/hapi-app.js) 应用：

```JavaScript
const Hapi = require('hapi');
const Seneca = require('seneca');
const SenecaWeb = require('seneca-web');

const config = {
  adapter: require('seneca-web-adapter-hapi'),
  context: (() => {
    const server = new Hapi.Server();
    server.connection({
      port: 3000
    });

    server.route({
      path: '/routes',
      method: 'get',
      handler: (request, reply) => {
        const routes = server.table()[0].table.map(route => {
          return {
            path: route.path,
            method: route.method.toUpperCase(),
            description: route.settings.description,
            tags: route.settings.tags,
            vhost: route.settings.vhost,
            cors: route.settings.cors,
            jsonp: route.settings.jsonp,
          }
        })
        reply(routes)
      }
    });

    return server;
  })()
};

const seneca = Seneca()
  .use(SenecaWeb, config)
  .use('math')
  .use('api')
  .ready(() => {
    const server = seneca.export('web/context')();
    server.start(() => {
      server.log('server started on: ' + server.info.uri);
    });
  });
```

启动 hapi-app.js 之后，访问 http://localhost:3000/routes ，你便可以看到下面这样的信息：

```
[
  {
    "path": "/routes",
    "method": "GET",
    "cors": false
  },
  {
    "path": "/api/calculate/{operation}",
    "method": "GET",
    "cors": false
  }
]
```
这表示，我们已经成功的将模式匹配更新至 hapi 应用的路由中。访问 http://localhost:3000/api/cal... ，将得到结果：
```
{"answer":3}
```
在上面的示例中，我们直接将 math 插件也加载到了 seneca 实例中，其实我们可以更加合理的进行这种操作，如 [hapi-app-client.js](https://github.com/pantao/getting-started-seneca/blob/master/hapi-app-client.js) 文件所示：

```JavaScript
...
const seneca = Seneca()
  .use(SenecaWeb, config)
  .use('api')
  .client({type: 'tcp', pin: 'role:math'})
  .ready(() => {
    const server = seneca.export('web/context')();
    server.start(() => {
      server.log('server started on: ' + server.info.uri);
    });
  });
```

我们不注册 math 插件，而是使用 client 方法，将 role:math 发送给 math-pin-service.js 的服务，并且使用的是 tcp 连接，没错，你的微服务就是这样成型了。

**注意：永远不要使用外部输入创建操作的消息体，永远显示地在内部创建，这可以有效避免注入攻击。**

在上面的的初始化函数中，调用了一个 role:web 的模式操作，并且定义了一个 routes 属性，这将定义一个URL地址与操作模式的匹配规则，它有下面这些参数：

- prefix：URL 前缀
- pin： 需要映射的模式集
- map：要用作 URL Endpoint 的 pin 通配符属性列表

你的URL地址将开始于 /api/。

`rol:api, path:* `这个 pin 表示，映射任何有 role="api" 键值对，同时 path 属性被定义了的模式，在本例中，只有 `role:api,path:calculate` 符合该模式。

map 属性是一个对象，它有一个 calculate 属性，对应的URL地址开始于：/api/calculate。

按着， calculate 的值是一个对象，它表示了 HTTP 的 GET 方法是被允许的，并且URL应该有参数化的后缀（后缀就类于 hapi 的 route 规则中一样）。

所以，你的完整地址是 `/api/calculate/{operation}`。

然后，其它的消息属性都将从 URL query 对象或者 JSON body 中获得，在本示例中，因为使用的是 GET 方法，所以没有 body。

SenecaWeb 将会通过 msg.args 来描述一次请求，它包括：

- body：HTTP 请求的 payload 部分；
- query：请求的 querystring；
- params：请求的路径参数。

现在，启动前面我们创建的微服务：

`node math-pin-service.js --seneca.log=plugin:math`
然后再启动我们的应用：

`node hapi-app.js --seneca.log=plugin:web,plugin:api`
访问下面的地址：

http://localhost:3000/api/cal... 得到 {"answer":6}

http://localhost:3000/api/cal... 得到 {"answer":5}

### PM2：node服务部署（服务集群）、管理与监控

启动
```
pm2 start app.js
```
 
- -w --watch：监听目录变化，如变化则自动重启应用
- --ignore-file：监听目录变化时忽略的文件。如pm2 start rpc_server.js --watch --ignore-watch="rpc_client.js"
- -n --name：设置应用名字，可用于区分应用
- -i --instances：设置应用实例个数，0与max相同
- -f --force： 强制启动某应用，常常用于有相同应用在运行的情况
- -o --output <path>：标准输出日志文件的路径
- -e --error <path>：错误输出日志文件的路径
- --env <path>：配置环境变量


如`pm2 start rpc_server.js -w -i max -n s1 --ignore-watch="rpc_client.js" -e ./server_error.log -o ./server_info.log`

>在cluster-mode，也就是-i max下，日志文件会自动在后面追加-${index}保证不重复

#### 其他简单且常用命令

- pm2 stop app_name|app_id
- pm2 restart app_name|app_id
- pm2 delete app_name|app_id
- pm2 show app_name|app_id OR pm2 describe app_name|app_id
- pm2 list
- pm2 monit
- pm2 logs app_name|app_id --lines <n> --err

#### Graceful Stop
```
pm2 stop app_name|app_id
```

```JavaScript
process.on('SIGINT', () => {
  logger.warn('SIGINT')
  connection && connection.close()
  process.exit(0)
})
```

当进程结束前，程序会拦截SIGINT信号从而在进程即将被杀掉前去断开数据库连接等等占用内存的操作后再执行process.exit()从而优雅的退出进程。（如在1.6s后进程还未结束则继续发送SIGKILL信号强制进程结束）

#### Process File
ecosystem.config.js

```JavaScript
const appCfg = {
  args: '',
  max_memory_restart: '150M',
  env: {
    NODE_ENV: 'development'
  },
  env_production: {
    NODE_ENV: 'production'
  },
  // source map
  source_map_support: true,
  // 不合并日志输出，用于集群服务
  merge_logs: false,
  // 常用于启动应用时异常，超时时间限制
  listen_timeout: 5000,
  // 进程SIGINT命令时间限制，即进程必须在监听到SIGINT信号后必须在以下设置时间结束进程
  kill_timeout: 2000,
  // 当启动异常后不尝试重启，运维人员尝试找原因后重试
  autorestart: false,
  // 不允许以相同脚本启动进程
  force: false,
  // 在Keymetrics dashboard中执行pull/upgrade操作后执行的命令队列
  post_update: ['npm install'],
  // 监听文件变化
  watch: false,
  // 忽略监听文件变化
  ignore_watch: ['node_modules']
}

function GeneratePM2AppConfig({ name = '', script = '', error_file = '', out_file = '', exec_mode = 'fork', instances = 1, args = "" }) {
  if (name) {
    return Object.assign({
      name,
      script: script || `${name}.js`,
      error_file: error_file || `${name}-err.log`,
      out_file: out_file|| `${name}-out.log`,
      instances,
      exec_mode: instances > 1 ? 'cluster' : 'fork',
      args
    }, appCfg)
  } else {
    return null
  }
}

module.exports = {
  apps: [
    GeneratePM2AppConfig({
      name: 'client',
      script: './rpc_client.js'
    }),

    GeneratePM2AppConfig({
      name: 'server',
      script: './rpc_server.js',
      instances: 1
    })
  ]
}
```
```
pm2 start ecosystem.config.js
```

>避坑指南：processFile文件命名建议为*.config.js格式。否则后果自负。

### 小结
在本章中，你掌握了Seneca 和 PM2 的基础知识，你可以搭建一个面向微服务的系统。

### 参考

- senecajs：http://senecajs.org
- 《Node.js微服务》(美)David Gonzalez(大卫 冈萨雷斯) 著
- senecajs 快速开始文档：http://senecajs.org/getting-started/
- Seneca ：NodeJS 微服务框架入门指南： https://segmentfault.com/a/1190000008501410#articleHeader7

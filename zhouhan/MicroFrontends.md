# **微前端 - 将微服务理念延伸到前端开发中**

> 翻译自 [https://micro-frontends.org/][1]

本文描述了采用不同 JavaScript 技术框架的多个团队中协同构建一个现代化前端 Web 应用所需要的技术、策略和方法。

## **什么是微前端？**

**微前端**这个术语最初来自 2016 年的 [ThoughtWorks 技术雷达][2]，它将微服务的概念扩展到了前端领域。目前的趋势是构建一个功能丰富且强大的前端应用，即单页面应用(SPA)，其本身一般都是建立在一个微服务架构之上。前端层通常由一个单独的团队开发，随着时间的推移，会变得越来越庞大而难以维护。这就是传说中的[前端巨无霸][3](Frontend Monolith)。

微前端背后的理念是将一个网站或者 Web App 当成**特性的组合体**，每个特性都由一个**独立的团队**负责。每个团队都有擅长的**特定业务领域**或是它关心的**任务**。这里，一个团队是**跨职能的**，它可以端到端，从数据库到用户界面完整的开发它所负责的功能。

然而，这个概念并不新鲜，过去它叫[**针对垂直系统的前端一体化**][4]或[**独立系统**][5]。不过微前端显然是一个更加友好并且不那么笨重的术语。

**一体化的前端**

![Monolithic Frontends](./images/monolith-frontback-microservices.png)

**垂直化组织方式**

![Organisation in Verticals](./images/verticals-headline.png)

## **什么是现代化前端应用**

在介绍中我使用了措辞“构建一个现代化前端应用”，让我们先给出一些这个术语有关的设定。

从一个更广泛的角度来看，Aral Balkan 曾写过一个相关的博客，他把这个概念叫做[文档-应用连续统一体][6]。他提出了一个滑动比例尺的概念，在比例尺的最左边是一个网站，由静态文档构成，通过链接相互连接；最右边是一个纯行为驱动的，几乎没内容的应用程序，比如在线图片编辑器。

如果你把你的项目定位在这个范围的左侧，那在 Web 服务器级别的集成会比较合适。在这个模型中，服务器会收集页面中各个组件的内容并将其 HTML 字符串连接起来返回给用户。内容更新则采用从服务端重新加载的方式或者通过 ajax 进行部分替换。Gustaf Nilsson Kotte 针对这个主题写过一篇[综合性的文章][7]。

当用户界面需要提供及时反馈时，即使采用不可靠连接，一个纯粹的服务端渲染网站也不够用。为了实现 [**Optimistic UI**][8] 或 [**Skeleton Screens**][9] 这样的技术你需要在设备本身对 UI 进行更新。Google 提出的 PWA 巧妙的描述了这种兼顾各方的做法（渐进增强），同时提供 App 一样的性能体验。这种类型的应用在上面的比例尺中位于文档-应用连续统一体中间的某个地方。在这里纯粹的服务端方案已经不再够用，我们必须将主要逻辑放到浏览器中，这正是本文会重点描述的。

## **微前端背后的核心理念**

* **技术无关**

    每一个团队在选择和升级他们的技术栈时应该能够做到不需要和其他团队进行对接。**Custom Elements** 是一个隐藏实现细节的非常好的方法，同时能够对外提供一个统一接口。

* **隔离团队代码**

    即使所有的团队都使用同样的框架，也不要共享一个运行时。构建独立的应用，不要依赖于共享状态或全局变量。

* **建立各团队的前缀**

    当隔离已经不可能时要商定一个命名规范。对 CSS、Events、Local Storage 和 Cookie 建立命名空间来避免碰撞并声明所有权。

* **本地浏览器特性优先于自定义 API**

    采用**浏览器事件进行数据沟通**而不是构建一个全局的发布者-订阅者系统。如果你确实需要构建一个跨团队的 API，那就确保它越简单越好。

* **构建自适应网站**

    即使 JavaScript 执行失败或是根本没有执行，你的特性也应该是能够使用的。采用通用渲染或渐进式增强来提高可感知的性能。

<hr>

## **DOM 就是 API**

[**自定义元素 Custom Elements**][10] 面向 Web 组件规范中互操作方面，在浏览器中是一个适用于功能集成的基本元素。每个团队采用自己选择的 Web 技术构建他们的组件，并将它们封装到一个 **自定义元素** 中(比如 \<order-minicart\>\</order-minicart\>)。这个特定元素的 DOM 声明(标签名、属性和事件)对于其他团队来说体现为一个协定或者叫公共 API。这样做的好处是其他人可以使用这个组件及其功能而不需要知道实现细节，他们只需要能够和 DOM 交互即可。

但仅仅**自定义元素**是不能满足解决方案的所有需求的。为了处理渐进增强、通用渲染或路由我们还需要软件的其他部分。

本文分为两部分。首先我们会介绍页面组合(**Page Composition**) —— 如何使用不同团队提供的组件组合成一个页面。然后我们会给出一些示例展示客户端页面转化(**Page Transition**)的实现。

## **页面组合**

除了采用**不同框架**编写的客户端或服务端代码集成，还有很多副主题需要讨论：**隔离 js**的机制、**规避 CSS 冲突**、按需**加载资源**、不同团队**共享公共资源**、处理**数据获取**和思考提供给用户的**加载状态**。我们将会依次讨论这些主题。

### **基本原型**

如下的拖拉机模型商店的产品页面将会作为后续示例的基础。

这个页面主要功能是通过一个变量选择器在三个不同拖拉机模型之间进行选择转换，变量改版时产品图片、名称、价格和推荐都会更新。还有一个**购买按钮**，点击后会将选中的模型添加到购物车中，同时顶部的迷你购物车也会相应更新。

![The Model Store](./images/model-store-0.gif)

所有的 HTML 页面都通过**纯 JavaScript**和 ES6 模板字符串在客户端生成，**没有任何依赖**。代码使用一个简单的状态/标记分离方式，一旦有变化整个 HTML 页面都会重新渲染 —— 没有炫酷的 DOM 对比功能，也暂时没有**通用渲染**。当然也没有**团队分离** —— 所有代码都在一个 js/css 文件中。

### **客户端集成**

在如下示例中，这个页面被分隔成不同的组件和片段，分别被三个不同的团队负责。**交易组**(蓝色)负责所有跟付账流程有关的事情 —— 也就是**购买按钮**和**迷你购物车**。**推荐组**(绿色)负责页面中的产品推荐部分。页面本身则由**产品组**(红色)负责。

![three-teams](./images/three-teams.png)

**产品组**决定哪个功能点被采用以及该功能在页面布局的位置。页面包含的信息可以由产品组自身提供，比如产品名称、图片和可采用的参数，但还可以包括其他团队提供的片段(自定义元素)。

### **如何创建一个自定义元素**

让我们把**购买按钮**作为一个示例。产品组简单的将 `<blue-buy sku="t_porsche"></blue-buy>` 加入到页面中期望的位置就可以使用这个按钮了。要让这个按钮起作用，交易组还需要在页面中注册元素 `blue-buy`。

```JavaScript
class BlueBuy extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<button type="button">buy for 66,00 €</button>`;
    }
    disconnectedCallback() { ... }
}
window.customElements.define('blue-buy', BlueBuy);
```

现在每当浏览器遇到一个新的 `blue-buy` 标签时，都会调用这个构造器。其中，`this` 是这个自定义元素 DOM 根节点的引用。所有标准 DOM 元素的属性和方法都可以使用，比如 `innerHTML` 或 `getAttribute()`。

![custom-element](./images/custom-element.gif)

根据标准文档的定义，当命名自定义元素时唯一的需求是名称中必须**包含一个破折号 -** 以确保和未来新的 HTML 标签进行兼容。在后面的示例中则使用了 `[team_color]-[feature]` 命名规范。团队命名空间预防了碰撞，这种方法让一个功能点的权责变得更分明：只要看看 DOM 就知道了。

### **父子元素通信 / DOM 修改**

当用户在变量选择器中选择了另外一个拖拉机时，**购买按钮**必须相应的进行**更新**。要达到这种效果，产品组只需要从 DOM 中**移除**相应元素，并**插入**一个新的。

```JavaScript
container.innerHTML;
// => <blue-buy sku="t_porsche">...</blue-buy>
container.innerHTML = '<blue-buy sku="t_fendt"></blue-buy>';
```

老元素的 `disconnectedCallback` 方法会被同步调用进行一些清理资源的操作比如移除事件监听器。然后新创建的 `t_fendt` 元素的 `constructor` 会被调用。

另外一个性能更好的选择是仅仅更新现有元素的 `sku` 属性。

```JavaScript
document.querySelector('blue-buy').setAttribute('sku', 't_fendt');
```

如果产品组使用了以 DOM 对比为特色的模板引擎，比如 React，那它的算法就会自动完成上述功能。

![custom-element-attribute](./images/custom-element-attribute.gif)

要支持这种效果，自定义元素可以实现 `attributeChangedCallback` 并指定一个 `observedAttributes` 列表来触发这个回调。

```JavaScript
const prices = {
    t_porsche: '66,00 €',
    t_fendt: '54,00 €',
    t_eicher: '58,00 €',
};

class BlueBuy extends HTMLElement {
    static get observedAttributes() {
        return ['sku'];
    }
    constructor() {
        super();
        this.render();
    }
    render() {
        const sku = this.getAttribute('sku');
        const price = prices[sku];
        this.innerHTML = `<button type="button">buy for ${price}</button>`;
        }
    attributeChangedCallback(attr, oldValue, newValue) {
        this.render();
    }
    disconnectedCallback() {...}
}
window.customElements.define('blue-buy', BlueBuy);
```

为避免重复，引入一个 `render()` 方法并在 `constructor` 和 `attributeChangedCallback` 中调用。这个方法收集需要的数据，并填充新标签的 `innerHTML` 属性。当决定在自定义元素中采用一个更加成熟的模板引擎或框架时，这里便是初始化代码所呆的地方。

### **浏览器支持**

上例采用了 Custom Element 规范 V1 版，目前已经在 [Chrome, Safari 和 Opera][11] 中得到支持。但是通过 [document-register-element][12] 这个轻量级且经过大量测试的 polyfill 可以让该特性在所有浏览器中运行。在底层，它使用了[广泛支持][13]的 Mutation Observer API，所以并没有在背后使用 DOM 树监听这种侵入式的 hack 方法。

### **框架兼容性**

因为自定义元素 Custom Element 是一个 Web 标准，所有的主流 JavaScript 框架都支持，比如 Angular、React、Preact、Vue 或 Hyperapp。但深入到细节时，就会发现有些框架依然存在实现上的问题。可以访问 [Custom Elements Everywhere][14] 这个兼容性测试套件，Rob Dodson 把没有解决的问题都高亮显示了。

### **子父元素或兄弟元素通信 / DOM 事件**

然而，对于所有的交互来说从上至下传递属性是不够的。在我们的示例中，当用户对购买按钮执行一次点击事件时，迷你购物车应该刷新。

上面这两个片段都由交易组(蓝色)维护的，所以为了达到迷你购物车和按钮通信的效果他们可以构建一种内建的 JavaScript API 进行通信。但这样就需要组件实例之间相互了解，同时也违背了隔离的原则。

一种更加干净的方法是采用发布者订阅者机制：一个组件可以发布信息，其他组件则订阅指定的主题(topic)。幸运的是浏览器内建了这个特性，这也正是 `click`、`select`、`mouseover` 等浏览器事件的工作机制。除了这些本地事件，还有一种可能性是通过 `new  CustomEvent(...)` 来创建更加高级别的事件。事件总是绑定到它们创建或者分配的 DOM 节点上，大部分本地事件也支持冒泡的特性，这让监听 DOM 中特定子树节点的所有事件成为可能。如果你想要监听页面上的所有事件，将事件监听器附加到 window 元素上就 OK 了。如下是本示例中 `blue:basket:changed` 事件创建的大概样子：

```JavaScript
class BlueBuy extends HTMLElement {
  [...]
  connectedCallback() {
    [...]
    this.render();
    this.firstChild.addEventListener('click', this.addToCart);
  }
  addToCart() {
    // maybe talk to an api
    this.dispatchEvent(new CustomEvent('blue:basket:changed', {
      bubbles: true,
    }));
  }
  render() {
    this.innerHTML = `<button type="button">buy</button>`;
  }
  disconnectedCallback() {
    this.firstChild.removeEventListener('click', this.addToCart);
  }
}
```

现在迷你购物车可以在 `window` 对象上订阅这个事件了，在需要刷新数据时它就会得到通知。

```JavaScript
class BlueBasket extends HTMLElement {
  connectedCallback() {
    [...]
    window.addEventListener('blue:basket:changed', this.refresh);
  }
  refresh() {
    // fetch new data and render it
  }
  disconnectedCallback() {
    window.removeEventListener('blue:basket:changed', this.refresh);
  }
}
```

采用这种方法实现时，迷你购物车片段增加了一个不在它范围之内(window)的 DOM 元素监听器。对于大部分应用来说，这个做法没有什么问题，但是如果你不太满意这种做法，还可以让页面自身(产品组)去监听这个事件，并通过调用 DOM 元素的 `refresh()` 方法来通知迷你购物车。

```JavaScript
// page.js
const $ = document.getElementsByTagName;

$('blue-buy')[0].addEventListener('blue:basket:changed', function() {
  $('blue-basket')[0].refresh();
});
```

命令式调用 DOM 方法其实相当罕见，但比如在 [video 元素 API][15] 中就有这种做法。如果可能的话，还是应该推荐这种命令式的方法(属性更改)。

## **服务端渲染 / 通用渲染**

在浏览器中采用自定义元素 Custom Elements 来集成组件是个绝好的做法。但实际在构建一个 Web 中可访问的站点时，很可能是初次加载性能才是关键点，在所有的 JS 框架全部加载并执行之前用户只会看到白屏。另外，还有一个值得思考的是如果 JavaScript 执行失败或者被阻塞时网站会发生什么。[Jeremy Keith][16] 在他的 ebook/播客 [Resilient Web Design][17] 中解释了这个问题的重要性。所以能够在服务端渲染核心内容才是关键。不幸的是 Web 组件规范根本没有讨论服务端渲染。JavaScript 没有，Custom Elements 也没有:(

### **自定义元素 + 服务端包含(Includes) = ❤️**

为了引入服务端渲染，前面的示例进行了重构。每个团队都有他们自己的 express 服务器，自定义元素的 `render()` 方法也都通过 url 来进行访问。

```bash
$ curl http://127.0.0.1:3000/blue-buy?sku=t_porsche
<button type="button">buy for 66,00 €</button>
```

自定义元素的标签名被用作路径名，属性名成为了查询参数。这样为每个组件用服务端渲染内容的方法就有了。再配合上 `<blue-buy>` 自定义元素，一种非常接近于**通用 Web 组件**的东西就出来了：

```html
<blue-buy sku="t_porsche">
    <!--#include virtual="/blue-buy?sku=t_porsche" -->
</blue-buy>
```

`#include` 注释是服务端包含 [Server Side Includes][18] 的一部分，这个功能在大部分 Web 服务器中都支持。没错，这个就是很早以前我们在网站中嵌入当前日期所采用的同样技术。也有几个其他可选技术比如 [ESI][19]、[nodesi][20]、[compoxure][21] 和 [tailor][22]，但是对于我们的项目 SSI 已经被证明是一个简单同时也相当稳定的解决方案。

在 Web 服务器将完整的页面发送到浏览器之前 `#include` 注释被替换为 `/blue-buy?sku=t_porsche` 的返回值。在 Nginx 中配置如下：

```conf
upstream team_blue {
  server team_blue:3001;
}
upstream team_green {
  server team_green:3002;
}
upstream team_red {
  server team_red:3003;
}

server {
  listen 3000;
  ssi on;

  location /blue {
    proxy_pass  http://team_blue;
  }
  location /green {
    proxy_pass  http://team_green;
  }
  location /red {
    proxy_pass  http://team_red;
  }
  location / {
    proxy_pass  http://team_red;
  }
}
```

指令 `ssi: on;` 用来开启 SSI 功能，`upstream` 和 `location` 块用来确保每个团队的 url 都会被正确分配到对应的服务，比如以 `/blue` 开头的 url 会被路由到相应的应用服务(`team_blue:3001`)。另外，`/` 路由被映射到负责首页和产品页的产品组(红色)。

下面的动画演示了在一个 **JavaScript 被禁用**的浏览器中拖拉机商店使用情况。

![server-render](./images/server-render.gif)

变量选择按钮现在是一个真实的链接了，每一次点击都会让整个页面重新加载。右边的终端展示了一个请求如何被路由到产品组的流程，产品组则控制整个产品页，里面的标记则由推荐组和交易组的内容片段来提供。

当打开启用 JavaScript 的开关后，在服务端日志消息中只有第一条请求才会显示。所有后续的拖拉机变化逻辑都在客户端处理了，就和前面第一个示例一样。在后面的示例中，产品数据将会从 JavaScript 代码中被抽离出来，并在需要的时候通过一个 REST API 进行加载。

你可以在本机运行这个代码。只需要安装 [Docker Compose][23]。

```bash
git clone https://github.com/neuland/micro-frontends.git
cd micro-frontends/2-composition-universal
docker-compose up --build
```

Docker 会在 3000 端口启动 Nginx，并为每个团队构建 node.js 镜像。当你在浏览器中打开 ` http://127.0.0.1:3000/` 时应该会看到一个红色的拖拉机。通过 `docker-compose` 给出的组合日志可以很轻松的看到网络中发生了什么。不好的是目前还不能控制输出信息的颜色，所以你不得不接受一个事实，那就是蓝色的交易组可能被高亮成绿色 :)

`src` 中的文件会被映射到独立的容器中，当你进行代码更改后 node 应用会重启。修改 `nginx.conf` 需要重启 `docker-compose` 才能生效。然后你就尽情瞎搞并提供反馈吧。

### **数据获取 & 加载状态**

待续...

关注 [Github Repo][24] 来获取通知

## **其他资源**

* [Slides: Micro Frontends by Michael Geers - JSUnconf.eu 2017][25]
* [Post: Micro frontends—a microservice approach to front-end web development][26] Tom Söderlund 对这个主题进行了核心概念的讲解并提供了链接
* [Custom Elements Everywhere][27] 确保框架和自定义元素是 BFFs(Backup For Frontend) 的
* 拖拉机可以在这里买哦 [manufactum.com][28] :)


[1]: https://micro-frontends.org/
[2]: https://www.thoughtworks.com/radar/techniques/micro-frontends
[3]: https://www.youtube.com/watch?v=pU1gXA0rfwc
[4]: https://dev.otto.de/2014/07/29/scaling-with-microservices-and-vertical-decomposition/
[5]: http://scs-architecture.org/index.html
[6]: https://ar.al/notes/the-documents-to-applications-continuum/
[7]: https://gustafnk.github.io/microservice-websites/
[8]: https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces/
[9]: http://www.lukew.com/ff/entry.asp?1797
[10]: https://developers.google.com/web/fundamentals/getting-started/primers/customelements
[11]: http://caniuse.com/#feat=custom-elementsv1
[12]: https://github.com/WebReflection/document-register-element
[13]: http://caniuse.com/#feat=mutationobserver
[14]: https://custom-elements-everywhere.com/
[15]: https://developer.mozilla.org/de/docs/Web/HTML/Using_HTML5_audio_and_video#Controlling_media_playback
[16]: https://adactio.com/
[17]: https://resilientwebdesign.com/
[18]: https://de.wikipedia.org/wiki/Server_Side_Includes
[19]: https://de.wikipedia.org/wiki/Edge_Side_Includes
[20]: https://github.com/Schibsted-Tech-Polska/nodesi
[21]: https://github.com/tes/compoxure
[22]: https://github.com/zalando/tailor
[23]: https://docs.docker.com/compose/install/
[24]: https://github.com/neuland/micro-frontends
[25]: https://speakerdeck.com/naltatis/micro-frontends-building-a-modern-webapp-with-multiple-teams
[26]: https://medium.com/@tomsoderlund/micro-frontends-a-microservice-approach-to-front-end-web-development-f325ebdadc16
[27]: https://custom-elements-everywhere.com/
[28]: https://www.manufactum.com/
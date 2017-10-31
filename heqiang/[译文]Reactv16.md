## [译文]React v16（新特性）

[查看原文内容](https://deploy-preview-10824--reactjs.netlify.com/blog/2017/09/26/react-v16.0.html)

----------

 我们很高兴的宣布React v16.0发布了! 这个版本有很多长期被使用者期待的功能，包括：

   * fragments (返回片段类型)
   * error boundaries（处理错误）
   * portals (挂载方式)
   * custom DOM attributes （支持自定义DOM属性）
   * improved server-side rendering (提升服务端渲染性能)
   * reduced file size (减少文件大小)


（下面逐一说明）

##### render函数可返回新的类型：数组和字符串

新的版本支持组件的render方法返回包含元素的数组类型，代码如下：

```
	render() {
     //不需要再把所有的元素绑定到一个单独的元素中了
	  return [
	    // 别忘记加上key值
	    <li key="A"/>First item</li>,
	    <li key="B"/>Second item</li>,
	    <li key="C"/>Third item</li>,
	  ];
	}
```
新的版本也支持render方法返回的类型为strings。

关于render()方法的详细说明，请查看[API文档](https://deploy-preview-10824--reactjs.netlify.com/docs/react-component.html#render)。


##### 更好的处理错误

  之前的React,渲染过程中如果遇到运行时的错误，可能会导致整个React组件的崩溃，并产生一些隐藏的错误信息，需要重新刷新才能恢复。为了解决这个问题，React16 使用了一个更有弹性的错误处理策略。默认情况下，如果一个错误是在组件的渲染或者生命周期方法中被抛出，整个组件结构就会从根节点中卸载。这种方式阻碍了被坏数据的展示，然而，却不是很好的用户体验。

  新的策略，对于这种一出现错误就卸载整个组件app的方式进行了改善，你可以使用error boundaries（错误边缘）来进行处理，它是专门用来抓取其下子组件错误并向视图展示错误信息的组件。将error boundaries（错误边缘）想象成try{}catch(){}语句，只是它是React专用而已。

  想要查看更多关于这个特性的说明，请查看[这篇文章](https://deploy-preview-10824--reactjs.netlify.com/blog/2017/07/26/error-handling-in-react-16.html)。


##### 挂载方式

Portals（挂载方式）提供了一个非常好的方式，可以将渲染的children插入到一个DOM节点，而这个节点可以是存在于当前组件dom结构外的其他节点。

```
render() {
	  // 可以不必创建一个新的div标签，divNode是一个存在于dom结构的节点，不需要考虑这个节点的位置
	  return React.createPortal(
	    this.props.children,
	    divNode,
	  );
	}
```
[查看完整的例子](https://deploy-preview-10824--reactjs.netlify.com/docs/portals.html)

##### 更好的服务端渲染

React16更好的支持服务端html的渲染，不再需要服务端进行初始化渲染以匹配结果了，它会尝试重新利用尽可能多的已经存在的DOM节点。

服务端渲染器被完全重写用以支持流。React的核心成员Sasha Aicken，它是这个功能的贡献者，写了一篇非常好的[文章](https://medium.com/@aickin/whats-new-with-server-side-rendering-in-react-16-9b0d78585d67)来描述React16 SSR的提升。“渲染流的方式能够减少获取响应首字节前所花费的毫秒数(TTFB),将页面文档的开头沿着电缆发送到浏览器端时，下一部分的页面文档已经形成了。用这种流的方式，所有的主流浏览器都会更早的开始解析和渲染页面文档”。

##### 支持自定义的DOM属性

取代之前忽略不识别的HTML和SVG属性的方式，新的版本将会把它们传递给DOM元素。这个新特性会让我们摆脱可用的React属性白名单，从而减少文件的大小。

##### 减少文件体积

除了上面提交到的这些特性，React16要比v15.6.1更小！

* react 大小从之前的20.7kb(压缩后6.9kb)降低到现在的5.3kb (压缩后2.2kb)。
* react-dom 从之前的141kb(压缩后42.9kb)降低到现在的103.7kb(压缩后32.6kb)。
* react + react-dom 从之前的161.7kb(压缩后49.8kb)到现在的109kb(压缩后43.8kb)。

文件大小的变化部分归功于打包工具的改变。React现在使用Rollup针对不同的目标格式创建打包，进而使文件大小和运行时性能都表现优秀。

##### 新的核心架构

React16是React第一个建立在一个称为"Fiber"全新架构的版本。你可以通过阅读Facebook的工程博客了解Fiber全部的内容。

这个版本中的大部分功能，比如error boundaries和fragments，这都是通过重写和核心架构来实现这些可能的。而事后的几个版本中，你能够回去更多的新特性，因为我们会开始全力释放React的全部潜能。

也许最让人兴奋的地方是我们正致力于async rendering（异步渲染）的工作 —— 这个策略能通过周期性的向浏览器发布执行任务从而协同调度渲染工作。结果就是使用异步渲染，应用将会更加响应式，因为React避免了主线程的阻塞。

我们认为异步渲染是一个充满意义的功能，它代表了React的未来。为了能够保证现有项目平滑的融合v16.0版本，这个版本我们并没有启动任何异步的特性，但是在接下来的几个月里我们会非常高兴的请它隆重登场。请大家拭目以待！


----------


#### 升级

就长期的升级来说，尽管React16只是包括了一些有意义的内部改变，这个版本和其他主要的React版本仍可平分秋色。在今年早期的时候，新版版已服务于React和Messenger.com，然后我们通过发布一些beta版本和候选版本来解决增加的问题。除少数例外，如果你的项目使用v15.6版本没有任何警示，那么可以升级到v16来服务项目了。

##### 弃用

Hydrating一个服务端渲染的容器现在有了一个明确的API，如果你要进行服务端渲染，请使用ReactDOM.hydrate方法替换ReactDOM.render，客户端的渲染请保持使用ReactDOM.render方法。

##### 突破变化

* React15有局限，使用未被文档化的unstabel_handleError来支持error boundaries。在新版本中，这个方法被命名为了componentDidCatch。你可以使用codemod将项目[自动迁移到新的API上](https://github.com/reactjs/react-codemod#error-boundaries)。
* 如果ReactDOM.render和ReactDOM.unstable_renderIntoContainer在生命周期方法中被调用，则返回null。为了解决这个问题，你可以使用[portals或者refs](https://github.com/facebook/react/issues/10309#issuecomment-318434635)
* setState:
	* setState参数为null的情况下不会再触发更新。这允许你决定一个更新方法如果你想重新渲染。
	* 在render方法中使用setState会触发更新。这在之前是不被允许的，但是现在吗，我们仍然建议不要在render中触发setState。
	* setState函数的回调（第二个参数）会在ComponentDidMount/componentWillUnmount方法会立即被触发，而不是等所有组件重新渲染后再触发。
	* 当使用组件<A/>替代<B/>时，B.componentDidMount现在一定会出现在A.componentDidUnmount之前。而在之前，A.componentDidUnmount只会在某些情况下首先发生。
	* 之前，当改变一个组件的ref时，ref和dom会在组件的render方法被调用之前分离。现在，我们延迟了ref的改变，直到dom元素被改变了，ref才会和dom分离。
	* 对于不使用React而是使用其他方法来重新渲染容器是不安全的。这在以前的版本中也许会生效，但是我们觉得不支持这样做。现在对于这种情况我们会发出一个警告，你需要使用ReactDOM.unmountComponentAtNode来清空你的节点树。[看这个栗子](https://github.com/facebook/react/issues/10294#issuecomment-318820987)
	* componentDidUpdate生命周期不再接受prevContext参数。
	* shallow render不再调用componentDidUpdate()因为DOM refs不再有效。
	* shallow renderer不再实现unstable_batchedUpdates()。

##### 打包

* 不再有react/lib/\* 和 react-dom/lib/\*。即使在CommonJS环境下，React和ReactDOM都会预编译成单独的文件("flat bundles")。如果你的项目之前依赖于没有文档化的React内部方法，但是现在它们不再有效，联系我们让我们知道你的特殊栗子，我们会尽量提出一个可融合方案。
* 不再构建react-with-addons.js。所有兼容的插件都会发布到npm上，如果你需要我们也提供了浏览器单文件版本。
* 在15.x中启用部分的介绍已经在核心包中被去掉了。如下的这些方法是等效的，
React.createClas <=> create-react-class，React.ProprTypes <=> prop-types，React.DOM <=> react-dom-factories, react-addons-test-utils <=> react-dom/test-utils,shallow renderer <=> react-test-renderer/shallow。可以查看15.5.0及15.6.0版本的博客以了解融合代码及自动化codemods。
* 浏览器单文件版本构建文件的名字和路径的改变是为了强调开发和生产环境的不同。如下所示：
	* react/dist/react.js -> react/umd/react.development.js
	* react/dist/react.min.js -> react/umd/react.production.min.js
	* react-dom/dist/react-dom.js -> react-dom/umd/react-dom.development.js
	* react-dom/dist/react-dom.min.js -> react-dom/umd/react-dom.production.min.js

( Over... )

# css @supports实现的级联网页设计

> 翻译原文： https://24ways.org/2017/cascading-web-design


---

特性查询，即@supports规则，作为CSS2的扩展被引入CSS Conditional Rules Module Level3中，它在2011年首次作为工作草案发布。它是一个条件组规则，用来检测浏览器UA是否支持CSS的属性值，条件由逻辑与,逻辑或,逻辑非组合而成。

设计该功能的动机是允许作者在浏览器支持时使用新特性编写样式，同时在不支持的情况下优雅降级。即使CSS本身已经允许优雅降级，例如只要不破坏样式表中的其它样式，忽略不支持的属性值即可。但有时我们需要更多的东西。

说到底CSS是一种整体技术，即使你可以单独使用属性，但CSS充满力量的闪光点在组合使用时。在构建Web布局时尤其明显。在CSS中进行原生特性检测，使在最新浏览器使用尖端CSS技术，同时支持旧浏览器更为方便。

###   浏览器支持情况
Opera在2102年11月首次实现了特性查询，Chrome和Firefox在2013年5月紧随其后。多年来已有多篇关于特性查询的文章，但是，对其已经被广泛支持的现状似乎并不是众所周知的。早期对特性查询的大部分报道都不是用英文写的，也是这是其中一个限制因素。

- @supports― CSSのFeature Queries by Masataka Yakura, August 8 2012
- Native CSS Feature Detection via the  @supports Rule by Chris Mills, December 21 2012
- CSS  @supports by David Walsh, April 3 2013
- esponsive typography with CSS Feature Queries by Aral Balkan, April 9 2013
- How to use the @supports rule in your CSS by Lea Verou, January 31 2014
- CSS Feature Queries by Amit Tal, June 2 2014
- Coming Soon: CSS Feature Queries by Adobe Web Platform Team, August 21 2014
- CSS feature queries mittels @supports by Daniel Erlinger, November 27 2014

截止2017年12月，所有当前主流浏览器及其之前的2个版本都支持特性查询，包括Opera Mini，UC浏览器和Samsung Internet。唯一不支持的浏览器是IE和Blackberry Mobile,但这可能没有您想象的那么严重。

Can I Use css-featurequeries?caniuse.com列出了主要浏览器对特性查询的支持情况。当然，仍然有相当多的组织需要IE的支持。微软仍然继续支持IE11用于Windows7,8,10。然而，自2016年1月12提起，他们已经停止支持旧版本。由于某些原因，仍然会有组织强烈要求支持IE，但随着时间的推移，这个数字将继续缩小。Jen Simmons写了一篇名为“ Using Feature Queries in CSS”的文章，文章讨论了在使用特性查询时可能出现的情况矩阵，下图为各种情况的摘要。

![avatar](/images/1.png)

我们需要处理最棘手的情况是左上角的框，它是指“浏览器不支持特性查询，但是支持在特性查询内的特性”。对于这种情况，它取决于你想使用的特定CSS功能，以及随后评估不使用该特性的优缺点，尽管浏览器（很可能是IE）可能支持它。

###   基本使用
与任何条件一样，特性查询对布尔逻辑进行操作，换句话说，如果查询条件为true，则应用块中的CSS属性，否则忽略整个块。简单查询语法如下：


```
.selector {  /* Styles that are supported in old browsers */}@supports (property:value) {  .selector {    /* Styles for browsers that support the specified property */  }}
```

请注意，在 property:value周围的括号是必须的，如果没有括号则规则无效。应该先写适用于旧浏览器的样式，比如备用样式。接着写新的属性，它们被包含在@supports条件中。由于级联，在现在浏览器中备用样式会被新属性覆盖。


```
main {  background-color: red;}@supports (display:grid) {  main {    background-color: green;  }}
```
上述例子中，因为条件解析为true，支持CSS grid浏览器的main元素将具有绿色背景。不支持的grid的浏览器将具有红色背景。
这种实现意味着我们可以根据我们洗哦昂要使用的功能对增强样式进行分层。这些样式将展示在支持它们的浏览器中，对于不支持的浏览器，它们会获得看起来仍然在工作的基本外观。这将是我们前进的方向。

###   布尔操作
and操作符允许我们在单个条件内测试多个属性的支持情况。如果所需css输出需要同时支持多个特征才能工作，and操作符将会非常有用。对于所要应用的样式，条件中列出的属性：值必须全部为true

```
@supports (transform: rotate(45deg)) and          (writing-mode: vertical-rl) {  /* Some CSS styles */}
```
or操作符允许我们在条件中列出多个属性：值对，只要一个为true，就会应用块中的样式。相关用例属用于具有前缀的属性。

```
@supports (background: -webkit-gradient(linear, left top, left bottom, from(white), to(black))) or          (background: -o-linear-gradient(top, white, black)) or          (background: linear-gradient(to bottom, white, black)) {  /* Some CSS styles */}
```
not操作符否定原条件的解析值，在支持属性时解析为false，反之亦然。当根据特定功能的支持应用两组不同的样式时，这非常有用。但是，我们需要记住浏览器不支持特性查询的情况，并且相应的处理这些浏览器的样式

```
@supports not (shape-outside: polygon(100% 80%,20% 0,100% 0)) {  /* Some CSS styles */}
```
为了避免and和or操作符的混淆，必须显式声明这些运算符，而不是使用逗号或空格。为了防止由优先规则引起的混淆，and,or和not运算符，必须要在括号内才能混合。

下面这个规则是无效的，块中的样式将被忽略。
```
@supports (transition-property: background-color) or          (animation-name: fade) and          (transform: scale(1.5)) {  /* Some CSS styles */}
```
为了使它生效，必须给or或and两个操作符周围的属性添加括号，如下所示：


```
@supports ((transition-property: background-color) or          (animation-name: fade)) and          (transform: scale(1.5)) {  /* Some CSS styles */}
```

```
@supports (transition-property: background-color) or          ((animation-name: fade) and          (transform: scale(1.5))) {  /* Some CSS styles */}
```
当前规范声明在not后，and和or操作符两侧需要添加空格，但这可能在未来的规范中发生变化。即使不需要括号也可以添加额外的括号，但省略号被认为是无效的。
###   级联web设计

我想介绍级联网页设计的概念，这是一种通过特性查询实现的方法。最近浏览器更新的周期很短，因此和早期网络相比，新功能和bug修复的推出频率更高。
随着Web标准的成熟，浏览器行为比以前更易预测，但每个浏览器仍然会有各自的特性(quirks)。最新功能很可能不会同时在所有浏览器中提供。但你知道吗？那很好。如果我们把这个作为web的一种特征，而不是错误，我们就能开辟网络设计的更多可能性。
以下例子是一个使用flexbox实现的基本响应式网格布局，在IE11的展示。

![avatar](/images/2.png)

我们可以在@supports中添加一个样式块，以便为支持css网格属性的浏览器应用该样式增强布局。如下所示：

![avatar](/images/3.png)

web不是静态的。它是动态和交互式的，我们通过编写代码来告诉浏览器我们想要它做什么来操控web。相比较于对像素进行微观管理，可能是时候将我们的设计控制权交给渲染它们的浏览器了。这意味着设计在不同浏览器和设备上看起来不同是可以接受的。

如前所述，CSS在各种属性组合在一起时效果最佳。它是整体效果大于其中一部分组合在一起。因此，当特性查询和媒体查询结合使用时，我们可以设计在当前执行环境中最有效的布局。

这种方法需要多层次多维度的思维。作为网页设计师和开发人员，我们不仅仅在一个固定的纬度上撕开，我们需要考虑我们的设计如何在狭窄的屏幕或旧的浏览器上变形，以及它将如何在浏览器上现实最新功能。

在下面的示例中，左侧的布局是使用IE11的用户看到的，中间的是Firefox用户看到的，因为Firefox还不支持CSS shapes,但是一旦支持，用户将看到最右布局，这是Chrome用户现在看到的布局。

![avatar](/images/4.png)

随着今年CSS Grid发布，我们在网络演变中又抵达了一个里程碑。网络的美妙之处在于其向后兼容和容错能力。浏览器功能很多程度上是锦上添花，保持基础的部分并在它们之上构建更多能力，同时弃用不能很好工作的部分。

特性查询允许我们逐步增强CSS，在最广泛的浏览中建立基本的用户体验，同时为可以使用它的浏览器构建更高级的应用。希望这将使我们更多人创造真正拥抱网络本质的设计。

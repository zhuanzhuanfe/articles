# 唤起App在转转的实践

> 福利✿✿ヽ(°▽°)ノ✿： 文章最后有抽奖，《JavaScript高级程序设计 - 第四版》，走过路过不要错过哦

![作者](https://pic1.zhuanstatic.com/zhuanzh/f42ceda3-3c56-4055-84b4-3ff0d186afb1.jpeg)

转转App是我们公司最核心的产品，引导用户到转转App中来，对用户增长和留存十分重要。常见的做法是在各个流量入口，投放Web版的引流页面，然后通过该页面唤起App（下文简称**唤端**）。本文重点介绍转转是如何在各种场景下，完成整个唤端流程的。

## 唤端功能架构
我们先通过一张Gif图，直观的看下唤端是什么
![唤端](https://pic1.zhuanstatic.com/zhuanzh/d8281bfa-23c1-4479-bd14-d8d951fdaf84.gif)
如上图，在Safari浏览器中，当我们点击唤起App按钮后，系统提示我们是否需要 “在转转中打开”，点击确认后，转转App便被唤起来了，这就是一个最简单的唤端场景。

不过细心的同学一定会问，那如果我系统没装转转App，点击按钮会是什么效果呢？
这是一个很常见的场景，对于没有安装相关App的用户，往往会需要跳转到下载页面，让用户去下载。

也就是说唤端一般包含了 **唤起App** 、 **下载App** 以及 **唤起App失败后自动下载** 这三个功能。

再进一步想一下，唤端功能还需要能唤起指定页面，比如一个用户在下单页，唤起App后，我们希望App默认打开的还是那个下单页，不然让用户再走一遍流程到下单页，那对订单转化率会有不小的影响。

总结一下，我们用一张流程图来说明下唤端整体功能架构
![唤端功能架构](https://pic5.zhuanstatic.com/zhuanzh/8ad7db41-edb9-4076-a150-0ee017392207.png)

## 唤端技术架构
聊完了唤端是什么，接下来进入主菜，聊聊唤端具体的技术架构
唤端所使用的技术，通常可以统称为Deep Link（深度链接）技术。不同平台对这项技术有着不同的实现，主流的有这几种
- URL Scheme（全平台通用）
- Universal Link（通用链接，iOS系统专属）
- App Links 以及衍生的 Chrome Intents（安卓系统专属）

当然，以上只是国际通用标准，我们还需要考虑到“国内特色”，包括但不限于**微信爸爸**、微博、UC浏览器等这些环境的唤端，对于这些App，主流的唤端方式有这么几种
- Universal Link（部分App可用，快被国内主流App禁干净了）
- 微信API `launchApplication` 和 `getInstallState` （需要申请白名单，难度很高）
- 微信开放标签 `<wx-open-launch-app>` (微信推荐方式，需要审核，流程较繁琐)
- 跳转到应用宝，然后通过应用宝唤端 （适用于微信安卓环境）
- 弹出个蒙层，友好的提示用户，点击右上角按钮，然后选择在浏览器中打开 （easy~）

看过去有点天花乱坠，老样子，我们通过一张功能架构图，完整的看看唤端的技术架构
![唤端技术架构](https://pic1.zhuanstatic.com/zhuanzh/21fb7b4a-8ac3-425c-a81c-2e5ea4366582.png)
怎么样，看完了功能架构图是不是更晕了😁，别着急，接下来我会针对上面提到的主要方法进行细致的讲解。

## 常见唤端方法详解
这部分，我们主要介绍下 `URL Scheme`、`Universal Link`、`微信唤端` 和 `自家公司App` 四种技术场景下的唤端实现

### URL Scheme
URL Scheme其实就是一个URL前面的协议部分，比如这个地址 `https://m.zhuanzhuan.com`，其中 `https`就是一个Scheme，代表这是一个`https`的地址。

我们再看一个地址 `zhuanzhuan://jump/core/myBuyList/jump?tab=0`，当我们访问这个地址的时候，如果系统中有注册 `zhuanzhuan:// => 转转App`，那么系统便会使用转转App打开这个链接了，接着App会解析URL的path和search部分，执行对应的操作。

那么如何向系统注册 `zhuanzhuan` 这个Scheme呢，安卓可以在 `manifest` 里通过 `intent-filter` 配置，iOS 则可以在 `info.plist` 文件中添加 `URL types` 来注册一个 Scheme。

#### Scheme的调用方法
Scheme的调用也十分简单，我们可以通过 `location.href` 或 `iframe` 或 `a标签` 来调用
这三种方式并无本质区别，都是让系统访问一个URL，只不过在某些环境下，当方法失效时，需要采用另一种形式。

经过长时间的摸索，我们总结了如下最佳实践
- 在iOS的QQ环境，使用 `a标签` 方式调用URL Scheme更加稳定
- 非上述情况，使用 `location.href` 调用URL Scheme即可
- 如果希望URL Scheme出错时，唤端不会跳转到错误页面，那么可以使用 `iframe` 的形式，不过需要注意个别机型的兼容性

三种调用方式的具体代码如下
```javascript
// SCHEMA_PATH 为 URL Scheme 地址

// location.href 形式
window.top.location.href = SCHEMA_PATH;

// a标签形式
const a = document.createElement("a");
a.setAttribute("href", SCHEMA_PATH);
a.click();

// iframe形式
iframe = document.createElement('iframe');
iframe.frameBorder = '0';
iframe.style.cssText = 'display:none;border:0;width:0;height:0;';
document.body.append(iframe);
iframe.src = SCHEMA_PATH;
```

#### 唤端失败自动下载
使用URL Scheme会遇到一个棘手的问题，那就是我们无法得知是否成功唤起App。这个也可以理解，因为这个方式本质上就是访问一个URL，并没有特别的地方。
但是唤端失败（通常是用户没有装这个App），我们需要引导用户去下载，这就要求我们需要通过一些手段，去检测唤端是否成功。
常见的做法是通过监听页面是否在 n秒内 隐藏来判断是否成功唤起App，因为如果唤起，那当前页面必然已经退到后台去了。
所以我们处理的流程是这样
1. 当点击唤端后，定时器延时n秒(我们设定的是2.5秒)后执行下载操作
2. 监听 `visibilitychange` 事件，如果页面隐藏，则表示唤端成功，清除定时器
3. 如果 `visibilitychange` 事件没有被触发，那么就代表唤端失败，n秒后就会执行下载的操作

具体代码如下
```javascript
// n秒后执行下载
const timer = setTimeout(() => {
  this.__download(options);
}, options.delay);

// 页面隐藏，那么代表已经调起了app，就清除下载的定时器
const visibilitychange = function() {
  const tag = document.hidden || document.webkitHidden;
  tag && clearTimeout(timer);
};

document.addEventListener("visibilitychange", visibilitychange, false);
document.addEventListener("webkitvisibilitychange", visibilitychange, false);
window.addEventListener(
  "pagehide",
  function() {
    clearTimeout(timer);
  },
  false
);
```
不过这个方法有个致命问题，就是 `n` 应该取多少，不同的手机，唤端的时间并不一样。
- 时间设置太长，用户下载等待太久，会导致用户还没看到下载就退出了。
- 时间设置太短，可能会导致还没有唤起App，就又同时执行了下载的逻辑。

这里我们经过测试，觉得n设置为2500ms-3000ms，是一个比较合适的值

#### URL Scheme在iOS上的问题
上面说到了唤端失败自动下载的场景。在实际项目中，我们会发现在iOS上使用URL Scheme还有一个问题，就是即执行了唤起，也执行了下载。经过测试我们得到了如下流程
1. 用户点击唤端按钮（记录Time1）
2. Safari弹出是否在“转转”打开的confirm框
   - 此时虽然弹出了alert框，但是并未阻断代码运行，所有代码仍在运行中，只是界面没变
3. 用户点击打开转转（记录Time2），跳转到转转
4. 用户返回Safari，如果Time2 - Time1的时间大于设置的时间 `n`，那么之前的逻辑代码便会继续运行。也就会出现唤端成功后，又继续走下载逻辑

对于这个问题，大家看这个动图更直观些，第一次是点击唤端后，停留了一会才点击打开。第二次是立刻点击打开
![URLScheme在iOS下的问题](https://pic6.zhuanstatic.com/zhuanzh/72a66faf-665e-4eb5-8536-5ae24c8e399e.gif)

### Universal Link
上面提到了URL Scheme在iOS的一些问题。其实在iOS系统中，有一种更好的方式，那就是接下来要介绍的Universal Link。
Universal Link是在`iOS 9`中新增的功能，使用它可以直接通过`https`协议的链接来打开APP。
同时因为是使用`https`协议，所以如果没有唤端成功，那么就会直接打开这个网页，不再需要判断是否唤起成功了。并且使用Universal Link，不会再弹出是否打开的弹出，对用户来说，唤端的效率更高了。

我们先看一个Universal Link唤端的例子，比如这个地址 `https://mjump.zhuanzhuan.com/zhuanzhuan/index.html`，直接访问它是一个下载引导页，但是在项目中，通过 `location.href` 跳转，却可以直接唤起转转。
*PS：点击按钮时，执行的代码是 `location.href = https://mjump.zhuanzhuan.com/zhuanzhuan/index.html`*
![ios的通用链接](https://pic6.zhuanstatic.com/zhuanzh/efaac2fd-821d-4632-8460-a7cef314bc09.gif)

Universal Link的配置过程，网上的文章比较零散细碎，这里我梳理下它的原理与关键点，把流程串起来，方便理解，避免大家采坑
1. app在发布的时候，在`Associated Domain`配置好一个域名
   - 该域名与今后要唤端页面的域名，不能一样。 比如 转转web的域名是 `m.zhuanzhuan.com`，那么这个域名就不能用它了，可以用 `mjump.zhuanzhuan.com`
2. iOS系统在**app安装**的时候，会请求配置在`Associated domain`中域名（在这里就是`https://mjump.zhuanzhuan.com`）的根路径或者`.well-known`路径的配置文件`apple-app-site-association`，并把它注册到系统中
    - 这个文件的内容大体如下，其中appID就是App在系统中的id，`paths`我们后面会提到
```javascript
{
  "applinks": {
    "apps": [ ],
    "details": [
      {
        "appID": "ECVV5G85CD.com.wuba.zhuanzhuan",
        "paths": [
          "zhuanzhuan/*",
          "/qq_conn/1104903352/*"
        ]
      },
      {
        "appID": "ECVV5G85CD.com.zhuanzhuan.yige",
        "paths": [
          "yige/*"
        ]
      },
      {
        "appID": "75BF75R4NH.com.wuba.*",
        "paths": [
          "*"
        ]
      }
    ]
  }
}
```
3. 当页面进行**跨域访问**时，比如从`https://m.zhuanzhuan.com`跳转到`https://mjump.zhuanzhuan.com/zhuanzhuan/index.html`，因为`mjump.zhuanzhuan.com`在第2步的时候，已经被系统注册过了，所以系统会把页面的path，也就是`zhuanzhuan/index.html`部分，和上面的配置文件中的paths进行匹配，如果能匹配上，那么就会唤起配置文件中对应的App。如果匹配不上，或者用户没有安装该App，那么就正常进行地址访问
   - 因为唤端失败会访问`https://mjump.zhuanzhuan.com/zhuanzhuan/index.html`地址，所以这个地址不能是404
   - 直接在浏览器访问这个地址，并不会唤起App，因为不是**跨域访问**
   - 唤起App后打开指定页面，可以通过在URL上增加参数，然后Native解析参数的形式来实现

### 微信唤端
微信作为一个超级App，如果能借助微信的流量进行唤端，想想也很开心😁。不过微信对唤端做了十足的限制，用起来可没有那么容易

#### 微信通用唤端能力
微信`7.0.5`版本放开了Universal Link，所以在iOS系统下，使用Universal Link就可以在微信完成唤端。
在实际使用中，我发现了一个奇怪的问题，就是有些App可以在微信直接唤起到另一个App，中间没有任何提示。而转转在唤端的时候，会有一个“可能离开微信，打开第三方应用”的提示😹
![微信提示](https://pic6.zhuanstatic.com/zhuanzh/3cb6eac5-f045-4412-bc94-379f912d01b9.jpeg)

在安卓端，我们可以使用应用宝进行微信唤端。先跳转应用宝，然后通过应用宝再唤起相应的app，同时应用宝也开放了`应用宝 App Link`，可以做到唤起指定页面

#### 微信API - launchApplication
早期微信提供了`launchApplication`和`getInstallState`方法来进行唤端。其中`launchApplication`可以直接唤起App，`getInstallState`可以检查某个App是否安装（仅限安卓）。
开通了白名单的应用，可以通过这两个API进行唤端。没开通的同学，现在应该很难开通了，可以使用微信推荐的开放标签来进行唤端

这里简单梳理下`launchApplication`的使用流程
1. 首先拿到签名进行config配置
```javascript
wx.config({
  debug: false,
  appId: conf.appId,
  timestamp: conf.timestamp,
  nonceStr: conf.noncestr,
  signature: conf.signature,
  beta: true,
  jsApiList: ['launchApplication', 'getInstallState'], // 使用这两个API
  openTagList: ['wx-open-launch-app'],
})
```
2. 使用如下两个API进行唤端操作
```javascript
 /**
   *  @description 微信拉起第三方App方法
   *  @param {Object} options -必填项，以json形式传参
   *  @param {String} options.appID - 必填项，供iOS使用
   *  @param {String} options.parameter - 必填项，schema://parameter 通过系统接口拉起第三方app。中文或特殊字符需要encode
   *  @param {String} options.extInfo - 必填项，该参数仅Android使用，对应Android微信opensdk中的extInfo，格式自定义，由第三方APP自行解析处理ShowMessageFromWX.Req 的微信回调
   * */
  launchApplication(options) {
    return WeixinJSBridge.invoke('launchApplication', options, res => {
      console.log(res)
    })
  }

  /**
   *  @description 微信判断第三方App是否安卓 (仅仅Android支持, IOS无效、无法判断)
   *  @param {Object} options -必填项，以json形式传参
   *  @param {String} options.packageName - 必填项，安卓的包名
   *  @param {String} options.packageUrl - 必填项，schema 协议
   * */
  getInstallState(options) {
    return WeixinJSBridge.invoke('getInstallState', options, res => {
      console.log(res)
    })
  }
```

经过上面的配置后，我们可以看一下微信端唤端的演示动图
![微信唤端](https://pic3.zhuanstatic.com/zhuanzh/b8bf9364-0aae-4da2-bbee-314a65421a92.gif)

#### 微信开放标签 - wx-open-launch-app
微信开放标签是微信官方提供的唤端组件，具体使用方式可以参考[官方文档](https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_H5_Launch_APP.html)。
这里有个注意点，就是该功能需要一个公众平台的服务号和开放平台的账号以及应用进行绑定。因为我们公司的App绑定的公众平台与开放平台主体并不一样，所以这个功能没使用成功，有需求的同学可以试试
> 开放平台与公众平台的区别，可以参考笔者过去的文章 (快速了解微信开放生态体系 - https://zhuanlan.zhihu.com/p/189968202)。

### 自家App唤起其他App
最后要说下自家的App去唤起类似支付宝、微信等应用的情况。其实这个吧，对FE来讲也并不复杂，让Native人员提供一个方法给咱调用就行😁。
App可以调用系统的API，比如 `openURL` 等，可以很方便的唤起其它App。这块对我们来说，需要注意的就是动态引入App的sdk，保证唤起的时候sdk初始化完成。动态引入的具体逻辑，在源码中可以查阅到~

## 源代码
唤端的细节判断比较多，一篇文章很难说清楚，我们把转转使用的一个稳定版本的唤端库开源，方便大家交流学习，代码写的一般，主要供大家参考，同时也欢迎大家对代码进行吐槽，你们的吐槽是我们重构的源动力😁
源码地址：https://github.com/zhuanzhuanfe/call-app

## 本月文章预告
预告下，接下来我们会陆续发布转转在Hybrid、微前端、Umi等基础架构和中台技术相关的实践与思考，欢迎大家关注，期望与大家多多交流

## 文末福利
转发本文并留下评论，我们将抽取第30名留言者（依据公众号后台排序），送出《JavaScript高级程序设计(第四版)》实体书一本，大家转发起来吧~
![js高程4](https://pic3.zhuanstatic.com/zhuanzh/b28ca40a-eb80-48be-94b4-788c07fab97e.jpeg)

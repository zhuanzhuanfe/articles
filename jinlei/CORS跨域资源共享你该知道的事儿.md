**“唠嗑之前，一些客套话”**

CORS跨域资源共享，这个话题大家一定不陌生了，吃久了大转转公众号的深度技术好文，也该吃点儿小米粥溜溜胃里的缝儿了，今天咱们就再好好屡屡CORS跨域资源共享这个话题，大牛怡情小牛巩固，把这碗前端经久不凉的大碗茶，再细细的品一品。

--------

**“JSONP直接了当很豪爽，CORS细吮慢品大补汤”**

在咱们前端的日常工作中，跨域比较常用的方式就是JSONP，JSONP呢就是通过script标签无同源限制的特点，在获取到需要的资源后自动执行回调方法的方式，而我们浏览器原生的CORS跨域，是通过“正当手段”得到服务器小姐姐首肯，大摇大摆获取跨域资源的方式，相比JSONP只能实现GET请求，CORS大法支持所有的请求类型，同时CORS是通过普通的XMLHttpRequest发起请求和获得数据，比起JSONP有更好的错误处理，接下来我们就来说下这个CORS大法。

-----------

**“整体概述，先摆个谱”**

***官方简略的：***
CORS（Cross-Origin Resource Sharing）跨域资源共享，主要思想就是使用自定义的HTTP头部让浏览器与服务器进行沟通，从而决定响应是成功还是失败，它允许了浏览器向跨源服务器发送请求，从而克服了同源的限制。

***私下露骨的：***
 其实就是向服务器发送跨域请求时，浏览器自动针对普通请求和非普通请求进行区别对待，在请求头中加个Origin字段告诉服务器这个请求的源，通过服务器返回的响应头中Access-Control-Allow-Origin字段的值是不是请求中的Origin，来看服务器让不让咱请求到这资源。


------------

**“我是一些工作中不怎么用得到的基本知识，可我也是一条小生命啊”**

***CORS 浏览器的支持情况 ：***
![这里写图片描述](http://img.blog.csdn.net/20170728140200871?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)
浏览器端已经获得了良好的支持，所以实现CORS的关键就是服务器，只要实现了CORS的接口，就可以实现跨域通信。

***IE对CORS的实现：***

IE8中引入了XDR（XDomainRequest），注意：

 1. cookie不会随请求发送，也不会随响应返回
 2. 只能设置请求头部信息中的Content-Type字段
 3. 不能访问响应头部信息
 4. 只支持GET和POST请求

XDR对象的使用方法用户XHR对象非常类似，如下：

```
var xdr = new XDomainRequest();
xdr.onload = function() {
	alert(xdr.responseText);
}
xdr.onerror = function() {
	alert("error");
}
xdr.open("get", "http://www.xxx.com/yyy/");
xdr.send(null);
```

***其他浏览器对CORS的实现***

Firefox3.5+，Safari4+，Chorme，IOS版的Safari和Android平台下的WebKit都通过XmlHttpRequest实现了对CORS的支持。

```
var xhr = new XMLHttpRequest();
xhr.onreadystatechange = function () {
    if(xhr.readyState == 4){
        if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304){
            console.log(xhr.responseText)
        }else {
            console.log('err' + xhr.status);
        }
    }
};
xhr.open('get','http://www.xxx.com/zzz/',true);
xhr.send(null);
```

跨域XHR一些安全限制：

 1. 不能使用setRequestHeader()设置自定义头部
 2. 不能发送和接收cookie
 3. 调用获取所有头部信息的方法getAllReponseHeaders(）方法会返回空字符串


---------

**“请求没有那么简单，每种都有她的习惯”**

浏览器将CORS请求分成两类。

***1.简单请求：***

高大上版定义：
> Simple requests  
> 
> A simple cross-site request is one that meets all the following conditions:  
> 
> The only allowed methods are:   GET   HEAD   POST   
> 
> Apart from the headers set automatically by the user agent (e.g. Connection,User-Agent, etc.), the only headers which are allowed to be manually set are:   
> Accept   
> Accept-Language   
> Content-Language   
> Content-Type 
> 
> The only allowed values for the Content-Type header are:  
> application/x-www-form-urlencoded   multipart/form-data   text/plain

大意就是说：

 1. 请求方法是以下三种方法之一：HEAD，GET，POST
 2. HTTP的头信息不超出以下几种字段：Accept，Accept-Language，Content-Language，Last-Event-ID
 3. Content-Type只限于三个值：application/x-www-form-urlencoded、multipart/form-data、text/plain

***2.非简单请求：***

非简单请求是那种对服务器有特殊要求的请求，除以上条件之外的都是非简单请求，条件如下：

 1. 使用了下面任一 HTTP 方法：PUT，DELETE，CONNECT，OPTIONS ，TRACE ，PATCH 
 2. 人为设置了对 CORS 安全的首部字段集合之外的其他首部字段。该集合为：Accept，Accept-Language，Content-Language，Content-Type (but note the additional requirements below)，DPR，Downlink，Save-Data，Viewport-Width，Width
 3. Content-Type 的值不属于下列之一:application/x-www-form-urlencoded，multipart/form-data，text/plain



-------

**“跨域请求分两队，差别对待也是醉”**


在讨论"CORS对不同请求的处理"这部分内容时，我们同步跑起来一个nodejs的项目对照着理解，纸上谈兵终觉浅，要干大事还得码啊！

为了更加直观，我们为我们接下来要占用的两个端口配下代理：

```
127.0.0.1:8081  m.zhuanzhuan.com
127.0.0.1:8082  u.58.com
```

**客户端nodejs脚本 client.js：**

```
var http = require('http');
var fs = require('fs');
var url = require('url');

// 创建服务器
http.createServer( function (request, response) {
  // 解析请求，包括文件名
  var pathname = url.parse(request.url).pathname;
  // 输出请求的文件名
  console.log("Request for " + pathname + " received.");
  // 读取请求的文件内容
  fs.readFile(pathname.substr(1), function (err, data) {
    if (err) {
      console.log(err);
      // HTTP 状态码: 404 : NOT FOUND Content Type: text/plain
      response.writeHead(404, {'Content-Type': 'text/html'});
    }else{
      // HTTP 状态码: 200 : OK
      response.writeHead(200, {'Content-Type': 'text/html'});
      // 响应文件内容
      response.write(data.toString());
    }
    //  发送响应数据
    response.end();
  });
}).listen(8082);
// 控制台会输出以下信息
console.log('Server running at http://u.58.com/');
```

**服务端nodejs脚本 server.js：**

```
var express = require('express');
var app = express();
var router = express.Router();

router.all('/getData', function(req, res, next) {
  //设置允许跨域请求
  var reqOrigin = req.header("origin");
   console.log(reqOrigin);
   if(reqOrigin !=undefined &&
   reqOrigin.indexOf("http://u.58.com") > -1){
    //设置允许 http://u.58.com 这个域响应
    res.header("Access-Control-Allow-Origin", "http://u.58.com");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Authorization",'zhuanzhuanFe')
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  }
  res.json(200, {name:"转转熊",property:"Cute"});
});

app.use('/', router);

var server = app.listen(8081, function () {
  console.log("应用实例，访问地址为http://127.0.0.1:8081/");
});

console.log('Server running at http://m.zhuanzhuan.com/');
```

***创建一个index.html***

```
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>test cors</title>
</head>
<body >
	<button id="btn" onclick="getData()">跨域获取数据</button>
</body>
<script>
  function getData(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if(xhr.readyState == 4){
        if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304){
          console.log(xhr.responseText)
        }else {
          console.log('err' + xhr.status);
        }
      }
    };
    xhr.open('get','http://m.zhuanzhuan.com/getData',true);
    xhr.send(null);
  }
  
</script>
</html>
```

我们在控制台执行我们创建的client.js
![这里写图片描述](http://img.blog.csdn.net/20170821181831544?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

在浏览器访问 http://u.58.com/index.html（也就是我们的127.0.0.1:8082），控制台会看到如下输出：

![这里写图片描述](http://img.blog.csdn.net/20170821183548637?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

同时，我们把我们的服务端也跑起来，注意上一个服务不要停掉哈

![这里写图片描述](http://img.blog.csdn.net/20170821184314471?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

有了代码心里就有底了，接下来我们来看下简单和非简单请求，CORS到底do了what!

***1.简单请求：***

按照上面的getData方法的配置：

```
xhr.open('get','http://m.zhuanzhuan.com/getData',true);
```

我们点击一下http://u.58.com/index.html页面的按钮，浏览器就会从http://u.58.com下发向http://m.zhuanzhuan.com/getData发送一个普通的GET请求

对于简单的跨域请求，浏览器自动的发出CORS请求，在请求头中，增加一个Origin字段，如下请求头：
![这里写图片描述](http://img.blog.csdn.net/20170821185202132?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

请求头RequestHeaders中有一个Origin字段，这个字段表示本次请求来自哪个源（协议 + 域名 + 端口）

服务器接收到请求后，如果不为这个跨域请求做任何的操作，如下改写下server.js：

```
router.all('/getData', function(req, res, next) {
 //不做任何的处理
});
```

服务器接收到请求后，如果Origin指定的源不在许可范围内，服务器会返回一个正常的HTTP回应，浏览器接收到的回应头信息中没有包含Access-Control-Allow-Origin字段，那么浏览器就会抛出一个错误，被XHR的onerror函数捕捉，这种情况无法通过状态码判断，状态码可能会返回200。
![这里写图片描述](http://img.blog.csdn.net/20170821192146028?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

如果请求头中的Origin字段是服务器允许的来源，那么服务器会在请求的返回头中添加Access-Control-Allow-Origin字段，并赋值为请求头中的Origin，表示允许该源请求资源。接下来我们恢复server.js中之前对getData请求的处理，再次点击按钮发起跨域请求，模拟一下上述情景：

```
router.all('/getData', function(req, res, next) {
  //设置允许跨域请求
  var reqOrigin = req.header("origin");
   console.log(reqOrigin);
   if(reqOrigin !=undefined && reqOrigin.indexOf("http://u.58.com") > -1){
    //设置允许 http://u.58.com 这个域响应
    res.header("Access-Control-Allow-Origin", "http://u.58.com");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Authorization",'zhuanzhuanFe');
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization");
  }
  res.json(200, {name:"转转熊",property:"Cute"});
});
```

如果Origin指定的域名在许可的范围内的话，服务器返回的响应，会多出来几个头信息字段：
![这里写图片描述](http://img.blog.csdn.net/20170821193646129?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)
响应头Response Headers中以Access-Control-开头的字段都是与CORS相关的字段,其中Access-Control-Allow-Origin 该字段是允许跨域响应头中必不可少的一个字段，值一般都是请求中Origin的值，表示允许当前源的跨域请求，也可以设置成*，表示接受任意源的请求。其余相关字段下面会详解。

**2.非简单请求 Preflighted Request：**
当浏览器发送的请求为非简单请求时，浏览器必须首先使用 OPTIONS 方法向服务器发起一个预检请求（Rreflighted Request），从而获知服务端是否允许该跨域请求。预检请求的使用，可以避免跨域请求对服务器的用户数据产生未预期的影响。
 
 我们将请求从简单请求GET改成非简单请求PUT，将index.html中getData方法稍加改动：
 

```
xhr.open('put','http://m.zhuanzhuan.com/getData',true);
```
当然，我们还是要先看看对跨域请求不做任何处理的时候的状态，继续将server.js中对Access-Control-Allow-Origin字段的设置注释掉，发送下请求：
![这里写图片描述](http://img.blog.csdn.net/20170821195845302?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

响应头中Access-Control-Allow-Origin字段如果不设置为Origin字段的值或者“*”，就表示该预检请求不被同意，会返回一个正常的HTTP回应，但是没有任何的CORS相关头信息字段，这时浏览器接收到响应，会被XMLHttpRequest对象的onerror()回调函数捕获，控制台会打出如上的报错信息。

我们接下来看看正常的复杂请求的处理逻辑。恢复server.js中对Access-Control-Allow-Origin字段的设置，刷新页面，点击按钮再次发送请求，我们看到比起我们要发送的PUT请求，页面多了一次类型为OPTIONS的请求：

![这里写图片描述](http://img.blog.csdn.net/20170821194555164?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

这个就是预检请求。对于预检请求，响应头中有一个必须的字段：Access-Control-Request-Method，表示请求允许使用的方法，如果没有这个字段，预检请求无法通过，我们来实践一下，注释掉之前在响应中对Access-Control-Request-Method字段的设置，改写下server.js:

```
router.all('/getData', function(req, res, next) {
  //设置允许跨域请求
  var reqOrigin = req.header("origin");
   if(reqOrigin !=undefined && reqOrigin.indexOf("http://u.58.com") > -1){
    //设置允许 http://u.58.com 这个域响应
    res.header("Access-Control-Allow-Origin", "http://u.58.com");
  }
  res.json(200, {name:"转转熊",property:"Cute"});
});
```
点击页面按钮发送put请求，可以看到页面控制台报错：
![这里写图片描述](http://img.blog.csdn.net/20170821195037701?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

顾名思义，我们发送的put方法并没有在响应头中设置被允许，所以，预检请求失败，真正的请求也就被扼杀在摇篮里了...

来来来让我们动气程序员证就世界的手指把摇篮里的巨婴救活吧！恢复server.js到最开始的状态，重新发送请求：
![这里写图片描述](http://img.blog.csdn.net/20170821195421877?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)


服务器一旦通过了预检请求，以后每次浏览器正常的CORS请求都会跟简单请求一样，妥了，救活，万岁！

  
-------------------------------------


**“凭证不是你想带，想带就能带”**  
  

默认情况下跨域请求不提供凭据（Cookie,HTTP认证以及SSL证明等），但是通过将xhr的withCredentials属性设置为true，就可以指定某个请求发送凭据。如果服务器接受带凭据的请求，会在响应头中用Access-Control-Allow-Credentials：true来响应。

首先我们改写下index.html中的getData方法：

```
function getData(){
    var xhr = new XMLHttpRequest();
    //允许跨域携带请求
    xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
      if(xhr.readyState == 4){
        if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304){
          console.log(xhr.responseText)
        }else {
          console.log('err' + xhr.status);
        }
      }
    };
    xhr.open('put','http://m.zhuanzhuan.com/getData',true);
    xhr.send(null);
  }
```
我们刷新页面发送请求：
![这里写图片描述](http://img.blog.csdn.net/20170821201253635?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

一厢情愿了吧，意思就是在预检请求的响应头中如果不同时为Access-Control-Allow-Credentials设置为true，那么浏览器就不会把响应交给javascript，responseText为空字符串，status为0，触发onerror()，跨域携带凭证的请求是不被允许滴。

我们乖乖在server.js响应中加上下面的代码:

```
res.header("Access-Control-Allow-Credentials",'true');
```

再次请求，可以看到：

![这里写图片描述](http://img.blog.csdn.net/20170821201652940?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)
拖家带口闯关东成功！

对于附带身份凭证的请求，服务器不得设置 Access-Control-Allow-Origin 的值为“*”，值必须为Origin 首部字段所指明的域名即允许附带凭证的源，实践一下看看，将server.js中稍加修改：

```
res.header("Access-Control-Allow-Origin", "*");
```
发送请求，可以看到：
![这里写图片描述](http://img.blog.csdn.net/20170821202006595?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdTAxMTY3NTAzNw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

祖国河山一片红，不说应该也懂了吧，就是不行哈不行，NOOO！


---------------
**“...我编不出来了...反正就是介绍下双方出场队员= =”**

  
最后我们将跨域涉及到的一些响应头中Access-Control-Allow家族常见的字段罗列下，给我们的知识系统来几下80块的扎实大锤：

***HTTP 响应首部字段***

 1. **Access-Control-Allow-Origin: <origin> |***： 表示可以请求数据的请求来源
 2. **Access-Control-Expose-Headers：zhuanzhuanFe**： 在跨域访问时，XMLHttpRequest对象的getResponseHeader()方法只能拿到一些最基本的响应头，Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头,如上这样浏览器就能够通过getResponseHeader访问zhuanzhuanFe响应头了。
 3. **Access-Control-Allow-Credentials: true**：允许跨域携带凭证的字段
 4. **Access-Control-Max-Age: < delta-seconds >**：来指定本次预检请求的有效期，单位为秒，在此期间浏览器无需为同一请求再次发送预检请求。请注意，浏览器自身维护了一个最大有效时间，如果该首部字段的值超过了最大有效时间，将不会生效。
 5. **Access-Control-Allow-Methods:  < method >[, < method >]**：首部字段用于预检请求的响应。其指明了实际请求所允许使用的 HTTP 方法。
 6. **Access-Control-Allow-Headers:  < field-name >[, < field-name >]***：如果浏览器请求包括Access-Control-Request-Headers字段，则Access-Control-Allow-Headers字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段，不限于浏览器在"预检"中请求的字段。
 
***HTTP 请求首部字段***

 1. **Origin: < origin >**：表明预检请求或实际请求的源
 2. **Access-Control-Request-Method: < method >**： 将实际请求所使用的 HTTP 方法告诉服务器。
 3. **Access-Control-Request-Headers: < field-name >[, < field-name >]***：将实际请求所携带的首部字段告诉服务器

---------

差不多就这么多了，鞠躬感谢，前端小新人的一些拙劣总结，有问题的地方还希望各位前辈们多多指教，一起携手在前端的草原策马奔腾吧！嘚驾~~~~

# 轻松把你的项目升级到PWA

## 什么是PWA
PWA（Progressive Web Apps,渐进式网页应用）是Google在2015年推出的项目，致力于通过web app获得类似native app体验的网站。

### 优点
1.无需客户端，少量流量即可安装
2.可添加到主屏并全屏运行
3.离线功能，响应更快，及时更新
4.PUSH能力
5.数据传输必须是https

### 缺点
1.safari对PWA的态度是考虑中,暂时还不支持
2.PUSH还不够成熟，依赖于[Web Push Protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-12),Chrome只支持Google私有的GCM（Google Cloud Messaging）/FCM服务进行通知推送。国内的mipush也支持了很多app，在此希望中国能尽快有一个统一的推送服务出现~

### 个人观点
PWA属于非侵入式的技术，可以做到降级兼容，并且拥有强大的离线功能，可以更快的响应，所以还是非常推荐使用的。
之前有推过**小型Web页打包优化**这片文章，现在我们就来改造一下这个项目内的一个小项目，为其增加PWA功能

## 网络应用清单
网络应用清单是一个 `JSON` 文件，主要定义一些启动网址，自定义图标，启动画面，主题颜色，启动样式等等配置信息
这边是在App内的M页，并且国内安卓用户使用的浏览器都不太支持这些定义，所以不详细介绍了。
[The Web App Manifest](https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/)官方文档，介绍的很详细~
[webpack-manifest-plugin](https://github.com/danethurber/webpack-manifest-plugin)如果使用webpack也可以使用类似这种插件来生成~
[Web App Manifest Generator](https://app-manifest.firebaseapp.com/)如果手写也有像这样的工具提供~

## Service workers
**升级主要用到的API**
**定义：**
Service workers 本质上充当Web应用程序与浏览器之间的代理服务器，也可以在网络可用时作为浏览器和网络间的代理。它们旨在（除其他之外）使得能够创建有效的离线体验，拦截网络请求并基于网络是否可用以及更新的资源是否驻留在服务器上来采取适当的动作。他们还允许访问推送通知和后台同步API。
**生命周期：**
注册→下载→安装→激活
**注意：**
1.Service workers运行在其他线程，完全异步，同步API不能在其中使用
2.大量使用Promise
**常用API**


## 升级项目


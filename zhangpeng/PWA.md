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
1.safari暂无支持PWA的打算
2.PUSH还不够成熟，Chrome 50/Android Chrome 55依赖于[Web Push Protocol](https://tools.ietf.org/html/draft-ietf-webpush-protocol-12),之前版本只支持Google私有的GCM/FCM服务进行通知推送
3.中国安装Chrome的用户非常少，以及网络限制问题，推动PWA非常困难

### 个人观点
PWA属于非侵入式的技术，可以做到降级兼容，并且拥有强大的离线功能，可以更快的相应，所以还是非常推荐使用的。
之前有推过**小型Web页打包优化**这片文章，现在我们就来改造一下这个项目内的一个小项目，为其增加PWA功能

## 


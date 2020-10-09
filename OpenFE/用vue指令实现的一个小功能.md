> 话不多说，先上图

![demo](http://upload-images.jianshu.io/upload_images/3357019-75da56f8eab783b4.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 背景：
本人在做图书demo的一个项目的时候，发现加载详情页的时候，出现了一个大大的红色NaN，等到数据返回后才会变为正常值，像这样： 

![大大的NaN](http://upload-images.jianshu.io/upload_images/3357019-055fe8fc8e9ebc06.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

##### 怎么解决？

相信很多童鞋就会说用 v-if/v-show 等到数据返回来之后在展示。
没错，笔者之前就是这么干的，但是还是会出现数据加载回来之前出现局部空白。那么有没有办法可以改善呢？下面介绍下笔者的解决办法，方法略显粗糙，请笑纳！

###### 解决灵感

记得之前老大在群里说研究一下饿了么的这个技术：

![饿了吗](http://upload-images.jianshu.io/upload_images/3357019-63e7dcffb99c8d56.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

所以给我这个方案带来了灵感，不妨在在数据加载之前预先渲染用一个设定好样式的元素试试呢。

##### 说干就干

###### 用啥做？

vue有没有什么可以直接操作dom的？我一下想到了vue的自定义指令。

###### 思路

在数据返回之前，先加载一个预先设定的样式（pre）元素，等到数据返回之后再替换真实（real）元素。对就是这么简单！

###### 代码实现

1.我们先定义一个样式接口

![样式定义](http://upload-images.jianshu.io/upload_images/3357019-2d5e7d84fb251002.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

2.定义模板

![模板](http://upload-images.jianshu.io/upload_images/3357019-9c9ad9bd9b4bc340.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

3.我们把模板插到我们挂载的元素上

    el.innerHTML = template;

4.数据返回后替换模板（手法比较粗糙 QAQ）

![image.png](http://upload-images.jianshu.io/upload_images/3357019-e669cbf15ce13f5d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

到这里一切看起来都是很美好，但是我们忽略了一个问题，如果你的style是这样的

![style](http://upload-images.jianshu.io/upload_images/3357019-027d5caf422e10fe.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

并且你想要render一个html，像这样

![rederHTML](http://upload-images.jianshu.io/upload_images/3357019-1d04e10ce8e8941f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

我们再试一下

![样式](http://upload-images.jianshu.io/upload_images/3357019-1d2700cad1abfac7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

咦？！我们的样式哪去了?  检查元素看看

![检查元素](http://upload-images.jianshu.io/upload_images/3357019-2bdfcf3cff67888c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

原来我们丢失一个属性，如有不懂可参考本人写的《css模块化》一文。

接下来我们继续


5.获取属性

![获取属性](http://upload-images.jianshu.io/upload_images/3357019-dceb2ab89b5a6508.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

6.重新编译模板，添加属性

![编译](http://upload-images.jianshu.io/upload_images/3357019-348f62d26c04a606.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

7.最后一步，添加监听

![监听](http://upload-images.jianshu.io/upload_images/3357019-429d7baf7a82b29d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

8.挂载自定义指令在vue上

![image.png](http://upload-images.jianshu.io/upload_images/3357019-eac99c135f16c23a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

##### 怎么用？

用法1 

![直接输入变量，全部使用默认](http://upload-images.jianshu.io/upload_images/3357019-faf94ba898fe46c8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

用法2

![使用对象，可以扩展自定义属性，包括行数和style](http://upload-images.jianshu.io/upload_images/3357019-a319f7cdc69582bd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

##### 后记

时间原因，写的比较糙，还有很多需要改进的地方，希望观众老爷多多提些建议哈
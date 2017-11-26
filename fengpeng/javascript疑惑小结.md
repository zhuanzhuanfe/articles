在学习JavaScript的过程中，你是不是也遇到过这样的情况：看比人的代码感觉看懂了，过段时间回来再看，似乎又看不懂了，自己动手去写的时候，又不知该如何下手，怎么破？俗话说：好记性不如烂笔头，看的多，写的少，容易产生一种错觉，觉得很简单。

作为新人，我来分享一些自己总结的知识点吧，也许正是你需要的呢，哈哈~~~

### 对Array.prototype.slice.call()方法的理解
在看别人代码时，发现有这么个写法：[].slice.call(arguments, 0)，这到底是什么意思呢？一步一步来揭开它神秘的面纱。


基础知识
> arrayObject.slice(start,end)

从已有的数组中返回选定的元素，返回一个新的数组，包含从 start 到 end （不包括该元素）的 arrayObject 中的元素。该方法并不会修改数组，而是返回一个子数组。
> function.call()

该方法可以特定的作用域中调用函数，可以认为是设置函数体内this对象的值，该方法需要逐个列出需要传递的参数。
> arguments对象

与数组类似（它并不是Array的实例），但是可以使用方括号语法访问每一个元素，使用length来确定传递进来多少个参数。
 
 > Array.prototype.slice.call()
 
 这个方法可以理解为：改变数组的slice方法的作用域，在特定作用域中去调用slice方法，call()方法的第二个参数表示传递给slice的参数即截取数组的起始位置。
 
 原理
 
 Array.prototype.slice.call(arguments)能将具有length属性并且key值为数字的对象转成数组。[]是Array的实例，所以可以直接使用[].slice()方法。
 ```
var obj = {0:'hello',1:'world',length:2};
console.log(Array.prototype.slice.call(obj,0));//["hello", "world"]
```
没有length属性的对象
```
var obj = {0:'hello',1:'world'};//没有length属性
console.log(Array.prototype.slice.call(obj,0));//[]
```

### JavaScript中的匿名函数遇上!发生了什么
通常，我们声明一个函数test(){},可以通过test()来调用这个函数。但是，如果我们在这个函数声明的末尾加上()，解析器是无法理解的。
 ```
 function test(){
     console.log('hello world!');
 }();//解析器是无法理解的。

```
那为什么将函数体部分用()包裹起来就可以了呢？
```
(function test(){
    console.log('hello world!');
})(); //输出hello world!
```
解释器在解释一个语句时，如果以function开头，就会理解为函数声明。而使用括号包裹定义函数体，解析器将会以函数表达式的方式去处理定义的函数，而函数表达式后面又添加了一个()就变成了一个立即执行的函数了。赋值，逻辑，甚至是逗号，各种操作符作用与之相同，都可以使得解析器将函数声明变成一个函数表达式，从而正确的调用定义函数。
```
!function () {
    console.log('hello world!');
}();//输出hello world
```
如果省略了!,会怎么样呢？
```
function() {
    console.log('hello world!');
}();
```
如果没有!,解析器就会理解为函数声明，而函数声明没有函数名则会报错。

如果有函数名，没有!会怎么样呢？
```
function f() {
 console.log('hello world!');
}();
```
会发现，加上函数名之后还是会报错，怎么理解呢？因为function f(){}函数声明会提升，相当于
```
function f(){
    console.log('hello world!');
}

 //其他代码...

(); // 这里报错。
```
骐骥一跃不能十步，驽马十驾功在不舍。希望这些总结能解决你的一些疑惑~~~多总结，多做笔记，多思考，不断踩坑，不断填坑，每天进步一点点，不断提高自己的专业技能。
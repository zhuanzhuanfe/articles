![](./images/node-java.jpeg)

# 实战系列之 Node.js 玩转 Java 
>这些年以来，Node.js的兴起，JavaScript已经从当年的“世界最被误解的语言”变成了“世界最流行的语言”。且其发展之势，从语言本身的进化，库和包的增长，工具支持的完善，star项目和领域解决方案的涌现，平台、技术栈、应用领域的扩张等诸方面来看，都是前所未见的。随着`Node.js`服务的普及，对于后端服务是Java的公司就会产生一个问题，`Node.js`如何与`Java`通讯呢？

## 今天讲什么？
我们抛开架构设计，抛开传统的`http`、`socket`、`rpc`通讯协议，我们聊一聊在`Node.js`应用里如何连接`Java API`，换句话来说就是在`Node.js`里直接写`Java`代码。
### node-java
`Node.js`想要和`Java`连接，需要一个 [node-java](https://github.com/joeferner/node-java) 模块。
#### 环境准备
- 操作系统：支持 OSX，Linux
- 运行环境（建议选择）：
	- [Nodejs LTS 版本](http://nodejs.org/) 最低要求 `6.x`
	- [java JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html) `1.8 +`
	- Liunx gcc `4.8.1 +`
	
	安装模块
	
	```sh
	$ npm install java
	```

>Liunx如果不支持 c++ 11 需要手动升级 gcc 到 gcc 4.8.） [参考地址](http://www.jianshu.com/p/eb648a89d23b)

>如果是`Mac` 提示：显示需要安装旧Java SE 6运行环境才能打开，请下载[JDK 2015](http://support.apple.com/downloads/DL1572/zh_CN/javaforosx.dmg)

## Node.js 调用 Java
### HelloWorld

- java

```java
public class HelloWorld {
  public static void main(String[] args) {
      System.out.println("Hello World!");
  }
}
```
> 输出：
> Hello World!
    
- Node.js
 
```javascript
const java = require('java')
const javaLangSystem = java.import('java.lang.System')

javaLangSystem.out.printlnSync('Hello World!')
```
> 输出：
> Hello World!

### 操作Java Map
#### java 操作 HashMap

```java
import java.util.HashMap;
import java.util.Map;

public class HashMapDemo {
  public static void main(String[] args) {
    Map<String, Object> map = new HashMap<>();
    
    map.put("name", "SunilWang");
    map.put("age", 20);
    
    String name = (String) map.get("name");
    int age = (int) map.get("age");
    
    System.out.printf("name：%s", name);
    System.out.println("");
    System.out.printf("age：%d", age);
  }
}
```
> 输出：
>name：SunilWang
>age：20
    
#### Node.js 同步调用 java HashMap

```javascript
const java = require('java')
const HashMap = java.import('java.util.HashMap')
// 同步操作
    
let hashMap = new HashMap()
    
hashMap.putSync('name', 'SunilWang')
hashMap.putSync('age', 20)
    
let name = hashMap.getSync('name')
let age = hashMap.getSync('age')
    
console.log('name', name)
console.log('age', age)
```
> 输出：
name：SunilWang
age：20

#### Node.js callback 调用 java HashMap

```javascript
const java = require('java')
const HashMap = java.import('java.util.HashMap')
// callback操作
    
let hashMap = new HashMap()
    
hashMap.put('name', 'SunilWang', (error, info) => {
  if (error) console.log('put name Error: ', error)
  hashMap.get('name', (error, name) => {
    if (error) console.log('get name Error: ', error)
    console.log('callback name：%s', name)
  })
})
```
    
> 输出：
> callback name：SunilWang

#### Node.js Promise调用 java HashMap
```javascript
const co = require('co')
const java = require('java')

// 当前配置一定要在顶部声明
java.asyncOptions = {
  syncSuffix: 'Sync', // 同步方法名后缀
  asyncSuffix: '', // 异步方法名后缀
  promiseSuffix: 'Promise', // Promise方法名后缀
  promisify: require('bluebird').promisify // 依赖Promise的模块
}

// ==============

const HashMap = java.import('java.util.HashMap')

// Promise操作
co(function * () {
  let hashMap = new HashMap()

  yield hashMap.putPromise('name', 'SunilWang')
  yield hashMap.putPromise('age', '20')

  let name = yield hashMap.getPromise('name')
  let age = yield hashMap.getPromise('age')

  console.log('name', name)
  console.log('age', age)
})
```
### 创建Java 实例两种方法
- Java

```java
import java.util.ArrayList;
import java.util.List;

public class ArrayListDemo {
  
  public static void main(String[] args) {
    List<String> list1 = new ArrayList<>();
    List<String> list2 = new ArrayList<>();
    
    list1.add("item1");
    list2.add("item1");
    
    System.out.printf("size: %d", list1.size()); //2
    System.out.println("");
    // list1 equals list2: true
    System.out.printf("list1 equals list2: %s", list1.equals(list2)); 
  }
}

```
#### newInstanceSync
```javascript
const java = require('java')

let list1 = java.newInstanceSync('java.util.ArrayList')

console.log(list1.sizeSync()) // 0
list1.addSync('item1')
console.log(list1.sizeSync()) // 1
```
#### import & new
```javascript
let ArrayList = java.import('java.util.ArrayList')
let list2 = new ArrayList()

list2.addSync('item1')

let equalValue = list2.equalsSync(list1) 
console.log(equalValue)// true
```

### 其他操作
#### 快速new 数据组
- Java

```java
public class CharArrayDemo {
  
  public static void main(String[] args) {
    char [] charArray = "hello world\n".toCharArray();
    // charArray length: 12
    System.out.printf("charArray length: %d", charArray.length);
  }
}

```

- Node.js

```javascript
let charArray = java.newArray('char', 'hello world\n'.split(''))
// [ 'h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd', '\n' ]
console.log(charArray.length) // 12
```

#### 快速new Long对象
- Java

```java
public class LongDemo {
  
  public static void main(String[] args) {
    Long num = new Long("5");
    System.out.println(num);
    System.out.println(num.longValue());
  }
}
```

- Node.js

```javascript
let javaLong = java.newInstanceSync('java.lang.Long', 5)
// Possibly truncated long value: 5
console.log('Possibly truncated long value: %d', javaLong)
// Original long value (as a string): 5
console.log('Original long value (as a string): %s', javaLong.longValue)
```

### Node.js 调用自己编译类
- Java

```java
package com.nearinfinity.nodeJava;

public class MyClass {
  public static int addNumbers(int a, int b) {
    return a + b;
  }
}
```

- Node.js

```javascript
const java = require('java')
java.classpath.push('./src')

let MyClass = java.import('com.nearinfinity.nodeJava.MyClass')

let result = MyClass.addNumbersSync(1, 2)
console.log(result)

let javaInteger = java.newInstanceSync('java.lang.Integer', 2)

// 快速调用 Java 静态类里面的方法
result = java.callStaticMethodSync('com.nearinfinity.nodeJava.MyClass', 'addNumbers', javaInteger, 3)
console.log(result)
```

## 结束语
上述方法只是带你了解`node-java`冰山一角，`node-java` API很丰富，如`jvm`，`实例一个类`，`调用类静态方法`，`快速实例化一个对象`等等。

最快的学习方式是看文档，文档地址：[node-java](https://github.com/joeferner/node-java) 。











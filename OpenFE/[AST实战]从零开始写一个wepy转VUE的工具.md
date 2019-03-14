# 为什么需要wepy转VUE #
“转转二手”是我司用wepy开发的功能与APP相似度非常高的小程序，实现了大量的功能性页面，而新业务H5项目在开发过程中有时也经常需要一些公共页面和功能，但新项目又有自己的独特点，这些页面需求重新开发成本很高，但如果把小程序代码转换成VUE就会容易的多，因此需要这样一个转换工具。

**本文将通过实战带你体验HTML、css、JavaScript的AST解析和转换过程**

**如果你看完觉得有用，请点个赞~**

# AST概览 #
AST全称是叫抽象语法树，网络上有很多对AST的概念阐述和demo，其实可以跟XML类比，目前很多流行的语言都可以通过AST解析成一颗语法树，也可以认为是一个JSON，这些语言包括且不限于：CSS、HTML、JavaScript、PHP、Java、SQL等，举一个简单的例子:
```
var a = 1;
```
这句简单的JavaScript代码通过AST将被解析成一颗“有点复杂”的语法树：

![](https://user-gold-cdn.xitu.io/2019/3/12/169715c44101532b?w=493&h=466&f=png&s=12890)

这句话从语法层面分析是一次变量声明和赋值，所以父节点是一个type为VariableDeclaration（变量声明）的类型节点，声明的内容又包括两部分，标识符：a 和 初始值：1
![](https://user-gold-cdn.xitu.io/2019/3/12/169716164545ddef?w=380&h=556&f=png&s=13681)

这就是一个简单的AST转换，你可以通过 [astexplorer](https://astexplorer.net/)可视化的测试更多代码。

# AST有什么用 #
AST可以将代码转换成JSON语法树，基于语法树可以进行代码转换、替换等很多操作，其实AST应用非常广泛，我们开发当中使用的less/sass、eslint、TypeScript等很多插件都是基于AST实现的。

本文的需求如果用文本替换的方式也可能可以实现，不过需要用到大量正则，且出错风险很高，如果用AST就能轻松完成这件事。

# AST原理 #
AST处理代码一版分为以下两个步骤：
## 词法分析 ##
词法分析会把你的代码进行大拆分，会根据你写的每一个字符进行拆分（会舍去注释、空白符等无用内容），然后把有效代码拆分成一个个token。
## 语法分析 ##
接下来AST会根据特定的“规则”把这些token加以处理和包装，这些规则每个解析器都不同，但做的事情大体相同，包括：

* 把每个token对应到解析器内置的语法规则中，比如上文提到的var a = 1；这段代码将被解析成VariableDeclaration类型。
* 根据代码本身的语法结构，将tokens组装成树状结构。

# 各种AST解析器 #
每种语言都有很多解析器，使用方式和生成的结果各不相同，开发者可以根据需要选择合适的解析器。

**JavaScript**
* 最知名的当属babylon，因为他是babel的御用解析器，一般JavaScript的AST这个库比较常用
* acron:babylon就是从这个库fork来的

**HTML**
* htmlparser2：比较常用
* parse5：不太好用，还需要配合jsdom这个类库

**CSS**
* cssom、csstree等
* less/sass

**XML**
* XmlParser

# wepy转VUE工具 #
接下来我们开始实战了，这个需求我们用到的技术有：
* node
* commander：用来写命令行相关命令调用
* fs-extra：fs类库的升级版，主要提高了node文件操作的便利性，并且提供了Promise封装
* XmlParser：解析XML
* htmlparser2：解析HTML
* less：解析css（我们所有项目统一都是less，所以直接解析less就可以了）
* babylon：解析JavaScript
* @babel/types：js的类型库，用于查找、校验、生成相应的代码树节点
* @babel/traverse：方便对JavaScript的语法树进行各种形式的遍历
* @babel/template：将你处理好的语法树打印到一个固定模板里
* @babel/generator：生成处理好的JavaScript文本内容

# 转换目标 #
我们先看一段简单的wepy和VUE的代码对比：

```
//wepy版
<template>
  <view class="userCard">
    <view class="basic">
      <view class="avatar">
        <image src="{{info.portrait}}"></image>
      </view>
      <view class="info">
        <view class="name">{{info.nickName}}</view>
        <view class="label" wx:if="{{info.label}}">
          <view class="label-text" wx:for="{{info.label}}">{{item}}</view>
        </view>
        <view class="onsale">在售宝贝{{sellingCount}}</view>
        <view class="follow " @tap="follow">{{isFollow ? '取消关注' : '关注'}}</view>
      </view>
    </view>
  </view>
</template>
<style lang="less" rel="stylesheet/less" scoped>
.userCard {
    position:relative;
    background: #FFFFFF;
    box-shadow: 0 0 10rpx 0 rgba(162,167,182,0.31);
    border-radius: 3rpx;
    padding:20rpx;
    position: relative;
}
/* css太多了，省略其他内容 */
</style>
<script>
  import wepy from 'wepy'
  export default class UserCard extends wepy.component {
      props = {
        info:{
          type:Object,
          default:{}
        }
      }
      data = {
          isFollow: false,
      }
      methods = {
        async follow() {
          await someHttpRequest()  //请求某个接口
          this.isFollow = !this.isFollow
          this.$apply()
        }
      }
      computed = {
        sellingCount(){
            return this.info.sellingCount || 1
        }
      }
      onLoad(){
        this.$log('view')
      }
  }
</script>
```
```
//VUE版
<template>
  <div class="userCard">
    <div class="basic">
      <div class="avatar">
        <img src="info.portrait"></img>
      </view>
      <view class="info">
        <view class="name">{{info.nickName}}</view>
        <view class="label" v-if="info.label">
          <view class="label-text" v-for="(item,key) in info.label">{{item}}</view>
        </view>
        <view class="onsale">在售宝贝{{sellingCount}}</view>
        <view class="follow " @click="follow">{{isFollow ? '取消关注' : '关注'}}</view>
      </view>
    </view>
  </view>
</template>
<style lang="less" rel="stylesheet/less" scoped>
.userCard {
    position:relative;
    background: #FFFFFF;
    box-shadow: 0 0 10rpx 0 rgba(162,167,182,0.31);
    border-radius: 3*@px;
    padding:20*@px;
    position: relative;
}
/* css太多了，省略其他内容 */
</style>
<script>
  export default {
      props : {
        info:{
          type:Object,
          default:{}
        }
      }
      data(){
          return {
            isFollow: false,
          }
      }
      
      methods : {
        async follow() {
          await someHttpRequest()  //请求某个接口
          this.isFollow = !this.isFollow
        }
      }
      computed : {
        sellingCount(){
            return this.info.sellingCount || 1
        }
      }
      created() {
        this.$log('view')
      }
  }
</script>
```
## 转换代码实现 ##

我们先写个读取文件的入口方法
```
const cwdPath = process.cwd()
const fse = require('fs-extra')

const convert = async function(filepath){
	let fileText = await fse.readFile(filepath, 'utf-8');
	fileHandle(fileText.toString(),filepath)
}
const fileHandle = async function(fileText,filepath){
    //dosth...
}
convert(`${cwdPath}/demo.wpy`)
```

在fileHandle函数中，我们可以得到代码的文本内容，首先我们将对其进行XML解析，把template、css、JavaScript拆分成三部分。
有同学可能问为什么不直接正则匹配出来，因为开发者的代码可能有很多风格，比如有两部分style，可能有很多意外情况是使用正则考虑不到的，这也是使用AST的意义。



```
        //首先需要完成Xml解析及路径定义：
        //初始化一个Xml解析器
        let xmlParser = new XmlParser(),  
            //解析代码内容
	    xmlParserObj = xmlParser.parse(fileText),    
	    //正则匹配产生文件名
	    filenameMatch = filepath.match(/([^\.|\/|\\]+)\.\w+$/),     
	    //如果没有名字默认为blank
	    filename = filenameMatch.length > 1 ? filenameMatch[1] : 'blank', 
	    //计算出模板文件存放目录dist的绝对地址
	    filedir = utils.createDistPath(filepath),      
	    //最终产出文件地址
	    targetFilePath = `${filedir}/${filename}.vue`
	
        //接下来创建目标目录
         try {
            fse.ensureDirSync(filedir)
         }catch (e){
            throw new Error(e)
         }

        //最后根据xml解析出来的节点类型进行不同处理
        for(let i = 0 ;i < xmlParserObj.childNodes.length;i++){
            let v = xmlParserObj.childNodes[i]
            if(v.nodeName === 'style'){
                typesHandler.style(v,filedir,filename,targetFilePath)
            }
            if(v.nodeName === 'template'){
            	typesHandler.template(v,filedir,filename,targetFilePath)
            }
            if(v.nodeName === 'script'){
            	typesHandler.script(v,filedir,filename,targetFilePath)
            }
	}
```


不同节点的处理逻辑，定义在一个叫做typesHandler的对象里面存放，接下来我们看下不同类型代码片段的处理逻辑


<u>**因篇幅有限，本文只列举一部分代码转换的目标，实际上要比这些更复杂**</u>

接下来我们对代码进行转换：


### 模板处理 ###
**转换目标**
* 模板标签转换：把view转换成div，把image标签转换成img
* 模板逻辑判断：wx:if="{{info.label}}" 转换成 v-if="info.label"
* 模板循环：wx:for="{{info.label}}" 转换成v-for="(item,key) in info.label"
* 事件绑定：@tap="follow" 转换成 @click="follow"

**核心流程**
* 首先把拿到的目标文本解析成语法树，然后进行各项转换，最后把语法树转换成文本写入到文件
```
let templateContent = v.childNodes.toString(),
    //初始化一个解析器
    templateParser = new TemplateParser()   
    
//生成语法树
templateParser.parse(templateContent).then((templateAst)=>{
    //进行上述目标的转换
    let convertedTemplate = templateConverter(templateAst)  
    //把语法树转成文本
    templateConvertedString = templateParser.astToString(convertedTemplate) 
    
    templateConvertedString = `<template>\r\n${templateConvertedString}\r\n</template>\r\n`
    fs.writeFile(targetFilePath,templateConvertedString, ()=>{
    	resolve()
    });
}).catch((e)=>{
	reject(e)
})
```
* TemplateParser是我封装的一个简单的模板AST处理类库，（因为使用了htmlparser2类库，该类库的调用方式有点麻烦），我们看下代码：
```
const Parser = require('./Parser') //基类
const htmlparser = require('htmlparser2')   //html的AST类库
class TemplateParser extends Parser {
  constructor(){
    super()
  }
  /**
   * HTML文本转AST方法
   * @param scriptText
   * @returns {Promise}
   */
  parse(scriptText){
    return new Promise((resolve, reject) => {
      //先初始化一个domHandler
      const handler = new htmlparser.DomHandler((error, dom)=>{
        if (error) {
          reject(error);
        } else {
          //在回调里拿到AST对象  
          resolve(dom);
        }
      });
      //再初始化一个解析器
      const parser = new htmlparser.Parser(handler);
      //再通过write方法进行解析
      parser.write(scriptText);
      parser.end();
    });
  }
  /**
   * AST转文本方法
   * @param ast
   * @returns {string}
   */
  astToString (ast) {
    let str = '';
    ast.forEach(item => {
      if (item.type === 'text') {
        str += item.data;
      } else if (item.type === 'tag') {
        str += '<' + item.name;
        if (item.attribs) {
          Object.keys(item.attribs).forEach(attr => {
            str += ` ${attr}="${item.attribs[attr]}"`;
          });
        }
        str += '>';
        if (item.children && item.children.length) {
          str += this.astToString(item.children);
        }
        str += `</${item.name}>`;
      }
    });
    return str;
  }
}

module.exports = TemplateParser

```
* 3、接下来我们看下具体替换过程：
```
//html标签替换规则，可以添加更多
const tagConverterConfig = {
  'view':'div',
  'image':'img'
}
//属性替换规则，也可以加入更多
const attrConverterConfig = {
  'wx:for':{
    key:'v-for',
    value:(str)=>{
      return str.replace(/{{(.*)}}/,'(item,key) in $1')
    }
  },
  'wx:if':{
    key:'v-if',
    value:(str)=>{
      return str.replace(/{{(.*)}}/,'$1')
    }
  },
  '@tap':{
    key:'@click'
  },
}
//替换入口方法
const templateConverter = function(ast){
  for(let i = 0;i<ast.length;i++){
    let node = ast[i]
    //检测到是html节点
    if(node.type === 'tag'){
      //进行标签替换  
      if(tagConverterConfig[node.name]){
        node.name = tagConverterConfig[node.name]
      }
      //进行属性替换
      let attrs = {}
      for(let k in node.attribs){
        let target = attrConverterConfig[k]
        if(target){
          //分别替换属性名和属性值
          attrs[target['key']] = target['value'] ?
                                  target['value'](node.attribs[k]) : 
                                  node.attribs[k]
        }else {
          attrs[k] = node.attribs[k]
        }
      }
      node.attribs = attrs
    }
    //因为是树状结构，所以需要进行递归
    if(node.children){
      templateConverter(node.children)
    }
  }
  return ast
}
```


### css处理 ###
**转换目标**
* 将image替换为img
* 将单位 rpx 转换成 *@px

**核心过程**

* 1、我们要先对拿到的css文本代码进行反转义处理，因为在解析xml过程中，css中的特殊符号已经被转义了，这个处理逻辑很简单，只是字符串替换逻辑，因此封装在utils工具方法里，本文不赘述。
```
let styleText = utils.deEscape(v.childNodes.toString())
```
* 2、根据节点属性中的type来判断是less还是普通css
```
if(v.attributes){
        //检测css是哪种类型
	for(let i in v.attributes){
		let attr = v.attributes[i]
		if(attr.name === 'lang'){
			type = attr.value
		}
	}
}
```
* 3、less内容的处理：使用less.render()方法可以将less转换成css；如果是css，直接对styleText进行处理就可以了
```
less.render(styleText).then((output)=>{
    //output是css内容对象
})
```
* 4、将image选择器换成img，这里也需要替换更多标签，比如text、icon、scroll-view等，篇幅原因不赘述
```
const CSSOM = require('cssom')  //css的AST解析器
const replaceTagClassName = function(replacedStyleText){
        const replaceConfig = {}
        //匹配标签选择器
        const tagReg = /[^\.|#|\-|_](\b\w+\b)/g 
        //将css文本转换为语法树
        const ast = CSSOM.parse(replacedStyleText), 
              styleRules = ast.cssRules

	if(styleRules && styleRules.length){
		//找到包含tag的className
	    styleRules.forEach(function(item){
		//可能会有 view image {...}这多级选择器
        	let tags = item.selectorText.match(tagReg) 
        	if(tags && tags.length){
        		let newName = ''
    			tags = tags.map((tag)=>{
    				tag = tag.trim()
    				if(tag === 'image')tag = 'img'
    				return tag
    			})
    			item.selectorText = tags.join(' ')
        	}
	    })
	    //使用toString方法可以把语法树转换为字符串
	    replacedStyleText = ast.toString()  
	}
	return {replacedStyleText,replaceConfig}
}
```
* 5、将rpx替换为*@px
```
replacedStyleText = replacedStyleText.replace(/([\d\s]+)rpx/g,'$1*@px')
```
* 6、将转换好的代码写入文件
```
replacedStyleText = `<style scoped>\r\n${replacedStyleText}\r\n</style>\r\n`
    
fs.writeFile(targetFilePath,replacedStyleText,{
	flag: 'a'
},()=>{
	resolve()
});
```

### JavaScript转换 ###
**转换目标**
* 去除wepy引用
* 转换成vue的对象写法
* 去除无用代码:this.$apply()
* 生命周期对应

**核心过程**

在了解如何转换之前，我们先简单了解下JavaScript转换的基本流程：

![](https://user-gold-cdn.xitu.io/2019/3/14/1697b3d310882a0e?w=539&h=305&f=png&s=77493)

借用其他作者一张图片，可以看出转换过程分为解析->转换->生成 这三个步骤。

具体如下：

* 1、先把xml节点通过toString转换成文本
```
v.childNodes.toString()
```
* 2、再进行反转义（否则会报错的哦）
```
let javascriptContent = utils.deEscape(v.childNodes.toString())
```
* 3、接下来初始化一个解析器
```
let javascriptParser = new JavascriptParser()
```
这个解析器里封装了什么呢，看代码：

```
const Parser = require('./Parser')  //基类
const babylon = require('babylon')  //AST解析器
const generate = require('@babel/generator').default
const traverse = require('@babel/traverse').default

class JavascriptParser extends Parser {
  constructor(){
    super()
  }
  /**
   * 解析前替换掉无用字符
   * @param code
   * @returns
   */
  beforeParse(code){
    return code.replace(/this\.\$apply\(\);?/gm,'').replace(/import\s+wepy\s+from\s+['"]wepy['"]/gm,'')
  }
  /**
   * 文本内容解析成AST
   * @param scriptText
   * @returns {Promise}
   */
  parse(scriptText){
    return new Promise((resolve,reject)=>{
      try {
        const scriptParsed = babylon.parse(scriptText,{
          sourceType:'module',
          plugins: [
            // "estree", //这个插件会导致解析的结果发生变化，因此去除，这本来是acron的插件
            "jsx",
            "flow",
            "doExpressions",
            "objectRestSpread",
            "exportExtensions",
            "classProperties",
            "decorators",
            "objectRestSpread",
            "asyncGenerators",
            "functionBind",
            "functionSent",
            "throwExpressions",
            "templateInvalidEscapes"
          ]
        })
        resolve(scriptParsed)
      }catch (e){
        reject(e)
      }
    })
  }

  /**
   * AST树遍历方法
   * @param astObject
   * @returns {*}
   */
  traverse(astObject){
    return traverse(astObject)
  }

  /**
   * 模板或AST对象转文本方法
   * @param astObject
   * @param code
   * @returns {*}
   */
  generate(astObject,code){
    const newScript = generate(astObject, {}, code)
    return newScript
  }
}
module.exports = JavascriptParser

```
**值得注意的是：babylon的plugins配置有很多，如何配置取决于你的代码里面使用了哪些高级语法，具体可以参见文档或者根据报错提示处理**

* 4、在解析之前可以先通过beforeParse方法去除掉一些无用代码（这些代码通常比较固定，直接通过字符串替换掉更方便）
```
javascriptContent = javascriptParser.beforeParse(javascriptContent)
```
* 5、再把文本解析成AST
```
javascriptParser.parse(javascriptContent)
```
* 6、通过AST遍历整个树，进行各种代码转换
```
let {convertedJavascript,vistors} = componentConverter(javascriptAst)
```
componentConverter是转换的方法封装，转换过程略复杂，我们先了解几个概念。

假如我们拿到了AST对象，我们需要先对他进行遍历，如何遍历呢，这样一个复杂的JSON结构如果我们用循环或者递归的方式去遍历，那无疑会非常复杂，所以我们就借助了babel里的**traverse**这个工具，文档：[babel-traverse](https://babeljs.io/docs/en/babel-traverse)。

* traverse接受两个参数：AST对象和vistor对象

* vistor就是配置遍历方式的对象

* 主要有两种：
    * 树状遍历：主要通过在节点的进入时机enter和离开exit时机进行遍历处理，进入节点之后再判断是什么类型的节点做对应的处理
```
const componentVistor = {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  },
  exit(path){
      //do sth
  }
}
```

   * 按类型遍历：traverse帮你找到对应类型的所有节点
    
```
const componentVistor = {
    FunctionDeclaration(path) {
        path.node.id.name = "x";
    }
}
```
本文代码主要使用了树状遍历的方式，代码如下：

```
const componentVistor = {
  enter(path) {
    //判断如果是类属性
    if (t.isClassProperty(path)) {
      //根据不同类属性进行不同处理，把wepy的类属性写法提取出来，放到VUE模板中
      switch (path.node.key.name){
        case 'props':
          vistors.props.handle(path.node.value)
          break;
        case 'data':
          vistors.data.handle(path.node.value)
          break;
        case 'events':
          vistors.events.handle(path.node.value)
          break;
        case 'computed':
          vistors.computed.handle(path.node.value)
          break;
        case 'components':
          vistors.components.handle(path.node.value)
          break;
        case 'watch':
          vistors.watch.handle(path.node.value)
          break;
        case 'methods':
          vistors.methods.handle(path.node.value)
          break;
        default:
          console.info(path.node.key.name)
          break;
      }
    }
    //判断如果是类方法
    if(t.isClassMethod(path)){
      if(vistors.lifeCycle.is(path)){
        vistors.lifeCycle.handle(path.node)
      }else {
        vistors.methods.handle(path.node)
      }
    }
  }
}
```
本文的各种vistor主要做一个事，把各种类属性和方法收集起来，基类代码：
```
class Vistor {
  constructor() {
    this.data = []
  }
  handle(path){
    this.save(path)
  }
  save(path){
    this.data.push(path)
  }
  getData(){
    return this.data
  }
}
module.exports = Vistor

```

这里还需要补充讲下[@babel/types](https://babeljs.io/docs/en/babel-types)这个类库，它主要是提供了JavaScript的AST中各种节点类型的检测、改造、生成方法，举例：
```
//类型检测
if(t.isClassMethod(path)){
    //如果是类方法
}
//创造一个对象节点
t.objectExpression(...)
```

**通过上面的处理，我们已经把wepy里面的各种类属性和方法收集好了，接下来我们看如何生成vue写法的代码**

* 7、把转换好的AST树放到预先定义好的template模板中
```
convertedJavascript = componentTemplateBuilder(convertedJavascript,vistors)
```
看下componentTemplateBuilder这个方法如何定义：
```
const componentTemplateBuilder = function(ast,vistors){
  const buildRequire = template(componentTemplate);
  ast = buildRequire({
    PROPS: arrayToObject(vistors.props.getData()),
    LIFECYCLE: arrayToObject(vistors.lifeCycle.getData()),
    DATA: arrayToObject(vistors.data.getData()),
    METHODS: arrayToObject(vistors.methods.getData()),
    COMPUTED: arrayToObject(vistors.computed.getData()),
    WATCH: arrayToObject(vistors.watch.getData()),
  });
  return ast
}
```
这里就用到了[@babel/template](https://babeljs.io/docs/en/babel-template)这个类库，主要作用是可以把你的代码数据组装到一个新的模板里，模板如下：

```
const componentTemplate = `
export default {
  data() {
    return DATA
  },
  
  props:PROPS,
  
  methods: METHODS,
  
  computed: COMPUTED,
  
  watch:WATCH,
  
}
`
```
<u>*生命周期需要进行对应关系处理，略复杂，本文不赘述</u>


* 8、把模板转换成文本内容并写入到文件中

```
        let codeText =  `<script>\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`
        
        fs.writeFile(targetFilePath,codeText, ()=>{
		resolve()
	});
```
这里用到了[@babel/generate](https://babeljs.io/docs/en/babel-generator)类库，主要作用是把AST语法树生成文本格式

**上述过程的代码实现总体流程**
```
const JavascriptParser = require('./lib/parser/JavascriptParser')  

//先反转义
let javascriptContent = utils.deEscape(v.childNodes.toString()),   
    //初始化一个解析器
    javascriptParser = new JavascriptParser()   
 
//去除无用代码   
javascriptContent = javascriptParser.beforeParse(javascriptContent) 
//解析成AST
javascriptParser.parse(javascriptContent).then((javascriptAst)=>{   
	//进行代码转换
	let {convertedJavascript,vistors} = componentConverter(javascriptAst)  
	//放到预先定义好的模板中
	convertedJavascript = componentTemplateBuilder(convertedJavascript,vistors)
	
        //生成文本并写入到文件
        let codeText =  `<script>\r\n${generate(convertedJavascript).code}\r\n</script>\r\n`
    
	fs.writeFile(targetFilePath,codeText, ()=>{  
		resolve()
	});
}).catch((e)=>{
	reject(e)
})
```

**上面就是wepy转VUE工具的核心代码实现流程了**

通过这个例子希望大家能了解到如何通过AST的方式进行精准的代码处理或者语法转换

# 如何做成命令行工具 #
既然我们已经实现了这个转换工具，那接下来我们希望给开发者提供一个命令行工具，主要有两个部分：
## 注册命令 ##
* 1、在项目的package.json里面配置bin部分
```
{
  "name": "@zz-vc/fancy-cli",
  "bin": {
    "fancy": "bin/fancy"
  },
  //其他配置
}
```
* 2、写好代码后，npm publish上去
* 3、开发者安装了你的插件后就可以在命令行以**fancy xxxx**的形式直接调用命令了

## 编写命令调用代码 ##
```
#!/usr/bin/env node

process.env.NODE_PATH = __dirname + '/../node_modules/'

const { resolve } = require('path')

const res = command => resolve(__dirname, './commands/', command)

const program = require('commander')

program
  .version(require('../package').version )

program
  .usage('<command>')

//注册convert命令
program
  .command('convert <componentName>')
  .description('convert a component,eg: fancy convert Tab.vue')
  .alias('c')
  .action((componentName) => {
    let fn = require(res('convert'))
    fn(componentName)
  })


program.parse(process.argv)

if(!program.args.length){
  program.help()
}
```
convert命令对应的代码：
```
const cwdPath = process.cwd()
const convert = async function(filepath){
	let fileText = await fse.readFile(filepath, 'utf-8');
	fileHandle(fileText.toString(),filepath)
}

module.exports = function(fileName){
	convert(`${cwdPath}/${fileName}`)
}

```
fileHandle这块的代码最开始已经讲过了，忘记的同学可以从头再看一遍，你就可以整个串起来这个工具的整体实现逻辑了

# 结语 #
至此本文就讲完了如何通过AST写一个wepy转VUE的命令行工具，希望对你有所收获。

**最重要的事**：
<u>我司 转转 正在招聘前端高级开发工程师数名，有兴趣来转转跟我一起搞事情的，请发简历到[zhangsuoyong@zhuanzhuan.com](mailto:zhangsuoyong@zhuanzhuan.com)</u>

**转载请注明来源及作者：张所勇@转转**
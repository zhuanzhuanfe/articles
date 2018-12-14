# GraphQL-前端开发的利剑与桥梁
## 基本概念
### GraphQL
    GraphQL 是一种用于 API 的查询语言，由Facebook开发和开源，是使用基于类型系统来执行查询的服务端运行时（类型系统由你的数据定义）。GraphQL并没有和任何特定数据库或者存储引擎绑定，而是依靠你现有的代码和数据支撑。
## 背景介绍
相信看了上面的基本概念，大家都是和我一样一脸萌萌哒。所以这里就需要介绍一下其产生的背景和原因。

在我们目前的前后端开发过程中，大部分都是以http请求服务端接口的方式完成交互过程的。在这种场景下，每当需求变化，就需要修改或创建一个新的接口去满足特定的需求。

举个栗子：
在一个商品详情页，当我们需要获取商品详情时，服务端会给前端一个接口，例如：
`https://www.example.com/getInfoById?infoId=000000。`
当前端请求接口时，会返回给一个固定格式的数据，例如：
```
｛
    data:{
        title:'商品的标题',
        content:'商品的描述内容',
        special:'商品特点',
        price:'商品价格',
        image:'商品的图片'
    }
｝
```
前端接收到数据后，进行各种相应的处理展示，最终将包含有商品标题，商品描述，商品特点，商品价格，商品图片信息的页面展示给用户。

一切看起来都很美好，直到有一天……

产品大摇大摆的走过来，轻描淡写的说道：“能不能把商品的特点去掉，加一个商品的库存，另外还需要再加一个卖家的模块进去。包含卖家的名称和头像，可以点进卖家的详情页，也不用太着急，午饭前上线就行。”

于是前后端坐在一起开始商量，前端弱弱的说：“能不能改一下你的接口，把产品不要的都去掉，产品需要的都加上”。

后端心里说，你当我傻啊，于是一边砸吧嘴一边赶忙说道：“这样改风险太大，好多数据都不在一个表，我不好查。这样，详情页那个接口我就不改了，你不显示不就完了嘛，万一哪天产品那小子的小子再想起来加上，咱俩还得忙活。库存再给你一个接口，卖家信息再给你一个接口，完美，就这么定了。”

前端还想再说什么，可后端的背影已经随着产品越走越远。

就在前端绝望之时，霹雳一声震天响，graphql闪亮登场。

在graphql模式下，假设我们的服务端部分已经部署完成，前端使用vue框架，那么前端部分的请求就可以简化为：
```
  apollo: {
    goods: {
      query() {
        return gql`{
            goods(infoId:"${this.infoId}"){
              title
              content
              price
              image
          }
        }`
      }
    },
    store: {
      query() {
        return gql`{
            store(infoId:"${this.infoId}"){
              store
          }
        }`
      }
    },
    seller: {
      query() {
        return gql`{
            seller(infoId:"${this.infoId}"){
              name
              age
          }
        }`
      }
    }
  },

```

可以看到graphql为我们定义了一种类似sql的查询语言，而这种查询语言是用于api的。和之前的数据请求处理不同，在这里，我们只要定义好需要的数据，其他的不再关心，我们就可以按需索取需要的数据。这对于我们的开发提供了更大的自由与便利，只要数据支持，我们就可以摆脱对于服务端接口的依赖，提高生产效率，赢得自由，完成前端的逆袭。

## 前后端实践
讲完了故事，我们开始讲一些实际的干货。
对于graphql，网上已经有很多实践经验，以下部分是在参考完成实践经验并自我实践后给出的总结归纳。

### 服务端

服务端的技术选型，我们使用了eggjs框架，配合egg-graphqlegg-graphql插件完成。

##### 1.安装依赖包
```
$ npm install --save egg-graphql
```
##### 2.开启插件
```
// config/plugin.js
exports.graphql = {
  enable: true,
  package: 'egg-graphql',
}; 
//开启 cros 跨域访问
exports.cors = { enable: true, package: 'egg-cors' }
```
##### 3.配置graphql路由和跨域
```
//config/config.default.js
// graphql路由
config.graphql = {
router: '/graphql',
// 是否加载到 app 上，默认开启
app: true,
// 是否加载到 agent 上，默认关闭
agent: false,
// 是否加载开发者工具 graphiql, 默认开启。路由同 router 字段。使用浏览器打开该可见。
graphiql: true,
// graphQL 路由前的拦截器
onPreGraphQL: function*(ctx) {},
// 开发工具 graphiQL 路由前的拦截器，建议用于做权限操作(如只提供开发者使用)
onPreGraphiQL: function*(ctx) {},
}
// cors跨域
config.cors = {    
    origin: '*',    
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS'
}
```
##### 4.开启graphql中间件
```
//config/config.default.js
exports.middleware = [ 'graphql' ];
```
项目配置告于段落。

##### 5.编写业务员代码

下面开始写代码。
目录结构如下：
```

├── app
│   ├── graphql                          //graphql 代码，所有和graphql相关的代码都在这里，已经在前面做好了配置
│   │    └── common                   //通用类型定义，graphql有一套自己的系统类型，除此之外还可以自定义
│   │     |    |── scalars                 //自定义类型定义
│   │     |    |  └──  date.js            // 日期类型实现
│   │     |   └── resolver.js            //合并所有全局类型定义
│   │     |   └── schema.graphql     // schema 定义
│   │    └──goods                       // 商品详情的graphql模型
│   │         └── connector.js         //连接数据服务
│   │         └── resolver.js            //类型实现，和goods中schema.graphql定义的模型相对应，是其具体的实现
│   │         └── schema.graphql    //schema 定义，在这里定义商品详情数据对象
│   │    └──store                        // 库存的graphql模型
│   │         └── connector.js         //连接数据服务
│   │         └── resolver.js            //类型实现
│   │         └── schema.graphql    //schema 定义，在这里定义商品详情数据对象
│   │    └──seller                       // 卖家信息的graphql模型
│   │         └── connector.js         //连接数据服务
│   │         └── resolver.js            //类型实现
│   │         └── schema.graphql    //schema 定义，在这里定义商品详情数据对象
│   │    └──query                       // 所有的查询都会经过这里，这里是一个总的入口
│   │         └── schema.graphql    //schema 定义
│   ├── service
│   │   └── goods.js                    //商品详情的具体实现
│   │   └── store.js                     //库存的具体业务逻辑
│   │   └── seller.js                     //卖家信息的具体业务逻辑
│   └── router.js
```
app/graphql/query/schema.graphql是整个graphql查询的总入口，所有需要查询的对象都要在这里定义。它的定义形式如下：
```
#定义查询对象，在graphql里的注释使用#号
type Query {
goods(
  #查询条件，相当于接口的入参商品id
  infoId: ID!
):Goods #Goods是在app/graphql/goods/schema.graphql中定义的商品详情
}
```
在总入口中涉及到的查询对象，都需要在graphql文件夹下建立相应的文件夹，如上文中提到的goods，就在app/graphql文件夹中存在相应的goods文件夹。goods文件夹包含三个部分：schema.graphql，resolve.js和connector.js。
schema.graphql中需要定义总入口中提及的Goods对象：
```
# 商品
type Goods {
# 流水号
infoId: ID!
# 商品标题
title:String!,
# 商品内容
content:'String!,
#商品特点
special:'String!,
#商品价格
price:'nt!,
#商品图片
image:'String!,
}
```
graphql自带一组默认标量类型，包括Int，Float，String，Boolean，ID。在定义字段时需要注明类型，这也是graphql的特点之一，是支持强类型的。如果非空，就在类型后面跟上一个!号。graphql还包括枚举类型，列表和自定义类型，具体可以查看相关文档。

resolve.js是数据类型的具体实现，依赖connector.js完成：
```
'use strict'
module.exports = {
  Query: {
        goods(root, {infoId}, ctx) {
        return ctx.connector.goods.fetchById(infoId)
  }
}
```
connector.js是连接数据的具体实现，可以使用dataloader来降低数据访问频次，提高性能：
```
'use strict'
//引入dataloader，是由facebook推出，能大幅降低数据库的访问频次，经常在Graphql场景中使用
const DataLoader = require('dataloader')
class GoodsConnector {
    constructor(ctx) {  
        this.ctx = ctx  
        this.loader = new DataLoader(id=>this.fetch(id))
    }
    fetch(id) {  
        const goods = this.ctx.service.goods  
        return new Promise(function(resolve, reject) {    
            const goodsInfo = goods.getInfoById(id)    
            resolve([goodsInfo])  //注意这里需要返回数组形式
        })
    }
    fetchById(id) {  
        return this.loader.load(id)
    }
}
module.exports = GoodsConnector
```

上面代码中涉及的this.ctx.service.goods就是app/service文件夹下的goods.js文件导出的方法对象，也就是获取数据的具体业务逻辑：
```
const Service = require('egg').Service
const {createAPI} = require('../util/request')//实现的http请求
class GoodsService extends Service {
// 获取商品详情
    async getInfoById(infoId) {
        const result = await createAPI(this, 'example/getInfoById', 'get', {infoId})
        return result
    }
}
module.exports = GoodsService

```
获取数据可以用你能实现的任何方式，可以直接从数据库获取，也可以用http从现有的接口获取。
这样一个使用egg框架实现的graphql服务就完成了。
下面说一下前端。

### 前端

技术选型我们会使用vue配合Apollo完成前端


##### 1 安装依赖包

```
npm install --save vue-apollo apollo-client
```

##### 2.引用apollo

```
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import VueApollo from 'vue-apollo'

```

##### 3.配置链接
```
const httpLink = new HttpLink({
  // 需要配置一个绝对路径
  uri: 'http://exzample.com/graphql',
})
```
##### 4.创建ApolloClient实例和PROVIDER
```
// Create the apollo client
const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
})
const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})
```

##### 4.在vue中引入使用
```
Vue.use(VueApollo);
```
##### 5.根实例引用
```
    var vm = new Vue({
      el: '#app',
      provide: apolloProvider.provide(),
      router,
      components: {
        app: App
      },
      render: createEle => createEle('app')
    })
```
##### 6.使用
```
<script>
import gql from "graphql-tag"; 
export default { 
    data() { 
        return {
            goods:｛｝,
            infoId:123123
        }; 
    }, 
    apollo: { 
        goods: {
            query() {
                return gql`{
                    goods(infoId:"${this.infoId}"){
                        title
                        content
                        price
                        image
                    }
                }`
            }
        },
     }
 }; 
 </script>
```

## 展望

graphql对于目前接口数量多，难维护，扩展成本高，数据格式不可预知，文档难维护等问题给出了一个相对完善的方案，相信在未来，它将是我们工作中不可或缺的一部分。
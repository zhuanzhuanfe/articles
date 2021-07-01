Sentry 为一套开源的应用监控和错误追踪的解决方案。这套解决方案由对应各种语言的 SDK 和一套庞大的数据后台服务组成。应用需要通过与之绑定的 token 接入 Sentry SDK 完成数据上报的配置。通过 Sentry SDK 的配置，还可以上报错误关联的版本信息、发布环境。同时 Sentry SDK 会自动捕捉异常发生前的相关操作，便于后续异常追踪。异常数据上报到数据服务之后，会通过过滤、关键信息提取、归纳展示在数据后台的 Web 界面中。

转转使用Sentry监控前端错误已经有好几年了。我们在SDK端封装的统一的 `@zz-common/sentry` 库。从而实现了vue、react、小程序、node、ssr的统一接入和错误分级管理。可以参考文章：[转转商业前端错误监控系统(Sentry)策略升级](https://mp.weixin.qq.com/s?__biz=MzU0OTExNzYwNg==&mid=2247484793&idx=1&sn=a8949c19eaa1d42e155b3c318f95b23d&chksm=fbb58eb0ccc207a6249404465ebdb6bd7e5ca127098f057eea543bdc7cf87b0a8121954884b4&mpshare=1&scene=1&srcid=&sharer_sharetime=1577419408674&sharer_shareid=2ffb899af29757cd77958f17431b5436#rd)。之前我们使用的Sentry是源码安装的老版本。后来客户端需要接入Sentry并上传mapping文件。但是老版本的Sentry总是上传失败。所以我们就准备升级一下Sentry。本文就是用来记录 Sentry 升级部署和遇到的问题。

## 部署 Sentry 服务

快速的部署 Sentry 服务，官方提供了基于Docker的Compose。Docker 用来构建和容器化应用的开源容器化技术。 Compose 是用于配置和运行多 Docker 应用的工具，可以通过一个配置文件配置应用的所有服务，并一键创建和运行这些服务。

部署配置要求：

- Docker 19.03.6+
- Compose 1.24.1+
- 4 CPU Cores
- 8 GB RAM
- 20 GB Free Disk Space


#### 安装docker


``` bash
yum install docker -y

# 查看版本信息

docker info
或者
docker -v

```

#### docker 镜像加速：

``` bash
vim /etc/docker/daemon.json

{
  "registry-mirrors": [
    "https://registry.docker-cn.com",				//国内官方镜像
	"https://mirrors.tuna.tsinghua.edu.cn",			//清华镜像
	"http://hub-mirror.c.163.com",				//网易163镜像
	"https://docker.mirrors.ustc.edu.cn",			//中科大镜像
  ]
}

# 重启docker

sudo systemctl daemon-reload

sudo systemctl restart docker

```

#### 安装docker-compose


``` bash
wget -O /usr/local/bin/docker-compose https://github.com/docker/compose/releases/download/1.27.3/docker-compose-Linux-x86_64

chmod 777 /usr/local/bin/docker-compose

# 查看docker-compose 版本

docker-compose version   

```

#### 克隆源代码到安装目录：


``` bash
git clone https://github.com/getsentry/onpremise.git

# 切换需要安装的分支

git checkout 21.4.1

```


#### 运行部署脚本：


``` bash
cd onpremise

./install.sh
```

#### 启动服务


``` bash
docker-compose up -d
```

#### Sentry服务作用

通过docker ps命令，我们可以看到Sentry启动的很多服务

- redis
- kafka
- clickhouse 
- zookeeper
- postgres 
- memcached
- stmp   
- sentry-cron  
- sentry-worker  
- sentry-web  
- nginx 

Sentry的整体的运行流程如下图：

![image](https://pic3.zhuanstatic.com/zhuanzh/04bb3d3b-cb7b-4dab-81e8-ad1207b8f9f2.png)

#### 配置文件

onpremise 部署之后的主要配置文件


- config.yml：配置文件
- sentry.conf.py：为 python 代码，覆盖或合并至 sentry 服务中，从而影响 sentry 运行。
- .env：镜像版本、数据保留天数、端口等配置


## 升级Sentry 服务

新的服务已经安装完成，现在需要把旧的数据迁移到新的服务上面来。之前的服务是使用的单独的postgres集群。

#### 修改数据库配置

通过修改sentry.conf.py文件，把数据库配置到独立的集群

``` bash
DATABASES = {
    'default': {
        'ENGINE': 'sentry.db.postgres',
        'NAME': 'sentry',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'HOST',
        'PORT': '7001',
        'AUTOCOMMIT': True,
        'ATOMIC_REQUESTS': False,
    }
}
```

#### 运行升级命令

sentry提供了升级命令，一键升级数据库到对应的新版本，但是需要注意之前的版本需要是9.1.2之上。如果小于9.1.2是不兼容的。只能通过命令把用户和项目数据导出。放弃之前的错误信息。

``` bash
docker-compose run --rm web upgrade
```


## 升级遇到的问题

#### 磁盘占用过大的问题


随着数据的上报，服务器本地的磁盘占用会越来越大， Sentry 默认的配置保留 90 天来说，全量接入后磁盘占用会维持在一个比较大的值，同时这么大的数据量对数据的查询也是一个负担。为了减轻负担，需要从服务端和业务应用端同时入手。综合考虑我们将数据保留时长改为 7 天。修改 .env 文件即可：


``` bash
SENTRY_EVENT_RETENTION_DAYS=7
```

同时需要修改docker 数据存储位置修改。docker volume 默认挂载在 /var 目录下，我们的 /var 目录容量只有100G，随着服务的运行会很快占满，需要对 docker volume 挂载目录进行修改。


``` bash
# 在容量最大的目录下创建文件夹

mkdir -p /opt/var/lib

# 停止 docker 服务

systemctl stop docker

# 迁移数据

/bin/cp -a /var/lib/docker /opt/var/lib/docker && rm -rf /var/lib/docker &&  ln -s /opt/var/lib/docker /var/lib/docker

# 重启 docker 服务

systemctl start docker

```


#### 用户数量丢失

升级之后用户数量获取失败，也就是Sentry服务获取不到真实的IP。

在Sentry的管理后台中默认会关闭获取IP，需要手动的打开。

![image](https://pic6.zhuanstatic.com/zhuanzh/654be584-1460-484a-a50d-c87b2cfbd111.png)

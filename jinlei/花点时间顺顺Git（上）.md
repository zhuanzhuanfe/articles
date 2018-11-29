# 花点时间顺顺Git（上）

为了让你们点进来贼努力的想了一个色彩斑斓大吉大利的标题，好，看正文

历史：Linus的作者创建了开源的Linux，02年以前代码管理都依赖手动合并，后来管理不了了，拒绝SVN和CVS这些中央式版本控制的工具(原因如下表格)，采用免费授权给Linux社区的BitKeeper工具，再后来05年社区的大牛要破解BitKeeper被人家公司发现要收回BitKeeper对Linux的免费的使用权，Linus一口气两周内用C写了一个分布式的版本控制系统——Git。接着08年GitHub问世，利用Git为无数开源项目提供代码的托管存储

分布式版本控制系统：Git,BitKeeper

集中式版本控制系统：CVS,SVN

差别：

|    |      集中式（SVN）      |  分布式（Git） |
|----------|:-------------:|------:|
|代码保存|项目要开发完推送给中央服务器。|开发人员在本地仓库存储提交代码修改的历史|
| 网络 |必须要联网才能工作，文件过大或者网速不好会很慢甚至失败。|没有网络的情况下也可以在本地仓库执行commit、查看版本提交记录、以及分支操作，在有网络的情况下执行 push到Remote Repository远端仓库。
|文件存储格式|按照原始文件存储，体积较大|按照元数据方式存储，体积很小|
|版本号|有|无|
|分支操作的影响|创建新的分支则所有的人都会拥有和你一样的分支，本质上是因为都在中央仓库上操作|分支操作不会影响其他开发人员|
|提交|提交的文件会直接记录到中央版本库|提交是本地操作，需要执行push操作才会到远端仓库|


*特别注意，分布式版本控制系统的远端仓库，有时候也被叫“中央服务器”，不同于集中式的中央服务器，分布式中它可以理解成一个中转站，用来协作同步各个本地仓库的代码，实际上任何一个服务器都可以取代它的作用，只是为了方便大家“交换”代码*


## clone远程仓库、创建本地仓库

#### 涉及到的命令：git clone/ git init/ git remote add origin ####

![](https://i.imgur.com/Zuiwd3o.png)

	git clone https://github.com/****.git 

clone项目到本地之后，我们可以看到目录下有一个叫.git的隐藏文件
![](https://i.imgur.com/L3aCJHm.png)

这个.git文件夹就是我们的本地仓库（Local Repository）.git文件夹所在的根目录就是我们的工作目录（Working Directory）

clone下来的项目我们就可以正常开发了，当然我们也可以在本地直接创建一个本地仓库，之后再与远程创建的仓库进行关联，先执行

	git init
命令执行的目录下就有了一个.git文件夹，我们在创建了一个本地仓库，接着与远程仓库进行关联：

	git remote add origin https://github.com/****.git 

## 工作目录 暂存区 版本库 远程仓库

#### 涉及到的命令：git diff ####

全文会频繁提到的几个关键词，可以先跳过，看到的时候回来看可能理解的更好~

**工作目录（working directory）**就是我们创建的项目文件夹，我们开发项目的地方，.git所在根目录

	新创建的文件要添加到暂存区——git add

**暂存区（index/staging area）**是指储存了所有待提交的改动的地方，只有在暂存区存在的文件，本地仓库才会追踪到它的变化。

*暂存区对应在.git文件夹中的index中，是一个二进制文件，可以理解为一个索引，内容包括根据文件名，文件模式和元数据进行排序的文件路径列表，每个路径都有权限以及Blob类型的SHA-1标识符（就是我们平时提交记录对应的那一串编码，下面会讲到）*

	把文件从暂存区提交到本地的版本库中——git commit

**版本库/本地仓库**（Repository）可以理解为就是我们分布式版本控制中提到的我们本地的代码版本库，这里面有我们所有提交版本版本的数据。

*对应.git中的HEAD,实质上是一个指针，指向最新放入仓库的版本，默认情况下git为我们自动生了一个分支master，head就指向这个分支*

**远程仓库**（Remote）托管代码的服务器，上面介绍分布式版本控制中的远程中央仓库，可以理解为一台专门用于协作开发时数据交换的电脑。

贴一张大牛的图：

![](https://i.imgur.com/zvqcgU2.png)

![](https://i.imgur.com/aQJUczH.png)

#### git diff ####

	git diff 比较的是工作区和暂存区的差别
	git diff HEAD 可以查看工作区和版本库的差别
	git diff --cached(===staged) 比较的是暂存区和版本库的差别

## 一个简单的流程

#### 涉及到的命令：git status/ git add/ git commit/ git log/ git pull /git push ####

#### git status ####

创建一个文件夹，添加新的文件

	git status //查看工作目录和暂存区的状态

![](https://i.imgur.com/svSfUqC.png)

untracked files表示未追踪的文件，就是新创建的src文件夹，未追踪的意思就是当前本地git仓库对它没有任何的记录，对本地仓库来说是不存在的，在我们提交代码的时候也不会提交上去，这时就用到了add命令

#### git add ####

	git add 文件 //将新创建的文件添加到暂存区

执行之后没有任何提示，执行git status看下当前本地仓库的状态：

![](https://i.imgur.com/mqpxIDh.png)

新添加的文件进入暂存区，从untracked未跟踪状态变为stage已暂存状态。接着文件进入暂存区之后，我们的修改就都可以被暂存区追踪到，我们修改一下新增加文件夹下面的test.js文件

![](https://i.imgur.com/iDWdbGg.png)

这次文件左边的状态从New file（新建）变成了modified（修改），上面的提示不再是untracked（不在追踪范围）而是not staged for commit（还不在待提交的暂存区中）。意思就是，本地仓库现在已经认识了这个文件，它被修改了，还没到储存待提交信息的暂存区中，还是使用add添加到暂存区：

	git add 文件名 //把工作目录的改动添加到暂存区

查看下工作目录和暂存区当前文件的状态

![](https://i.imgur.com/bcxUsf5.png)

注意，通过 add 添加进暂存区的不是文件名，而是具体的文件改动内容（上面创建文件那里说添加文件是方便理解），我们把在执行add时的改动都被添加进了暂存区，在add 之后的新改动并不会自动被添加进暂存区。所以对test.js执行了add之后如果再修改test.js，那么工作目录和暂存区都会有这个文件

![](https://i.imgur.com/k9Uu1UA.png)

#### git commit ####

接着按照提示，可以commit提交了：

	git commit //将暂存区文件提交到本地版本库中

输入git commit回车之后，因为commit需要编辑提交信息，所以会默认进入vim命令编辑模式，这时我们输入小写的i可以切换到插入模式，然后输入这次提交的备注信息，输入完后，按ESC返回命令模式，输入ZZ或者wq保存，一次commit提交就完成了。

#### git log ####

	git log //查看提交历史

![](https://i.imgur.com/p4wItGH.png)

	git log -p //查看每个commit的每一行改动

	git log --stat //查看文件修改，不展示具体内部修改细节

#### git show ####

	git show commit的编码 //查看该commit具体的改动

要看最新 commit ，直接输入 git show ；要看指定 commit ，输入 git show commit的引用（例如HEAD）或它的SHA-1编码
	
#### git push ####

	git push //将本地仓库推送到远程仓库

![](https://i.imgur.com/ICbt9CL.png)

直接使用push会有这样的提示。意思是当前分支没有和上游远程分支做关联，git不知道你要推送到远程仓库的哪个分支上，我们想要和远程的master分支关联，按照提示输入：

![](https://i.imgur.com/hQanMfS.png)

origin是远程仓库的代指，master是远程仓库上的分支名，这里的origin/master，即远程仓库的master分支，就是我们实验项目的远程仓库。我们把关联的远程分支设置成了origin/master，之后直接执行git push默认就会推到远程的master下，当然我们不省略传入远程的分支名就会推送到对应的分支上。

特别注意，如果你使用的不是clone而是直接本地init一个仓库与远程仓库关联的方式，第一次推送可能会遇到这个情况：

![](https://i.imgur.com/HRg2Ciz.png)

这是因为在远程仓库上创建新的项目时勾选了自动生成readme/.gitignore，它们就作为远程仓库的第一次commit，而我们本地git init的仓库没有远程仓库的readme/.gitignore文件，所以无法提交成功。所以要先拉取一下远端的代码同步到本地，再把我们的改动提交上去。先pull再push。当然如果你创建远程仓库时不勾选readme/.gitignore就可以直接push上去

但是光执行pull也是不够的，远程仓库有一个提交，我们本地仓库也有一个提交，直接拉取远端的代码，这两个提交谁先谁后呢？没有操作相同文件时可能无所谓，但是一旦都修改了同一个文件，就涉及到哪次提交在后，覆盖的问题，所以要执行：

	git pull --rebase origin master

这条指令的意思是把远程库中的更新合并到本地库中，–rebase的作用是取消掉本地库中刚刚的commit，并把他们接到更新后的版本库之中，rebase具体下面会讲到，先看下结果

![](https://i.imgur.com/BXdpIpm.png)

接着push代码到远端仓库（orgin)的master就成功了

![](https://i.imgur.com/mKBAmO7.png)

看下提交记录

![](https://i.imgur.com/q7JdSK7.png)

远程仓库的initial commit是第一条记录，我们刚提交的在后面


## commit信息历史

#### 涉及到的命令：git log####

![](https://i.imgur.com/ORGPyna.png)

#### commit的id ####

每一个commit对应一个唯一id，是40为的数字和字符组成的字符串，是属于每一个commit的一个id，一个SHA-1校验和

![](https://i.imgur.com/M86R3KZ.png)

第一行，tree和对应的hash值，根据这个hash值我们可以得到本次提交的整个目录树和对应的hash值

	git cat-file -p hash值 //-p 以更优雅的方式展现对象内容

![](https://i.imgur.com/7u4xnU4.png)

里面的每一个文件都可以根据hash继续展开 直到叶子结点。

回到head信息组成这里，第二行parent，是当前查看的commit的上一条commit的id；第三行作者信息以及提交时的时间戳；第四行提交者的信息以及提交时的时间戳。

根据head对应的提交信息生成其sha-1值的命令如下：

	(printf "commit %s\0" $(git cat-file commit HEAD | wc -c); git cat-file commit HEAD) | shasum

![](https://i.imgur.com/poghrAD.png)

#### HEAD ####

commit记录后面括号对应着指向这个commit的引用，注意到commit提交信息第一条后面的括号里的HEAD，它永远指向当前的commit，就是当前工作目录对应的提交的commit。

HEAD同时也指向一个分支，图中的HEAD——>master，表示当前工作目录对应的是本地master分支


通常每次有一条新的commit记录时，工作目录会与这条最新的commit对应，HEAD指针也会指向它（在使用checkout reset等操作切换当前工作目录对应的commit时，HEAD也会跟过去，后面会说）

![](https://i.imgur.com/DyTrf89.png)

如图，我们commit了最新的提交信息还没push到远端时，本地的HEAD指向我们最新的提交，而远端仓库的还停留在之前的那条commit记录，origin/master指向它。

在我们push操作的时候，HEAD并不会推送到远端，远端的HEAD永远指向默认分支master

#### master分支 ####

一个没有提交记录的新项目，在创建第一条commit时，会默认提交到master分支，同时HEAD也指向它。

在我们clone远端项目时，默认也会在本地checkout出一个master分支，并将本地工作目录的文件内容保持与clone下来的项目的master分支的最新commit一致，HEAD也会指向它。

绝大多数团队会选择master作为核心的分支，其余分支都是围绕master来开发，但本质上各个分支都是一样的，都是一串commit信息的记录。

commit信息这里就粗略的说到这吧。接下来接着说说branch


## branch分支创建和切换

#### 涉及到的命令：git branch/git checkout/git checkout -b/git branch -d####

	git branch 新的分支名//创建分支

这样创建完新的分支，并不会自动切换到新的分支上

	git checkout 分支名 //切换分支

以上两部可以合并
	
	git checkout -b 新的分支名 //创建并切换到新的分支

![](https://i.imgur.com/626TlIc.png)

切换到新的分之后，HEAD也跟着指了过去，当当前新分支有新的commit时，HEAD会指向这个分支最新的commit，master会停留在它之前对应的commit记录那里，因为那是属于master分支最新的commit记录。

	git branch -d 分支名 //删除分支

需要注意，HEAD指向的分支无法删除，也就是我们所在的分支，需要先checkout切换到别的分支，再去删除之前的分支。

我们删除了一个分支后，并不会删除这个分支上的提交记录，其实branch这个分支的概念，更确切的说是一个引用，是一个指向，指向一串的提交记录，我们删除了分之后只是删除了对这个分支包含的提交记录的一个引用，虽然说我们没有删除它们，但是Git的回收机制会定期清理那些不在任何分支上的commit记录。

## merge 合并冲突

#### 涉及到的命令：git merge/git merge --abort####

merge意思为合并，把目标分支合并到当前分支，一般在我们分支协作开发，某一分支的开发完成可以合并如主流程的时候，这样去操作。

实际的行为是，从当前分支和要合并的目标分支的分叉点开始，将目标分支路径上的所有commit内容应用到当的commit，并生成一个新的commit

我们在本地master分支上执行

	git merge feature1

将feature1分支上的两个commit记录4和5与本地分支上最新的commit3合并并生成了一个新的commit，如图中的6

![](https://i.imgur.com/KnXDi3M.png)

#### 冲突解决 ####

合并操作时，通常情况下git会帮我们自动合并两个分支上的改动，包括不同文件或者同一文件的不同位置的修改，但既然是分支开发，免不了同时修改了相同文件的同一个内容的情况，这时候就需要冲突合并。

例如我从上图2的位置新建了分支feature1，commit4和5修改了src/test.js文件，同时在master分支的commit3中也修改了src/test.js文件，这时我在master上merge远端的分支feature1

![](https://i.imgur.com/rga9eCt.png)

src/test.js出现了 "merge conflict"合并冲突，自动合并失败，要求 "fix conflicts and then commit the result"把冲突解决掉后提交。

**手动解决：**

我们可以选择手动解决一下，打开文件，把不需要的分支的内容删掉（包括===》这些符号！），然后重新提交这个冲突文件即可

![](https://i.imgur.com/jTolQjO.png)

**放弃合并，撤销merge操作：**

	git merge --abort //取消merge操作

执行之后回去看冲突文件，就变回了merge之前的状态。

如果当前分支的所有提交另一个分支都包含，就是在上图2的位置合并feature1的内容，这时其实commit记录也就还是一条线，1245，所以把本地的HEAD和分支（例子中是master）也指向feature1的最新commit记录5就可以了。

在遇到冲突时，git并不会自动为我们生成一个commit记录，而是我们修改完后自己去提交这个记录，例如上面冲突修改之后直接commit再push，在远端仓库我们看到的记录是：

![](https://i.imgur.com/eEkyV1Q.png)

而如果没有冲突，我们一次执行merge，status看下工作区，再push到远端仓库：

![](https://i.imgur.com/MoTmMwu.png)

我们看下远端仓库的提交记录：

![](https://i.imgur.com/cbLHCyV.png)

当**我们所在分支落后于目标分支**时（目标分支包含当前分支所有的提交记录），在当前分支对目标分支执行merge，就是直接把HEAD和所在分支都指向目标分支最新的commit，也成为fast-forward快速前移

例如我们现在从master新建一个分支feature4，并修改了一些内容，有两次提交记录，期间master没有新的提交，一直停留在分叉点，然后我们回到master去merge分支feature4,这时feature4是包括我们所在分支的所有记录，领先于我们所在分支的，执行以下操作

![](https://i.imgur.com/hwUaoXO.png)

可以看到feature4领先的两个提交都被master拿到，接着push到远端master，远端master上的提交记录就多了两条feature4的提交记录

当**我们所在分支领先于目标分支**时（当前分支包含目标分支所有的提交记录），这种时候，merge相当于空操作

当然，我们也可以通过命令修改默认生成的提交的信息，也可以不默认生成新的commit，这里只是简单介绍常用命令的基本用法，merge详细的使用可以看下：

[https://blog.csdn.net/andyzhaojianhui/article/details/78072143](https://blog.csdn.net/andyzhaojianhui/article/details/78072143 "git merge-快进合并和非快进合并")

## rebase 避免出现分支的合并

#### 涉及到的命令：git rebase####

通过merge来协作开发，历史记录会出现很多分支，如果想避免这样导致过乱，可是采用rebase命令。

	git rebase 目标分支

假设我们现在需要将feature1的记录合并到master，并且丢弃现在有的分叉，执行

	git checkout feature1 //先切换到需要被合并的分支feature1上
	git rebase master //向要合进去的分支master发出rebase命令

实际上是我们需要被合并的分支feature1，将其分叉点2重新设置为要被合进的目标分支master的最新commit3上，4和5的基础点从2变成了3，同时我们所在的分支的最新一条记录和HEAD都对应到合并后的最新的commit记录7上

![](https://i.imgur.com/48ABCrT.png)

![](https://i.imgur.com/O51gule.png)

4和5因为没有分支引用指向它，之后会被Git回收机制清除。

然后，我们回到master上对feature1执行一次merge，回忆下上面讲的fast-forward，如果所在分支包含要merge分支的commit信息，我们就只是把HEAD和对应分支向后移动，指向最新的commit，也就是master和HEAD都指向7

#### 为什么不在master上执行rebase呢？ ####

在我们分支开发的时候，通常都是以master以核心的分支，如果我们在master上对feature1执行rebase，那么3和6就夫指出新的接在5后面，3和6这两个commit在我们核心分支所包含的路径中不存在了，现在的master是124567，这样协作开发的其余同事在push代码时，因为他们本地有3和6而远端master没有3和6，就是提交失败（具体原因开篇readme和.gitignore那里同理）


关于rebase，只要记住，它是修改需要**被合并**的分支的基础点，同时与merge相反，需要在**被合并**的分支上操作的指令

突然的结尾
- 
.......

抱歉又写多了，认真随意的在这里加个分割线，分个上下系列吧= =

下就是接着简单讲讲我们常用的指令，一得之见，还请大家多多指教

快看看坐没坐过站啊朋友们....〒▽〒
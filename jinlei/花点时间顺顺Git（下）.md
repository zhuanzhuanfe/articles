### 进入正文前插个楼，因为vim的操作下面会频繁用到
------
#### vim的操作 ####

1.输入i进入插入模式，对上一条commit信息的内容进行修改

2.按下ESC键，退出编辑模式，切换到命令模式。 

3.保存修改并且退出 vim："ZZ"或者":wq" 

4.保存文件，不退出vim：":w"

5.放弃修改并退出vim：":q!"

6.放弃所有文件修改，但不退出 vim：":e!"

-----

正文，接文章（上）...

## 修改被rebase分支的历史记录

#### 涉及到的命令： rebase -i /git rebase --continue /git rebase --abort ####

接着上，我们继续说下这个rebase。如果我们想在rebase的过程中对一部分提commit交进行修改，可以在'git rebase'命令中加入'-i'或'--interactive'参数去调用交互模式

假设我们要将feature1上的commit记录的基础点重设为master分支的最后一条，同时希望修改我们接到master后面的feature1上的提交信息。

看下feature1上的commit记录，倒数第三条是master上的提交，那次提交便是feature1在master上的基础点：

![](https://i.imgur.com/9lsjZUW.png)

我们在feature1上执行：

	git rebase -i master

![](https://i.imgur.com/EA5FyoG.png)

接着我们进入了编辑页面，顶部列出了将要「被 rebase」的所有 commit记录，也就是我们从master分支checkout出feature1分支后的两条提交记录。这个排列是正序的，和log显示的顺序相反

![](https://i.imgur.com/jeFkfDS.png)

pick的意思是直接应用，我们如果要修改某次的提交信息，需要把提交信息修改成edit，这样在应用到这条commit记录时，Git会停下来让我们修正，假设我们要对这两条commit提交信息分别修改，在vim下讲两个pick改成eidt，然后输入"：wq!保存并退出"

![](https://i.imgur.com/dtgDi42.png)

这里Git在执行到"feature1 first commit"便停了下来，提示我们可以通过amend来修改这条commit记录，amend就是用来修改HEAD所指向的这条最新记录，这个具体下面会讲。我们输入git commit --amend，然后进入编辑页面修改上条commit信息，保存：

![](https://i.imgur.com/eIlqrDy.png)

	git rebase --continue 继续执行rebase
	git rebase --abort 退出rebase过程

![](https://i.imgur.com/rB7Iq82.png)

![](https://i.imgur.com/hwOGiGi.png)


这次我们停在了第二条我们要edit的commit记录，同上面的操作

![](https://i.imgur.com/O3F0TjH.png)

执行成功后，log看下commit记录：

![](https://i.imgur.com/GQyiAaj.png)

修改成功。

#### 修改当前分支的历史记录

对历史commit记录修改的功能，不仅适用在需要合分支的时候，我们也可以在当前分支进行原地操作，直接对当前分支历史错误的提交记录进行修改。

![](https://i.imgur.com/TdsQZlI.png)

提交信息多了个t，假设我们要对这条commit记录进行更改，执行：

	git rebase -i HEAD^^^ //也可以是HEAD~3

Git 中有两个「偏移符号」： ^ 和 ~，插楼说下

-----

**^ 的用法**：表示对当前指针指向的commit记录向前偏移，偏移数量就是^的数量，例如：	HEAD^^^，表示的是HEAD所指向的那个commit往前三个的那条commit记录，也就是图中圈出来我们要修改的那个commit前面的那个commit

**~ 的用法**：同样是当前指针的基础上往回偏移，偏移数量就是~后跟着的数字，例如：HEAD~3，表示的同样是图中错误的commit前面的那条commit

-------
记得我们文章上说过rebase吗，它其实是对分支重设基础点的一个操作，在对别的分支操作时，会找被rebase的分支和要rebase到的分支两个分支的交点，也就是被rebase的分支的一个基础点，分叉点，然后对从基础点分叉出来的提交重新设置为要rebase到的分支最新一条记录

所以这里git rebase -i HEAD^^^，rebase后面跟着的是一个自己分支的某个提交记录，实际上就是对rebase -i 后面跟着的那条记录开始（不包括开始点）往后的所有commit重新设置基础点，把这些commit重新生成一遍再接在这个新的基础点后面，对于文件历史变化来说，这个其实就是空操作

![](https://i.imgur.com/hZnVzCb.png)

## 替换最近一条commit信息

#### 涉及到的命令： git commit --amend####

git commit --amend是对上一条commit命令进行修正。当我们执行这条命令时时，Git会把当前暂存区的内容和这次commit的新内容合并创建一个新的commit，把我们当前HEAD指向的最新的commit替换掉。例如我们当前最新一条commit记录中，我们输入错了提交信息，想要修改，又或者我们提交错了一点东西，又不想生成一个新的commit记录，我们都可以使用这个命令。

这里假设我们需要修复一个上次提交错的文件，同时想修改上一个commit的信息

![](https://i.imgur.com/RfFvaZ3.png)

在我们修复了错误文件test.js后,执行：

	git add src/test.js

然后我们commit这条修改：

	git commit --amend

接着我们又一次进入commit的提交信息编辑页面

![](https://i.imgur.com/UnJxTc3.jpg)

回忆一下vim的操作，修改完保存退出，执行命令：

![](https://i.imgur.com/SwCAqn7.png)

看下我们的commit记录

![](https://i.imgur.com/Jv0eXGt.png)

amend用于修改上一条commit信息时，实际上并不是对上一个commit修改，而是生成新的对它进行替换。我们看第一张图我们操作的那条commit修改之前，和我们修改后生成的新的commit，id是完全不一样的（文章上介绍过生成方式），是两个不同的commit

所以这个时候如果我们对已经push到远端的commit记录在本地仓库进行--amend操作之后，直接push到远端仓库是不会成功的，因为本地丢失了远端仓库那个我们替换的commit

当然如果你啥也不改直接保存，那就相当于空操作嘛，老的commit就不会被替换了，还是它本身

## 丢弃最新的提交

#### 涉及到的命令： git reset####

最新一次的commit的内容有问题，想要丢弃这次提交，先log看下提交记录：

![](https://i.imgur.com/PwnGbwh.png)

如果想要恢复到HEAD前面的那次commit记录，也就是feature4's seccond commit，执行：

	git reset HEAD~1

执行看下结果,log看下记录：

![](https://i.imgur.com/gpksVtQ.png)
	
被撤销的那条提交并没有消失，只是log不再展现出来，因为已经被丢弃。如果你在撤销它之前记下了它的 SHA-1 码，那么还可以通过这个编码找到它，执行如下：

![](https://i.imgur.com/TMjqjSB.png)

log看下commit记录，我们丢弃的那条已经恢复，并且head指向它。

### 参数 --hard --soft --mixed

回顾一下文章上讲的工作目录（working area),暂存区（index)和本地版本库（HEAD）的区别，这里reset后面跟的参数影响的正是这三者内部的数据状态。

#### 1. git reset --soft

执行这句命令时，实际上我们只是把本地版本库，指向了我们要指向的那个commit，而暂存区和本地工作目录是一致的，保留着我们的文件修改，操作看下：

![](https://i.imgur.com/38sr52n.png)

执行完，status看下工作区状态，我们可以看到现在我们的暂存区有一个待commit的文件，证明现在本地版本库和暂存区是不一致的，而这个不一致刚好是我们丢弃的那次commit修改的内容，同时我们并没有看到有文件是"changes not staged for commit",说明当前我们的工作目录和暂存区文件状态是一致的。

总结如下 HEAD(本地版本库） != INDEX （暂存区文件内容）== WORKING （本地工作目录）

![](https://i.imgur.com/kTHsI7v.png)

#### 2. git reset --hard

执行这句命令时，不仅本地版本库会指向我们制定的commit记录，同时暂存区和本地工作目录也会同步变化成我们制定的commit记录的状态，期间所有的更改全部丢失，操作看下：

![](https://i.imgur.com/G7uBUFy.png)

执行完我们看到，暂存区和工作目录都没有文件记录

总结如下 HEAD(本地版本库） == INDEX （暂存区文件内容）== WORKING （本地工作目录）

![](https://i.imgur.com/a4N2bJZ.png)

#### 3. git reset --mixed(default）

--mixed是reset的默认参数，也就是当我们不指定任何参数时的参数。它将我们本地版本库指向我们制定的commit记录，同时暂存区也同步变化，而本地工作目录并不变化，所有我们丢弃的commit记录涉及的文件更改都会保存在本地工作目录working area中，所以数据不会丢失，但是所有改动都未被添加进暂存区，方便我们检查修改，操作看下：

![](https://i.imgur.com/6htMffR.png)

执行完我们看到，在工作目录中有文件修改，而暂存区和本地版本库与我们指定的commit记录保持一致

总结如下 HEAD(本地版本库） == INDEX （暂存区文件内容）！= WORKING （本地工作目录）

![](https://i.imgur.com/z8NiYt9.png)

## 丢弃历史中某一条提交

#### 涉及到的命令： git rebase -i /git rebase --onto

上面我们说到reset可以让我们回归到历史的某条commit记录，但是我们从那条记录之后的记录就都被丢弃，如果我们只想丢弃历史记录中的某一条而不影响其之后的记录要怎么做呢？

还是通过git rebase。这里不放在上面rebase的部分一起说是因为rebase的这个用法，在reset之后来讲会更方便理解。

#### 1.git rebase -i

![](https://i.imgur.com/b8QHMhA.png)

假设这里我们想要撤掉圈出来的feature4 2nd commit,回一下上面说的交互式rebase -i,我们把基础点设置成我们要丢弃的commit前面的commit（实际上只要设置成包含我们要删除的记录们的前面的任意一条都可以）：

	git rebase -i HEAD~2//-i后跟着的是我们要删除的记录前面的任意记录 设为基础点

![](https://i.imgur.com/ftiNeGU.png)

进入编辑页后，i进入插入模式，我们之前修改commit是将pick(应用）修改为edit，这次要撤销某条记录，我们直接把改条记录删除

![](https://i.imgur.com/XdgswgW.png)

：wq！保存退出vim，git log看下现在的历史记录：

![](https://i.imgur.com/RiTwPvw.png)

feature4's 2nd那条记录已经不在历史记录中

#### 2.git rebase --onto

我们之前在对分支执行rebase时，是选择所在分支与目标分支的交叉点作为起点，把所在分支从这个起点到最新的commit记录接到目标分支的结尾。

而rebase --onto可以帮我们指定这个起点，从新起点到所在分支最新记录之前的commit记录才接到目标分支上：

![](https://i.imgur.com/8x5HtXQ.png)

假设我们再1245这条分支上，对123（master)执行rebase不带任何参数,默认我们所在分支的起点是2，2后面的4和5会复制出来一个6和7接在3后面

如果我只想把5提交到3上，不想附带上4，那么我可以执行：

	git rebase --onto 3 4 5 //345分别是commit记录的代指

--onto 参数后面有三个附加参数：目标 commit（要接在哪次记录后面）、起点 commit（起点排除在外，从起点之后的记录）、终点 commit。所以上面这行指令就会从4（不包括4）往下数，一直数到5，把中间涵盖的所有commit记录，重新提交到 3 上去。

假设我们要丢失当前分支倒数第二个提交，HEAD^对应的那个，那么我们只要执行：

	git rebase --onto HEAD^^ HEAD^ HEAD

这句的意思是，以倒数第三个新的目标点，从倒数第二个不包括倒数第二个的commit记录开始，到HEAD之间的（本例中只有HEAD一个）接到新的目标点之后，所以倒数第二个就被跳过，直接最新的接在倒数第三个的后面

大家可以尝试下，不贴图啦。


## 生成一条新提交的撤销操作

#### 涉及到的命令： git revert

在我们已经push到远端仓库后发现有一条commit记录对应的修改应该被删除时，我们可以在用上面的操作方式在本地仓库操作删除那条记录，再推送到远端，但是注意，因为我们是删除了一条记录，所以在我们推送远端仓库的时候，会因为我们本地没有远端对应的那条记录而提示push失败

这时，如果你本来就希望用本地的内容覆盖掉中央仓库的内容，并且有足够的把握不会影响别的同事的代码，那么就不要按照提示去先pull再push了，而是要选择「强行」push：

	git push origin 分支名 -f //-f force 强制

但是在我们分支协作开发时，在向master分支提交代码时，是不应该用-f的，因为这样很容易让我们本地的内容覆盖或者影响同事们提交上去的代码。那这个时候如果我们想要撤销某次提交对应的改动要怎么办呢？

生成一条与我们要撤销的那条记录相反的新的commit记录：

	git revert 要撤销的改动对应的commit记录

git revert会生成一个与后面对应的commit记录相反的一次文件提交，从而将那次修改抵消，达到撤销的效果。

执行revert后再push到远端，我们文件内容就恢复了。revert的方式并不会造成某条记录在历史记录中消失，而只是生成一个新的与我们要撤销的记录相反的文件提交而已。

## 分支与HEAD分离 

#### git checkout

上面我们讲到过，在我们执行git checkout branch分支名的时候，HEAD会指向这个分支，同时两者都指向这个分支最新的那条commit记录。其实我们操作的这些分支，就是我们的一种理解，本质上它也是一个指针，对应着commit记录，所以checkout后面也可以直接指定某一条commit记录。

但是不一样的是，在我们checkout到某一条特定的commit记录时，HEAD和分支就脱离了，我们只是让HEAD指向了我们指定的记录，而所在的分支的指针并没有同步过来。

checkout本质上的功能其实是签出到指定的commit记录的一种操作。

![](https://i.imgur.com/TMcNvM3.png)

可以看到我们所在的“分支”也变成了HEAD指向的commit记录的id。

	git checkout --detach

执行这行代码，Git就会把HEAD和branch原地脱离，直接指向当前commit

## 临时存放工作目录的改动

#### 涉及到的命令： git stash

工作中可能经常遇到我们现在在某个分支开发，突然需要切换到master发个包或者到别的分支做些修复，但是我们本地改了一半儿的东西又不想先提交（例如可能会有改了一半儿的bug，推上去的话搞得一起在这个分支的小伙伴拉下来项目都跑不起来），为了防止带到别的分支同时不用提交到远端分支，又不丢弃自己现在的改动，我们可以借用stash

	git stash //临时保存工作区的改动

stash指令可以帮你把工作目录的内容全部放在你本地的一个独立的地方，不是暂存区，它不会被提交，也不会被删除，同时你的工作目录已经清理干净，可以随时切换分支，等之后需要的时候，再回到这个分支把这部分改动取出来

	git stash pop //取出工作区的改动

这里注意，我们untracked的文件，是不在本地仓库追踪记录里的（上开头部分说过），自然stash的时候也会忽略他们，这时如果想要stash一起保存这些untracked的文件，我们可以
	
	git stash -u //--include-untracked 的简写，将untracked的文件一并临时存储

## 操作记录恢复

#### 涉及到的命令：git reflog

它是Git仓库中引用的移动记录，如果不指定引用，git log默认展示HEAD所指向的一个顺序的提交列表。它不是本地仓库的一部分，它单独存储，而且在push，fetch或者clone时都不包括它，它纯属是本地的一个操作的记录。 

![](https://i.imgur.com/hPuHV3x.png)

每行记录都由版本号，HEAD值和操作描述三列分组成。

- 版本号：这次操作的一个id
- HEAD值：同样用来标识版本，但是不同于版本号的是，Head值是相对的。括号里的值越小，表示版本越新
- 描述：操作行为的描述，包括我们commit的信息或者分支的切换等。

reflog为每一条操作显示其对应的id版本号，这个id可以很好地帮助我们你恢复误操作的数据，例如我们错误地reset了一个旧的提交，或者rebase等操作，这个时候我们可以使用reflog去查看在误操作之前的信息，并且使用git reset 版本号，去恢复之前的某一次操作状态，操作过后依然可以在reflog中看到状态之后的所有操作记录

区别于git log，log显示的是所有本地版本库的提交信息，commit记录，且不能察看已经删除了的commit记录。而git reflog可以查看所有分支的所有操作记录（包括commit和reset的操作），包括已经被删除的commit记录，几乎所有的操作都记录在其中，随时可以回滚。

基本操作大概就这么多啦，谢谢你看到了这里，不对的地方还请多多指教！

参考文章：
https://www.jianshu.com/p/4f8b56d0fd5b
http://gitbook.liuhui998.com/4_2.html
https://blog.csdn.net/andyzhaojianhui/article/details/78072143
https://blog.csdn.net/chaiyu2002/article/details/81773041
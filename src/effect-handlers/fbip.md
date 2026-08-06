# FBIP(Functional but In-Place): 函数式但原地

借助 [Perceus](https://koka-lang.github.io/koka/doc/book.html#why-fbip) 复用分析，我们能够编写出这样的算法：在可能的情况下动态适应并采用原地修改（而在持久使用时则采用复制）。重要的是，你可以信赖这种优化确实会发生，例如，参见 `match` 模式，并在每个分支中将它们与相同大小的构造器配对。

这种编程风格催生了一个我们称之为FBIP的新范式：“函数式但原地”。正如尾调用优化让我们能用常规函数调用来描述循环，复用分析让我们能以纯函数式方式描述原地修改的指令式算法（同时也能实现持久性）。

> [!NOTE]
> FBIP仍属于活跃研究领域。特别是，我们希望增加添加注解的方式，以确保复用确实发生。

## 红黑树再平衡
(Tree Rebalancing)

作为一个示例，我们考虑向红黑树<sup>[3]</sup>中插入节点。该示例的多态版本位于Koka安装后的samples目录中，可通过 `:l` [samples/basic/rbtree](https://github.com/koka-lang/koka/tree/master/samples/basic/rbtree.kk) 加载。我们将红黑树定义为：
```koka
type color
  Red
  Black

type tree
  Leaf
  Node(color: color, left: tree, key: int, value: bool, right: tree)
```
红黑树具有一个不变性质，即从根节点到任意叶节点的黑色节点数量相同，并且红色节点永远不会是红色节点的父节点。这两者共同确保了树始终是平衡的。在插入节点时，需要通过在必要时重新平衡节点来维护这些不变性质。Okasaki 的算法[19]以优雅且函数式的方式实现了这一点：
```koka
fun balance-left( l : tree, k : int, v : bool, r : tree ): tree
  match l
    Node(_, Node(Red, lx, kx, vx, rx), ky, vy, ry)
      -> Node(Red, Node(Black, lx, kx, vx, rx), ky, vy, Node(Black, ry, k, v, r))
    ...

fun ins( t : tree, k : int, v : bool ): tree
  match t
    Leaf -> Node(Red, Leaf, k, v, Leaf)
    Node(Red, l, kx, vx, r)
      -> if k < kx then Node(Red, ins(l, k, v), kx, vx, r)
         ...
    Node(Black, l, kx, vx, r)
      -> if k < kx (&&) is-red(l) then balance-left(ins(l,k,v), kx, vx, r)
         ...
```
Koka编译器会对 `balance-left` 函数进行内联。这样一来，在 `ins` 函数中，每个匹配到的 `Node` 构造函数都会对应一个 `Node` 分配——如果考虑所有分支，我们可以看到，要么匹配一个 `Node` 并分配一个，要么匹配三个深层的 `Node` 并分配三个。实际上，在快速路径中，每个 `Node` 都会被直接重用，而无需进行任何分配！研究生成的代码时，我们可以发现，Perceus会在快速路径中直接原地为Node的字段赋值，这与C语言中通常的非持久化再平衡算法做法非常相似。

这本质上意味着，对于唯一的树结构，上述纯函数算法会在运行时自适应地转变为一种原地修改的再平衡算法（且无需额外分配）。此外，如果我们以持久化方式使用树[20]，并且树被共享或部分共享，算法会自适应地仅复制树中共享的脊（不多复制任何部分），同时对任何非共享部分仍进行原地再平衡。
## 莫里斯遍历
(Morris Traversal)

作为FBIP的另一个例子，考虑按照中序顺序对二叉树中的所有元素应用函数 `f`，如 `tmap-inorder` 示例所示：
```koka
type tree
  Tip
  Bin( left: tree, value : int, right: tree )

fun tmap-inorder( t : tree, f : int -> int ) : tree
  match t
    Bin(l,x,r) -> Bin( l.tmap-inorder(f), f(x), r.tmap-inorder(f) )
    Tip        -> Tip
```
这已经相当高效了，因为当 `t` 唯一时，所有的 `Bin` 和 `Tip` 节点都会被原地复用。然而，`tmap` 函数并不是尾递归的，因此它使用的栈空间与树的深度成正比。
```c
void inorder( tree* root, void (*f)(int) ) {
  tree* cursor = root;
  while (cursor != NULL /* Tip */) {
    if (cursor->left == NULL) {
      // no left tree, go down the right
      f(cursor->value);
      cursor = cursor->right;
    } else {
      // has a left tree
      tree* pre = cursor->left;  // find the predecessor
      while(pre->right != NULL && pre->right != cursor) {
        pre = pre->right;
      }
      if (pre->right == NULL) {
        // first visit, remember to visit right tree
        pre->right = cursor;
        cursor = cursor->left;
      } else {
        // already set, restore
        f(cursor->value);
        pre->right = NULL;
        cursor = cursor->right;
      }
    }
  }
}
```
1968年，Knuth提出了在不使用额外栈或堆空间的情况下按中序遍历树的问题[7]（对于不熟悉该问题的读者，不妨先用你最喜欢的命令式语言尝试一下，就会发现这并不容易做到）。自那以后，文献中出现了许多解决方案。其中一种特别优雅的方案由Morris[18]提出。这是一种原地修改算法，通过交换树中的指针来“记住”哪些部分尚未访问。本教程不打算给出完整解释，但这里附带展示了一个C语言实现。该遍历本质上利用右线索树来跟踪待访问的节点。不过，该算法相当微妙。由于它将树转换为中间图，我们需要对所谓的Morris循环[16]陈述不变量，以证明其正确性。

我们可以利用FBIP技术推导出一个函数式且更直观的解决方案。我们首先定义一个显式的访问者数据结构，用于跟踪树中仍需访问的部分。在Koka中，我们将此数据类型定义为 `visitor`：
```koka
type visitor
  Done
  BinR( right:tree, value : int, visit : visitor )
  BinL( left:tree, value : int, visit : visitor )
```
以下是翻译后的带 LaTeX 的 Markdown 文本：

(顺便一提，Conor McBride[17] 描述了我们可以如何为任意递归类型 $\mu x. F$ 泛型地推导出一个 zipper [6] 访问器，其形式即为该类型的导数所构成的列表，即 \\(list(\frac{\partial}{\partial x} F \mid_{x=\mu x.F})\\)。在我们这个案例中，归纳型 `tree` 类型的代数表示为 \\(\mu x. 1 + x \times \text{int} \times x \cong \mu x. 1 + x^2 \times \text{int}\\)。通过计算导数 \\(list(\frac{\partial}{\partial x} (1 + x^2 \times \text{int}) \mid_{x=\text{tree}})\\) 并进行进一步的化简，我们得到 \\(\mu x. 1 + (\text{tree} \times \text{int} \times x) + (\text{tree} \times \text{int} \times x)\\)，这恰好对应于我们所定义的 `visitor` 数据类型。)

我们还记录在树中移动的方向（`direction`），是向上(`Up`)还是向下(`Down`)。
```koka
type direction
  Up
  Down
```
我们通过使用一个空的访问者向下遍历树来开始遍历，表示为 `tmap(f, t, Done, Down)`。
```koka
fun tmap( f : int -> int, t : tree, visit : visitor, d : direction )
  match d
    Down -> match t     // going down a left spine
      Bin(l,x,r) -> tmap(f,l,BinR(r,x,visit),Down) // A
      Tip        -> tmap(f,Tip,visit,Up)           // B
    Up -> match visit   // go up through the visitor
      Done        -> t                             // C
      BinR(r,x,v) -> tmap(f,r,BinL(t,f(x),v),Down) // D
      BinL(l,x,v) -> tmap(f,Bin(l,x,t),v,Up)       // E
```
核心思想是：我们要么已完成`Done`（`C`），要么在沿着左脊柱向下走时，将所有仍需访问的右树记录在一个`BinR`（`A`）中；或者，在再次向上走（`B`）时，将我们刚刚构造的左树记录为一个`BinL`，同时访问右树（`D`）。当我们回到顶部（`E`）时，我们用结果值恢复原始树。请注意，我们在分支`D`中将函数`f`应用于保存的值（因为我们按中序访问），但函数式实现使得通过分别在分支`A`或分支`E`应用`f`，可以轻松指定前序或后序遍历。

观察每个分支，我们可以看到每个`Bin`与一个`BinR`匹配，每个`BinR`与一个`BinL`匹配，最后每个`BinL`与一个`Bin`匹配。由于它们大小相同，如果树是唯一的，则每个分支在运行时原地更新树节点而无需任何分配，其中`visiter`访问者结构在遍历树时实际上覆盖在树节点之上。由于所有`tmap`调用都是尾调用，这也会编译成一个紧凑的循环，因此不需要额外的栈空间或堆空间。

最后，就像重新平衡树插入一样，所指定的算法仍然是纯函数式的：当传入唯一树时，它使用原地更新；但也能优雅地适应持久化情况，即输入树被共享，或输入树的部分被共享，此时会仅复制树的那些共享部分。
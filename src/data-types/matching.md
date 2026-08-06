# 模式匹配
(Matching)

Koka 使用模式匹配（`match` 表达式）来解构代数数据类型。保留字 `match` 表示模式匹配——它根据一个值的实际构造分支，将控制权分发到对应的处理分支 。
## 基本语法
`match` 表达式的形式如下：
```koka
match <表达式>
  <模式1> -> <分支1>
  <模式2> -> <分支2>
  ...
```
`match` 会依次尝试每个模式，第一个匹配成功的模式对应的分支被执行。每个模式可以是：
- 构造子模式：匹配某个具体的构造分支（如 `Nil`、`Cons(x, xx)`）
- 变量模式：绑定到一个变量，匹配任意值
- 通配模式 `_`：匹配任意值且不绑定
- 字面量模式：匹配具体的常量值
## 解构列表
Koka 的 `list` 类型有两个构造子：`Nil`（空列表）和 `Cons(head, tail)`（非空列表，头部是 `head`，尾部是 `tail`）。我们可以用 `match` 来遍历它：
```koka
// 遍历列表并打印元素
effect yield<a>
  fun yield(x : a) : ()

pub fun traverse(xs : list<a>) : yield<a> ()
  match xs
    Cons(x, xx) -> { yield(x); traverse(xx) }
    Nil         -> ()
pub fun main()
  with handler
    fun yield(x : int)
      println(x)
  val b = [1,2,3,4]
  traverse(b)
```
这里 `match xs` 检查 `xs` 是 `Cons` 还是 `Nil`：
- 如果是 `Cons(x, xx)`，则将头部绑定到 `x`、尾部绑定到 `xx`，然后先 `yield(x)` 处理头部，再递归处理尾部 `xx`
- 如果是 `Nil`，则什么都不做，返回 `()`
## 一个标准库的例子：`map`
标准库的 `map` 函数用 `match` 实现列表转换 ：
```koka
pub fip fun map(xs : list<a>, ^f : a -> e b) : e list<b>
  match xs
    Cons(x,xx) -> Cons(f(x), xx.map(f))
    Nil        -> Nil
```
注意 `map` 的形参的类型签名：`^f : a -> e b`：`^` 表示 `f` 只是被借用，不需要转移所有权，也无需修改引用计数。`f` 可以带有任意效应 `e`，而 `map` 本身也返回 `e list<b>`——效应被透明地传递。这是 Koka 效应多态的体现。

Koka 编译器保证 `map` 的这种递归实现会被优化成常数栈空间——相关的优化（tail recursion modulo cons）虽然早在 1970 年代就已为人所知，但令人惊讶的是很少有语言真正实现它 。
## 替选类型与模式匹配
对于任意用 `type` 定义的替选类型，`match` 同样适用。例如 `number` 类型 ：
```koka
type number
  Infinity
  Integer(i: int)

fun to-int(n : number) : int
  match n
    Infinity   -> 0
    Integer(i) -> i
```
这里 `Integer(i)` 模式不仅匹配 `Integer` 构造子，还把内部的 `i` 绑定到变量 `i`，供分支体使用。
## 模式里的变量绑定与嵌套
模式可以嵌套，且能同时绑定多个变量。例如解构一个二叉树 ：
```koka
type tree
  Leaf(value : int)
  Node(left : tree, value : int, right : tree)

fun tree-size(t : tree) : int
  match t
    Leaf(v)       -> v
    Node(l, v, r) -> v + tree-size(l) + tree-size(r)
```
`Node(l, v, r)` 一次性把三个字段分别绑定到 `l`、`v`、`r`。
## 通配与兜底
如果只关心部分模式，可以用 `_` 忽略不关心的部分 ：
```koka
fun is-empty(xs : list<a>) : bool
  match xs
    Nil -> True
    _   -> False
```
`_` 匹配任意值且不绑定变量名。
## 模式匹配的穷尽性
Koka 编译器会检查 `match` 表达式是否穷尽了所有可能的构造分支。如果有遗漏，编译器会报错——这保证了你不会忘记处理某个构造子，是代数数据类型模式匹配的一大安全优势。
例如，如果上面的 `to-int` 漏掉了 `Infinity` 分支，编译器会拒绝该程序，提示模式匹配不穷尽。
## 为什么模式匹配重要
模式匹配让"解构数据"这件事变得：
- 安全：编译器检查穷尽性，杜绝漏处理
- 简洁：一个 `match` 同时完成"判断构造子 + 绑定内部字段"两件事
- 可读：数据的形状直接体现在代码结构里
- 可组合：与递归、效应多态天然配合
> [!TIP]
> 在 Koka 中，`match` 是处理代数数据类型的主要方式。结合前面讲的alternatives，你可以定义丰富的数据模型，然后用 `match` 优雅地消费它们。
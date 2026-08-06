# 归纳类型、余归纳类型与发散类型
(Inductive, Co-inductive, and Recursive Types)

Koka 的 `type` 关键字用于声明归纳类型（inductive types）——例如 `list`。为了实现等式推理（equational reasoning）和终止性检查（termination checking），Koka 对普通 `type` 声明做了严格限制：类型本身不能出现在负位置（negative position）。这一限制保证了归纳类型的良构性，使得编译器可以对操作这类数据的递归函数做终止性分析。

除了 `type`，Koka 还提供另外两种类型声明：`co type`（余归纳类型，co-inductive types）和 `div type`（任意递归类型，arbitrary recursive types）。它们分别放宽了 `type` 的不同限制，以适应不同的编程需求。

## 归纳类型（`type`）：有限、正向递归、终止性
普通的 `type` 声明要求递归是正向的（positive）——即类型自身只能出现在构造子的"输出"位置，而不能出现在"输入"（负）位置。经典的例子是标准库的列表：
```koka
pub type list<a>
  con Nil
  con Cons(head:a, tail : list<a> )
```
>在 Koka 里，`con` 是用于显式声明"构造子（constructor）"的关键字。PLDB 的 Koka 关键字表明确把 `con` 列为语言关键字之一 。现代 Koka 在 `type` 定义体内默认把每个顶级声明当作构造子，所以 `con` 可以省略。
这里 `list<a>` 出现在 `Cons` 的 `tail` 字段里——这是正位置，合法。这种限制保证了：
- 可终止性：对任何在 `list` 上做结构递归的函数，编译器可以做终止性检查
- 等式推理：归纳类型满足归纳法原理，支持等式推理
以下这种 `type` 声明中 `bad` 出现在 `bad -> int` 的参数位置——负位置，编辑器诊断会报错、编译会报错
```koka
type bad
  Bad(f: bad -> int)
```
Koka 的终止性检查器会分析递归函数：如果每次递归调用都减小了归纳类型参数的大小，则该函数被判定为 `total`，否则 `div`。
标准库的 `length` 实现：
```koka
pub fun length(xs)
  fun len(ys,acc)
    match ys
      Cons(_,yy) -> yy.len(acc+1)
      Nil        -> acc
  xs.len(0)
```
`length` 在每个递归调用中都处理更短的列表，因此被判定为 `total`：`fun length : forall<a> (xs : list<a>) -> int`
## 余归纳类型（`co type`）：潜在无穷、生产性
有些数据结构本质上是潜在的无穷——例如惰性流（`stream`）、无限序列、响应式事件流等。这些结构不能用普通的 `type` 声明，因为 `type` 要求有限归纳。针对潜在的无穷，Koka 提供 `co type`​ 来声明余归纳类型，比如标准库的 `stream`：
```koka
pub co type stream<a>
  con Next(head:a, tail: stream<a> )
```
`stream` 在数学上就是**余归纳类型**——它的元素是"通过观察逐步揭示"的，可能无穷（如 repeat(1) 产生的流）。标准库选择 `co type` 是为了在语义层面精确标记这种"潜在无穷"的性质，语法上不存在"必须用 co type 才能声明"。实际上 `type` 也可以用于其声明，但是缺少了"潜在无穷"标记，所以在你自定义一个 `stream` 时，即使去掉co只用type也能通过编译检查。

但实际上是会有产生无穷 `stream` 的情况的：
```koka
// 1. 延迟计算单元：thunk
type thunk<a>
  Delay(f: () -> div a)      // 未求值
  Memo(v: a)             // 已求值（用于记忆化，可选）

// 强迫求值
fun force(t: thunk<a>): div a
  match t
    Delay(f) -> f()      // 这里简单地直接调用；生产代码可做 memoization
    Memo(v)   -> v

// 2. 流类型：tail 是 thunk<stream<a>>
//    用 co type 标记"潜在无穷"的余归纳语义
co type stream<a> //实际上去掉 co 也能通过编译而且不会有任何影响
  con SCons(head: a, tail: thunk<stream<a>>)

// 3. 重复单一元素 → 潜在无穷流
//    关键：tail 用 Delay(fn() my-repeat(x)) 包裹，构造时不立即求值
pub fun my-repeat(x: a): <div|_e> stream<a>
  SCons(x, Delay(fn() my-repeat(x)))

// 4. 取前 n 个元素，转成 list
pub fun take(s: stream<a>, n: int): <div|_e> list<a>
  match n
    0 -> Nil
    _ -> match s
          SCons(h, t) -> Cons(h, take(force(t), n - 1))

// 5. 从初始值迭代：f(x), f(f(x)), f(f(f(x))), ...
pub fun iterate(f: a -> a, x: a): <div|_e> stream<a>
  SCons(x, Delay(fn() iterate(f, f(x))))

// 6. main：只操作有限前缀，程序正常终止
pub fun main()
  println(take(my-repeat(1), 100)) // 将100改成任何数字n都可以打印出n个1
```
## 极性翻转（polarity flipping）
`type` 和 `co type` 都要求自身类型不能在负位置
```koka
type foo
  Foo(f: (foo -> int) -> int)
co type bar
  Bar(f: (bar -> int) -> int)
```
foo、bar位于内层箭头的左侧（负位），而该箭头整体又位于外层箭头的左侧（负位）
负 × 负 = 正 检查通过。
## 发散类型（`div type`）：放开、放弃自动终止性
如果需要任意的递归类型——包括类型出现在负位置（如函数参数位置），Koka 提供 div type：
```koka
div type foo
  Foo(recur: foo -> int)
```
`div type` 允许类型以任意方式递归，包括出现在负位置。这使得可以利用 Koka 允许的命名函数 + 递归数据类型，构造出了一个自引用的不动点，表达能力等效于 **Y 组合子**：
```koka
div type foo
  Foo(recur: foo -> int)

fun upsilon(x: foo): int
  match x
    Foo(recur) -> recur(x)

fun do_upsilon(): int
  upsilon(Foo(upsilon))
```
>这段代码执行会导致无限递归，导致栈溢出， exit code -11 即 SIGSEGV（段错误）。
任何对 `div type` 做模式匹配的函数，都被假定为可能发散（potentially divergent），因此自动带上 `div` 效应。这是一个保守但安全的设计——因为 `div type` 赋予了编码 Y 组合子的能力，可以写出非语法递归的不终止函数，所以 Koka 必须假定这类函数可能发散。
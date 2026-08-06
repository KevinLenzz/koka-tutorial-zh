# 可扩展数据类型
(Extensible Data Types)

普通的 `type` 声明定义的代数数据类型，其构造分支在声明时就固定了——后续无法在不修改原定义的情况下添加新的构造子。Koka 还提供了一种可扩展的数据类型：`open type`。它允许你先声明一个"开放的"类型，然后在程序的任何其他地方（在同一个模块或任何其他模块中）通过 `extend type` 为它追加新的构造分支。
```koka
open type openvar
  A
  B

extend type openvar
  C

fun do-it-try-it(v : openvar) : console ()
  match v
    A -> println("got an A")
    B -> println("got a B")
    C -> println("got a C")
    // 注意：我们可以在代码里匹配 D，尽管它还没被声明
    D -> println("got a D")
    // 兜底
    _ -> println("got something else")

extend type openvar
  D

fun main() : console ()
  do-it-try-it(C)   // 输出: got a C
  do-it-try-it(D)   // 输出: got a D
```
> [!TIP]
> 由于 openvar 是开放的，理论上任何下游代码都可能继续 extend type openvar 添加新分支。因此，在对 open type 做模式匹配时，编译器无法在编译期保证穷尽性——你可能没有处理未来新增的构造子。所以在实际使用中，通常以通配模式 _​ 收尾，或者只匹配你已知的那些分支。

open type 适用于以下场景：
- 跨模块的类型演进：基础库定义一个开放类型，各业务模块往里添加自己的构造分支，而不需要修改基础库源码
- 插件架构：宿主程序定义 open type PluginEvent，各插件通过 extend type PluginEvent 声明自己的事件类型
- AST / 中间表示的扩展：语言前端定义 open type Expr，各优化 pass 或后端可以扩展新的节点类型
# 效应类型
(Effect Types)

Koka 的一个新颖之处在于：它会自动推断出函数中发生的所有副作用。没有任何副作用的情形记为 `total`（或 `<>`），对应纯数学函数。若函数可能抛出异常，其效应为 `exn`；若函数可能不停机，其效应为 `div`（divergence，发散）。`exn` 与 `div` 的组合称为 `pure`，直接对应 Haskell 的"纯度"概念。

Koka 里 `pure = <exn, div>` 这个定义，本质是把 Haskell 的"纯度"概念显式化为一个类型标签：它表示函数可能抛异常或不停机（这两者在 Haskell 语义里被 ⊥ 吸收，不影响引用透明），但没有状态变更、非确定性、IO 等更显式的副作用。Koka 借此既保持了和 Haskell 理论体系的对应，又把"纯度"这件事从 Haskell 的隐式约定变成了 Koka 类型系统里的显式、可检查、可推断的一等公民。

>在编程语言理论中，一个构造若是"一等的（first-class）"，它就能像普通值一样被全面操纵。Wellesley CS251（Principles of Programming Languages）课程讲义中指出，一等值"can be used or created wherever we use or create any other values"——具体包括：可作为函数调用的实参、可作为函数体的结果、可存入数据结构、可被变量绑定命名等 。

非确定性函数具有 `ndet` 效应。所谓"最坏"的效应是 `io`，意味着程序可以抛出异常、不停机、具有非确定性、读写堆内存，并执行任意输入/输出操作。以下是一些带效应的函数示例：
```koka
fun square1( x : int ) : total int   { x*x }
fun square2( x : int ) : console int { println( "a not so secret side-effect" ); x*x }
fun square3( x : int ) : div int     { x * square3( x ) }
fun square4( x : int ) : exn int     { throw( "oops" ); x*x }
```
当效应为 `total` 时，我们通常将其省略不写在类型标注中。例如，当我们写下：
```koka
fun square5( x : int ) : int
  x*x
```
此时假定效应为 `total`。有时候我们写了一个带效应的函数，但不想显式写出它的效应类型。这种情况下，可以使用**通配类型**来表示某个被推断出来的类型。通配类型的写法是：用一个下划线作为前缀的标识符，或者干脆只写一个下划线：
```koka
fun square6( x : int ) : _e int
  println("I did not want to write down the \"console\" effect")
  x*x
```
编辑器中将鼠标悬停在 square6 上，即可看到 `_e` 被推断出的效应，即 `console`。
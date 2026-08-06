# 处理
(Handling)

让我们从定义自己的 **异常效应** 开始。`effect` 定义一个新效应类型，声明相关操作。下面我们先使用最通用的 **控制（`ctl`）** （之后会详解它）操作写个例子：
```koka
effect raise
  ctl raise( msg : string ) : a
```
这定义了一个效应类型 `raise` ，声明了一个类型为 `(msg : string) -> raise a` 的操作 `raise` 。完整定义决定了效应类型的签名，有了其签名之后，我们就可以使用这个操作了：
```koka
fun safe-divide( x : int, y : int ) : raise int
  if y==0 then raise("div-by-zero") else x / y
```
在这里我们可以看到，安全除法函数带有 `raise` 效应（因为我们在函数体中使用了 `raise` 操作）。这样的效应类型意味着，我们只能在 `raise` 被处理的上下文中对该函数进行求值（换句话说，即在 `raise` 被“动态绑定”的上下文中，或者在我们“拥有raise能力（capability）”的上下文中）。

我们可以通过为 `raise` 操作给出一个具体的定义来处理这种效应。例如，我们可能会始终返回一个默认值：
```koka
fun raise-const() : int
  with handler
    ctl raise(msg) 42
  8 + safe-divide(1,0)
```
调用 `raise-const()` 的结果是42（而非50）。当在 `safe-divide` 中调用 `raise` 时，控制权会让渡（yield）给**动态调用栈中距离调用点最近的 `raise` 处理器**——即"最内层"处理器：若同一效应有多个嵌套处理器，总是最靠近调用点的那个接管，类似别的语言异常处理中优先匹配最近的 catch 块；本例只有一个处理器，所以由它接管。控制权移交后，处理器展开调用栈，再按操作的定义求值，在此例中直接返回 42。现在我们明白了为何称其为控制操作：`raise` 改变了常规的线性控制流，从原始调用点直接跳到最内层处理器。处理器已消除了 `raise` 效应，`raise-const` 重新变为无效应的 `total` 函数。

`handler{ <ops> }` 表达式本身是一个函数，它期望接收一个函数参数，并在此 `handler` 所在作用域内应用它，例如对于 `(handler{ <ops> })(action)` ，会在 `(action)` 内应用它。这自然与 `with` 语句配合得很好。对于单个操作，我们可以省略 `handler` 关键字，其翻译如下：
```koka
with ctl op(<args>){ <body> }
可被翻译为
with handler
  ctl op(<args>){ <body> }
```
借助这一翻译，我们可以将之前的示例更简洁地写成：
```koka
fun raise-const1() : int
  with ctl raise(msg) 42
  8 + safe-divide(1,0)
```
它最终会扩展为 `(handler{ ctl raise(msg){ 42 } })(fn(){ 8 + safe-divide(1,0) })`。

在效应只声明了一个操作时，若效应和操作的名称相同，我们可以仅通过声明其操作来定义这样的效应，这隐式地定义了一个同名的效应类型：
```koka
effect ctl op(<parameters>) : <result-type>
可被翻译为
effect op {
  ctl op(<parameters>) : <result-type>
}
```
这意味着我们可以将 `raise` 效应的签名更为简洁地写成：
```koka
effect ctl raise( msg : string ) : a
```
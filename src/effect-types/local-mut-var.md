# 局部可变变量
(Local Mutable Variables)

斐波那契数列中，每个后续斐波那契数都是前两个斐波那契数之和，其中 `fib(0) == 0` 且 `fib(1) == 1`。我们可以使用递归函数轻松计算斐波那契数：
```koka
fun fib(n : int) : div int
  if n <= 0   then 0
  elif n == 1 then 1
  else fib(n - 1) + fib(n - 2)
```
请注意，类型推断引擎目前还不够强大，无法证明此递归函数总是终止，这导致结果类型中包含发散效应 `div`。

以下是斐波那契函数的另一个版本，但这次使用局部可变变量实现。我们使用 `repeat` 函数来迭代n次：
```koka
fun fib2(n)
  var x := 0
  var y := 1
  repeat(n)
    val y0 = y
    y := x+y
    x := y0
  x
```
`handler` 内部隐式绑定了一个 `resume` 函数，调用 `resume(v)` 会让计算在被效应操作打断的地方继续下去，并把 `v` 作为该操作的返回值。

与绑定不可变值的 `val` 声明（如 `val y0 = y`）相反，`var` 声明声明可变变量，其中 `:=` 运算符可以为该变量分配新值。在内部，`var` 声明使用一个**状态效应处理器**，确保即使多次 恢复（`resume`），状态也具有正确的语义。

然而，这也意味着可变局部变量并不是一等的，我们不能将它们作为参数传递给其他函数（因为它们总是被解引用）。可变局部变量的生命周期不能超出其词法作用域。例如，如果局部变量通过函数表达式逃逸，则会出现类型错误：
```koka
fun wrong() : (() -> console ())
  var x := 1
  (fn(){ x := x + 1; println(x) })
fun main()
  wrong()
/*
type error: abstract type(s) escape(s) into the context
  term         :   var x := 1
                   (fn(){ x := x + 1; println(x) })
  inferred type: () -> <local<$h>|_e> (() -> <console/console,local<$h>|_e1> ())
  hint         : give a higher-rank type annotation to a function parameter?
*/
```
这一限制使得语义更加清晰，同时也为（目前尚未完全实现但理论上可行的）优化留下了空间——而这些优化对于通用的 可变引用单元格(mutable reference cell) 来说是无法实现的。

通常更推荐使用 `var` 声明，因为它们在多次恢复（multiple resumptions）的场景下表现更好，而且在语法上更简洁，无需解引用运算符。（不过，我们仍然需要引用单元格，因为它们是一等的，而 var变量 无法传递给其他函数。）
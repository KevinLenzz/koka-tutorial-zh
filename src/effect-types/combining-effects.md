# 效应组合
(Combining Effects)

一个函数时常包含多个效益，例如：
```koka
fun combine-effects()
  val i = srandom-int() // 非确定性 → ndet
  throw("oops")         // 抛出异常 → exn
  combine-effects()     // 非终止 → div(发散)
```
分配给效应组合的效应是 `ndet`、`div` 和 `exn`，可以组合写成一行效应 `<div,exn,ndet>`。给`combine-effects`推断出的返回的类型实际上是 `<pure,ndet>`，其中 `pure` 是类型别名：
```koka
alias pure = <div,exn>
```
# 类型推断
(Type Inference)

Koka是强类型的。它使用强大的类型推断引擎来推断大多数类型。
你始终可以在任何局部变量声明时省略其类型标注：
```koka
fun main()
  var a:=10 // 类型推断为int，等效于var a:int:=10
  println(a)
```
你也可以省略函数参数和结果的类型标注：
```koka
import std/num/int32
fun rotl(a)
  rotl(a,10) // 对形参a能使用i32的rotl则将a类型推断为i32
  // int 是平台相关整数——在 32 位平台上等同于 int32，在 64 位平台上等同于 int64，宽度由编译目标决定
fun main()
  rotl(100.i32) // int不会被隐式转换成int32，必须显式转换
```
但一般来说，为函数参数和函数结果编写类型标注是一种很好的做法，因为它既有助于类型推断，又提供有用的文档以及来自编译器的更好的反馈。

示例代码：
```koka
//移位变换加密
fun encode(s : string, shift : int)
  fun encode-char(c)
    if c < 'a' || c > 'z' then return c
    val base = (c - 'a').int
    val rot  = (base + shift) % 26
    (rot.char + 'a')
  s.map(encode-char)
//恺撒密码加密代换
fun caesar( s : string ) : string
  s.encode( 3 )
fun main()
  caesar("foobarbaz")
```
对于此处的 `encode` 函数，不能省略 `s` 参数的类型：因为 `map` 函数是为列表和字符串类型定义的，没有类型标注不能确定 `s` 是列表还是字符串，从而编译时无法确定用哪一个签名的函数。
<br/>
尝试在编辑器中示例的删除 `s` 的类型标注后运行以查看Koka编译器会报什么错误。
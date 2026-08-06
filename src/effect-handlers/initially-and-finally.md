# initially与finally函数
(Initially and Finally)

对于任意效应处理器，在与文件等外部资源交互时我们需要格外小心。一般来说，操作可能永远不会恢复（如异常）、恰好恢复一次（提供通常的线性控制流），或者恢复多次。为了稳健地处理这些不同情况，Koka 提供了 `finally` 和 `initially` 函数。

```koka
std/core/hnd/finally: forall<a,e> (fin : () -> e (), action : () -> e a) -> e a
```
```koka
std/core/hnd/initially: forall<a,e> (init : (int) -> e (), action : () -> e a) -> e a
```

假设我们有以下针对文件句柄的低级文件操作：
```koka
type fhandle
fun fopen( path : string )   : <exn,filesys> fhandle
fun hreadline( h : fhandle ) : <exn,filesys> string
fun hclose( h : fhandle )    : <exn,filesys> ()
```
使用这些原语，我们可以声明一个 `fread` 效应来从文件中读取。
```koka
effect fun fread() : string

fun with-file( path : string, action : () -> <fread,exn,filesys|e> a ) : <exn,filesys|e> a
  val h = fopen(path)
  with handler
    return(x)   { hclose(h); x }
    fun fread() hreadline(h)
  action()
```

然而，就目前而言，如果在 `action` 内部使用了异常效果（即，或任何永不恢复的操作），它无法关闭文件句柄。`finally` 函数能处理这些情况，其第一个参数是一个函数，该函数在正常返回或为不恢复操作而展开时总是会被执行。因此，编写 `with-file` 更健壮的方式如下：
```koka
fun with-file( path : string, action : () -> <fread,exn,filesys|e> a ) : <exn,filesys|e> a
  val h = fopen(path)
  with finally
    hclose(h)
  with fun fread()
    hreadline(h)
  action()
```
当前的定义对于从不恢复或只恢复一次的操作是稳健的——但一旦需要恢复多次，问题就出现了。如果有人在 `action` 内部调用 `choice`，那么第二次恢复时文件句柄会再次被关闭，这很可能不是预期的行为。目前有研究正在探索利用类型系统在静态层面阻止这种情况的发生。

另一种处理多次恢复的方式是使用 `initially` 函数。该函数接受两个参数：第一个参数是一个函数，它会在 `initially` 首次被求值时被调用，并且之后每当特定恢复被多次恢复时也会被调用。
<hr/>

> 高级
## 原始控制
使用 `raw ctl` 定义原始控制操作时，这些操作不会自动完成终结（finalize）。借助 `raw ctl` 可以利用隐式绑定的恢复上下文 `rcontext` 要么恢复执行（如 `rcontext.resume(x)`），要么终结恢复（如 `rcontext.finalize`），后者会运行所有 `finally` 处理器以清理资源。这使得 `rcontext` 可以作为一等值存储，以便稍后在不同作用域中恢复或终结。当然，使用时需格外谨慎，因为现在确保恢复最终被恢复或终结（以便能释放任何资源）的责任完全在程序员身上。
<hr/>
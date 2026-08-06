# 可选形参与具名形参
(Optional Parameters and Named Parameters)

作为一个面向函数的语言，Koka给有可选形参与具名形参的函数调用提供了强大的支持。
<br/>
比如，`replace-all`函数要传入一个原string，一个模式（形参名：pattern）和一个替换者string（形参名：repl）。
```koka
fun world()
  replace-all("hi there", "there", "world")  // 返回 "hi world"
```
利用具名形参，我们也可以这样写这个函数调用：
```koka
fun world2()
  "hi there".replace-all( repl="world", pattern="there" )
```
可选参数这一语法允许您为形参指定默认值，从而不必在调用方填实参。
<br/>
我们定义一个函数 sublist，它接收一个列表、起始位置和所需子列表的长度 len。我们可以将 len 参数设置为可选，并默认使用输入列表的长度来返回起始位置之后的所有元素：
```koka
fun sublist( xs : list<a>, start : int, len : int = xs.length ) : list<a>
  if start <= 0 return xs.take(len)
  match xs
    Nil        -> Nil
    Cons(_,xx) -> xx.sublist(start - 1, len)
```
其中 len 参数实际已获得由问号表示的可选 int 类型，`len: ? int`。
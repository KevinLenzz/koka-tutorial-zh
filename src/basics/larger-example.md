# 更大的例子：破解凯撒编码
(A larger example: cracking Caesar encoding)

这是一个稍大的程序，灵感来自 Graham Hutton 最优秀的“Programming in Haskell”书中的一个示例：
```koka
import std/num/float64
// 英语字母频率表
val english = [8.2,1.5,2.8,4.3,12.7,2.2,
               2.0,6.1,7.0,0.2,0.8,4.0,2.4,
               6.7,7.5,1.9,0.1, 6.0,6.3,9.1,
               2.8,1.0,2.4,0.2,2.0,0.1]

// 小辅助函数
fun percent( n : int, m : int )
  100.0 * (n.float64 / m.float64)

fun rotate( xs : list<a>, n : int ) : list<a>
  xs.drop(n) ++ xs.take(n)

// 计算字符串的字母频率表
fun freqs( s : string ) : list<float64>
  val lowers = list('a','z')
  val occurs = lowers.map( fn(c) s.count(c.string) )
  val total  = occurs.sum
  occurs.map( fn(i) percent(i,total) )

// 根据卡方分布统计计算两个频率表的匹配程度
fun chisqr( xs : list<float64>, ys : list<float64> ) : float64
  zipwith(xs,ys, fn(x,y) ((x - y)^2.0)/y ).foldr(0.0,(+))

// 破解凯撒编码的字符串
fun uncaesar( s : string ) : string
  val table  = freqs(s)                   // 为s建一个频率表
  val chitab = list(0,25).map fn(n)       // 为0到25每种移位构建卡方数字列表
                 chisqr( table.rotate(n), english )

  val min    = chitab.minimum()           // 找到最小元素
  // 找到最小卡方值的位置 n，取负得到解码所需的反向移位
  val shift  = chitab.index-of( fn(f) f == min ).negate
  s.encode( shift )

fun test-uncaesar()
  println( uncaesar( "nrnd lv d ixq odqjxdjh" ) )
```
val 关键字声明一个静态值。在示例中，值 english 是浮点数（float64 类型）列表，表示每个字母的平均频率。函数 freqs 为特定字符串构建频率表，而函数 chisqr 计算两个频率表的匹配程度。在函数crack中，这些函数用于查找一个移位值，该值产生一个频率表与英语频率表最接近的字符串——我们用它来解码该字符串。
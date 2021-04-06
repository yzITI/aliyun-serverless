# 阿里云函数计算微框架

> Nodejs12, 使用表格存储

## 开始使用

将本项目目录下的`serverless`文件夹上传为一个函数计算“层”

在函数计算中:
```js
const { A, C, E, S } = require('/opt')

// E: export { initializer, handler }
module.exports = E

// A: apply handlers
A.get('/test/:name', (req) => {
  return [`Hello, ${req.params.name}`]
})
```

> 注意，设置域名路由时，需要设置`/test/*`。**请注意，`/test`不能访问**，合法路由包括：
> - `/test/hello/hahaha`
> - `/test/hello`
> - `/test/`

## 请求和响应

路由注册包含以下函数：
```js
A.get(router, func1, func2, ...)
A.post(router, func1, func2, ...)
A.put(router, func1, func2, ...)
A.delete(router, func1, func2, ...)
```

路由字符串必须包含域名路由本身，支持使用`:key`的方式提取路由参数。

处理函数可以传入任意多个，支持`async`函数，函数参数`req`约定如下：
```js
req: {
  url: String, // router + queries
  path: String, // router
  method: String,
  clientIP: String,
  queries: Object, // query params
  params: Object, // router params
  headers: Object, // header params
  body: Object // body params (if exist)
}
```
> 在一个请求的处理流程中，对`req`的修改会被保留并带入下一个处理函数。  
> 请求体仅支持JSON

返回值约定如下：
1. 若返回`false`，请求未结束，执行下一个函数
2. 若返回值不为`false`，则应该为一个数组`[response, status]`，其中`status`可以省略（默认值200）。此时，请求处理停止，返回`response`响应。
   - 若`response`为对象，则编码为JSON字符串，并且返回MIMETYPE `application/json`
   - 此外，`response`将被转化为字符串，并返回 MIMETYPE `text/html`

## 表格存储

通过调用`S`函数您可以访问表格存储。数据模型生成如下：
```js
model = S(tableName, pks = ['id'], version = 1)
// for example
m = S('user')
```

数据模型具有如下方法：
```js
// expose (or replace) client object
client: c => c ? client = c : client,

// get a row
async get (k, columns = [])

// scanning rows
getRange: async (start, end, columns = [])

// get up to 200 rows
getBatch: async (ks)

// put a row
put: async (k, attributes, condition = 'IGNORE')

// update a row
update: async (k, puts, dels = {}, condition = 'IGNORE')

// delete a row
delete: async (k, condition = 'IGNORE')
```

处理失败返回`false`。`get`函数成功返回数据对象，`getRange`和`getBatch`函数成功返回`{ [k]: dataObject }`。

数据对象在版本为1时包含`_timestamp`对象标记数据列的时间戳，否则是以版本号为key的对象。

## 自定义

为了方便应用开发，框架留出了`convention.js`，您可以定义应用内部的约定和辅助函数。

您可以重新编写`store.js`来应用表格存储以外的其它存储方式。

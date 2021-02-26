# Aliyun Serverless
 Framework Layer for Aliyun Function Compute

> Version 2.0

## Deploy

Upload `/serverless` as a layer. In functions:
```js
const { I, M, H, C } = require('/opt')
```

## Export

```js
{
  I: initializer,
  M: model,
  H: handler,
  C: convention
}
```

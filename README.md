JSON in JavaScript


Ilyasse BENRKIA
benrkyailyass@gmail.com

2020-04-19


JSON is a light-weight, language independent, data interchange format.
See http://www.JSON.org/

# JSONPARSER
Is a json parser that generates an [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of a valid JSON.
I created this parser for learning for 2 reasons:
  1. I intend to contribute to some OSS that requires some knowledge of how the parsers work.
  2. **I adore** destructing things to figure out the `magic` behind.

## Example
```js
const {JSONPARSER} = require('JSONPARSER')

const jsonString = '{}';

const ast = JSONPARSER.getAst(jsonString);

console.log(ast);
```
This results in:
```js
{
  type: Symbol(ObjectExpression),
  start: 0,
  end: 2,
  children: []
}
```
const {JSONPARSER} = require('../index');

const jsonString = `{
  "string": "ABCD",  
  "number": 12345,  
  "object": {},  
  "array" : [],  
  "true"  : true,  
  "false" : false,  
  "null"  : null
}`;

const ast = JSONPARSER.getAst(jsonString);

console.log(ast.init)
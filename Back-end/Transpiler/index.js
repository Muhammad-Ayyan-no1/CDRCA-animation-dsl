const tokenizer = require("./Tokenizer");
const parser = require("./Parser");
const Partial_transpiler = require("./Partial_transpiler");

let parser_INS = parser.create(tokenizer.defaultTokenizer);
let partial_transpiler_INS = Partial_transpiler.create(parser_INS);

let ast = parser_INS.parse(`
!--- PROP ABC :: comment ---
def PROP MyProp { console.log("hello world"); }
:: SUB HEADER ::
use MyProp(params) as Alias
add new action abc STAY_TIME LERP_TIME
:: END
!---END---
    `);

// console.log(JSON.stringify(ast, null, 2));

let Parttranspiled = partial_transpiler_INS.transpile(ast);
// console.log(JSON.stringify(Parttranspiled, null, 2));

module.exports = {
  transpile: (a) => {
    return "// working on completing this";
  },
};

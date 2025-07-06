const tokenizer = require("./Tokenizer");
const parser = require("./Parser");
const Partial_transpiler = require("./Partial_transpiler");
const postSemanticAnalyzier = require("./postSemanticAnalyizer");
const fullTranspiler = require("./FullTranspiler");
const postOptionalParser = require("./PostOptionalParsing");

let parser_INS = parser.create(tokenizer.defaultTokenizer);
let partial_transpiler_INS = Partial_transpiler.create(parser_INS);
let postSemanticAnalyizer_INS = postSemanticAnalyzier.create();
let fullTranspiler_INS = fullTranspiler.create();
let postOptionalParser_INS = postOptionalParser.create();

function main(cdrcaCode, options) {
  // tokenization to parsing
  let ast = parser_INS.parse(cdrcaCode);
  // parses induvidual statments and chunks
  let partialTranspiled = partial_transpiler_INS.transpile(ast);
  // orders those chunks (hoists etc) and adds automatic comments (options)
  let postSemanticAnalyzed = postSemanticAnalyizer_INS.analyze(
    partialTranspiled,
    ast,
    options
  );
  // fully combines the code and  template fills the chunks based on Renderer api
  let fullyTranspiled = fullTranspiler_INS.transpile(postSemanticAnalyzed);

  // pretifies code and other options (options)
  let postOptionalParsed = postOptionalParser_INS.update(
    fullyTranspiled,
    options
  );

  return (
    postOptionalParsed ||
    fullyTranspiled ||
    'console.error("An error occured during backend parsing, contact the devlopers and create a new issue with the error at github if your unsure at https://github.com/Muhammad-Ayyan-no1/CDRCA-animation-dsl/issues" + " error : for some unknown reason final transpiled JAVASCRIPT code was undefined")'
  );
}

// let ast = parser_INS.parse(`
// !--- PROP ABC :: comment ---
// def PROP MyProp { console.log("hello world"); }
// :: SUB HEADER ::
// use MyProp(params) as Alias
// add new action abc STAY_TIME LERP_TIME
// :: END
// !---END---
//     `);

// console.log(JSON.stringify(ast, null, 2));

// let Parttranspiled = partial_transpiler_INS.transpile(ast);
// console.log(JSON.stringify(Parttranspiled, null, 2));

console.log(
  main(
    `
!--- PROP ABC :: comment ---
:: SUB HEADER ::
use MyProp(params) as Alias
add new action abc STAY_TIME LERP_TIME
:: END
def PROP MyProp {
 console.log("hello world");
  }
!---END---
`,
    {
      addComments: true,
    }
  )
);

module.exports = {
  transpile: main,
};

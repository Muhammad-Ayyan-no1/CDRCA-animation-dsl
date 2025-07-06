function create() {
  function renderTemplate(template, input, context = {}) {
    let result = "";
    for (const element of template) {
      if ("str" in element) {
        result += element.str;
      } else if ("placeholder" in element) {
        const key = JSON.stringify(element.placeholder);
        if (key in input) {
          let values = input[key];
          if (element.preProcessor) {
            values = values.map(element.preProcessor);
          }
          let string = element.toString(values, context);
          if (element.postProcessor) {
            string = element.postProcessor(string);
          }
          result += string;
        } else {
          result += "//[missing]";
        }
      } else if ("conditional" in element) {
        const conditionResult = element.conditional.condition(context);
        if (conditionResult && element.template) {
          result += renderTemplate(element.template, input, context);
        }
      }
    }
    return result;
  }
  //PST = Post semantic tree
  function transpile(PST) {
    for (let i = 0; i < PST.length; i++) {
      console.log(PST[i]);
    }
    return "PST";
  }

  return { transpile };
}
module.exports = { create };

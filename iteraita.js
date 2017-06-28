'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse(`
A @ 1
`));

function getPegStr() {
    let backdash = '`';
    let regexpStr = `${backdash}\s!"'#$%&\(\)=-~\^\\\|@\[{\]}\+\*:;<>,\./\?`;
    let wspStr = ' \\t\\n\\r';
  return `
{
    function processRule () {
        // TODO:
    }
    function processSimpleOperator (name,a,b) {

        if (name==='<') {
            return (a && b);
        } else if (name==='=') {
            return (a || b);
        } else if (name==='>') {
            return (a % b);
        } else {
            // TODO:
        }
    }
}

Sequence
 = 
 _* name:Name _* '@' 
 _* rule:Rule 
 _* ('{'
     _* sequences:Sequence+
    _* '}')? 
 _* ( init:Init )?  
 {
    // TODO:
 }

Name
= [^a-z${regexpStr}][${regexpStr}]*

Rule = simple:SimpleRule _* ( '|' _* condition:Condition )?
{
    // TODO:
    processRule(simple, condition);
}

SimpleRule = 
Name 
/ Number
// TODO: combination

Condition
= UnbracedCondition 
/ '(' _*  condition:Condition _* ')' 
{
    return condition;
}

UnbracedCondition
= SimpleCondition 
/ simple:SimpleCondition _* 'and' _* condition:Condition
{
    return simple && condition;
}
/ simple:SimpleCondition _* 'or' _* condition:Condition
{
    return simple || condition;
}

SimpleCondition
= 
a:NumberFormula c:ConditionalOperator b:NumberFormula
{
    processSimpleCondition(c,a,b);
}
/ a:SequenceFormula c:ConditionalOperator b:SequenceFormula
{
    processSimpleCondition(c,a,b);
}
/ a:NumberFormula c:ConditionalOperator b:NumberFormula
{
    processSimpleCondition(c,a,b);
}


ConditionalOperator
= '<'
/ '='
/ '>'
/ '<='
/ '>='

Init
= SingleInit
/ SingleInit _* Init

SingleInit
= '[' _* simple:Rule _* ']' 
{
    // TODO:
    return simple;
}


Expression
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Integer

Number
  = _ (|\+|-)[0-9]*[.]*[0-9]+ { return parseFloat(text(); }

_ "wsp"
  = [${wspStr}]*
  `;
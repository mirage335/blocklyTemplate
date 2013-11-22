/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating c for procedure blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.c.procedures');

goog.require('Blockly.c');


Blockly.c['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is assigned.
  var globals = Blockly.Variables.allVariables(block);
  for (var i = globals.length - 1; i >= 0; i--) {
    var varName = globals[i];
    if (block.arguments_.indexOf(varName) == -1) {
      globals[i] = Blockly.c.variableDB_.getName(varName,
          Blockly.Variables.NAME_TYPE);
    } else {
      // This variable is actually a parameter name.  Do not include it in
      // the list of globals, thus allowing it be of local scope.
      globals.splice(i, 1);
    }
  }
  globals = globals.length ? '  global ' + globals.join(', ') + '\n' : '';
  var funcName = Blockly.c.variableDB_.getName(block.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.c.statementToCode(block, 'STACK');
  if (Blockly.c.INFINITE_LOOP_TRAP) {
    branch = Blockly.c.INFINITE_LOOP_TRAP.replace(/%1/g,
        '"' + block.id + '"') + branch;
  }
  var returnValue = Blockly.c.valueToCode(block, 'RETURN',
      Blockly.c.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + '\n';
  } else if (!branch) {
    branch = '  pass';
  }
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.c.variableDB_.getName(block.arguments_[x],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'def ' + funcName + '(' + args.join(', ') + '):\n' +
      globals + branch + returnValue;
  code = Blockly.c.scrub_(block, code);
  Blockly.c.definitions_[funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.c['procedures_defnoreturn'] =
    Blockly.c['procedures_defreturn'];

Blockly.c['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.c.variableDB_.getName(block.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.c.valueToCode(block, 'ARG' + x,
        Blockly.c.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.c.ORDER_FUNCTION_CALL];
};

Blockly.c['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.c.variableDB_.getName(block.getTitleValue('NAME'),
      Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var x = 0; x < block.arguments_.length; x++) {
    args[x] = Blockly.c.valueToCode(block, 'ARG' + x,
        Blockly.c.ORDER_NONE) || 'None';
  }
  var code = funcName + '(' + args.join(', ') + ')\n';
  return code;
};

Blockly.c['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.c.valueToCode(block, 'CONDITION',
      Blockly.c.ORDER_NONE) || 'False';
  var code = 'if ' + condition + ':\n';
  if (block.hasReturnValue_) {
    var value = Blockly.c.valueToCode(block, 'VALUE',
        Blockly.c.ORDER_NONE) || 'None';
    code += '  return ' + value + '\n';
  } else {
    code += '  return\n';
  }
  return code;
};

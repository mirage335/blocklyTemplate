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
 * @fileoverview Generating c for math blocks.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

goog.provide('Blockly.c.math');

goog.require('Blockly.c');


// If any new block imports any library, add that library name here.
Blockly.c.addReservedWords('math,random');

Blockly.c['math_number'] = function(block) {
  // Numeric value.
  var code = parseFloat(block.getTitleValue('NUM'));
  var order = code < 0 ? Blockly.c.ORDER_UNARY_SIGN :
              Blockly.c.ORDER_ATOMIC;
  return [code, order];
};

Blockly.c['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    ADD: [' + ', Blockly.c.ORDER_ADDITIVE],
    MINUS: [' - ', Blockly.c.ORDER_ADDITIVE],
    MULTIPLY: [' * ', Blockly.c.ORDER_MULTIPLICATIVE],
    DIVIDE: [' / ', Blockly.c.ORDER_MULTIPLICATIVE],
    POWER: [' ** ', Blockly.c.ORDER_EXPONENTIATION]
  };
  var tuple = OPERATORS[block.getTitleValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.c.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.c.valueToCode(block, 'B', order) || '0';
  var code = argument0 + operator + argument1;
  return [code, order];
  // In case of 'DIVIDE', division between integers returns different results
  // in c 2 and 3. However, is not an issue since Blockly does not
  // guarantee identical results in all languages.  To do otherwise would
  // require every operator to be wrapped in a function call.  This would kill
  // legibility of the generated code.  See:
  // http://code.google.com/p/blockly/wiki/Language
};

Blockly.c['math_single'] = function(block) {
  // Math operators with single operand.
  var operator = block.getTitleValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    var code = Blockly.c.valueToCode(block, 'NUM',
        Blockly.c.ORDER_UNARY_SIGN) || '0';
    return ['-' + code, Blockly.c.ORDER_UNARY_SIGN];
  }
  Blockly.c.definitions_['import_math'] = 'import math';
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.c.valueToCode(block, 'NUM',
        Blockly.c.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = Blockly.c.valueToCode(block, 'NUM',
        Blockly.c.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'math.fabs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'math.log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'math.log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'COS':
      code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'TAN':
      code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
      break;
  }
  if (code) {
    return [code, Blockly.c.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'math.asin(' + arg + ') / math.pi * 180';
      break;
    case 'ACOS':
      code = 'math.acos(' + arg + ') / math.pi * 180';
      break;
    case 'ATAN':
      code = 'math.atan(' + arg + ') / math.pi * 180';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.c.ORDER_MULTIPLICATIVE];
};

Blockly.c['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var CONSTANTS = {
    PI: ['math.pi', Blockly.c.ORDER_MEMBER],
    E: ['math.e', Blockly.c.ORDER_MEMBER],
    GOLDEN_RATIO: ['(1 + math.sqrt(5)) / 2', Blockly.c.ORDER_MULTIPLICATIVE],
    SQRT2: ['math.sqrt(2)', Blockly.c.ORDER_MEMBER],
    SQRT1_2: ['math.sqrt(1.0 / 2)', Blockly.c.ORDER_MEMBER],
    INFINITY: ['float(\'inf\')', Blockly.c.ORDER_ATOMIC]
  };
  var constant = block.getTitleValue('CONSTANT');
  if (constant != 'INFINITY') {
    Blockly.c.definitions_['import_math'] = 'import math';
  }
  return CONSTANTS[constant];
};

Blockly.c['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.c.valueToCode(block, 'NUMBER_TO_CHECK',
      Blockly.c.ORDER_MULTIPLICATIVE) || '0';
  var dropdown_property = block.getTitleValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    Blockly.c.definitions_['import_math'] = 'import math';
    var functionName = Blockly.c.provideFunction_(
        'isPrime',
        ['def ' + Blockly.c.FUNCTION_NAME_PLACEHOLDER_ + '(n):',
         '  # http://en.wikipedia.org/wiki/Primality_test#Naive_methods',
         '  # If n is not a number but a string, try parsing it.',
         '  if type(n) not in (int, float, long):',
         '    try:',
         '      n = float(n)',
         '    except:',
         '      return False',
         '  if n == 2 or n == 3:',
         '    return True',
         '  # False if n is negative, is 1, or not whole,' +
             ' or if n is divisible by 2 or 3.',
         '  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:',
         '    return False',
         '  # Check all the numbers of form 6k +/- 1, up to sqrt(n).',
         '  for x in range(6, int(math.sqrt(n)) + 2, 6):',
         '    if n % (x - 1) == 0 or n % (x + 1) == 0:',
         '      return False',
         '  return True']);
    code = functionName + '(' + number_to_check + ')';
    return [code, Blockly.c.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.c.valueToCode(block, 'DIVISOR',
          Blockly.c.ORDER_MULTIPLICATIVE);
      // If 'divisor' is some code that evals to 0, c will raise an error.
      if (!divisor || divisor == '0') {
        return ['False', Blockly.c.ORDER_ATOMIC];
      }
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.c.ORDER_RELATIONAL];
};

Blockly.c['math_change'] = function(block) {
  // Add to a variable in place.
  var argument0 = Blockly.c.valueToCode(block, 'DELTA',
      Blockly.c.ORDER_ADDITIVE) || '0';
  var varName = Blockly.c.variableDB_.getName(block.getTitleValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return varName + ' = (' + varName + ' if type(' + varName +
      ') in (int, float, long) else 0) + ' + argument0 + '\n';
};

// Rounding functions have a single operand.
Blockly.c['math_round'] = Blockly.c['math_single'];
// Trigonometry functions have a single operand.
Blockly.c['math_trig'] = Blockly.c['math_single'];

Blockly.c['math_on_list'] = function(block) {
  // Math functions for lists.
  var func = block.getTitleValue('OP');
  var list = Blockly.c.valueToCode(block, 'LIST',
      Blockly.c.ORDER_NONE) || '[]';
  var code;
  switch (func) {
    case 'SUM':
      code = 'sum(' + list + ')';
      break;
    case 'MIN':
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE':
      var functionName = Blockly.c.provideFunction_(
          'math_mean',
          // This operation excludes null and values that are not int or float:',
          // math_mean([null, null, "aString", 1, 9]) == 5.0.',
          ['def ' + Blockly.c.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
           '  localList = [e for e in myList if type(e) in (int, float, long)]',
           '  if not localList: return',
           '  return float(sum(localList)) / len(localList)']);
      code = functionName + '(' + list + ')';
      break;
    case 'MEDIAN':
      var functionName = Blockly.c.provideFunction_(
          'math_median',
          // This operation excludes null values:
          // math_median([null, null, 1, 3]) == 2.0.
          ['def ' + Blockly.c.FUNCTION_NAME_PLACEHOLDER_ + '(myList):',
           '  localList = sorted([e for e in myList ' +
               'if type(e) in (int, float, long)])',
           '  if not localList: return',
           '  if len(localList) % 2 == 0:',
           '    return (localList[len(localList) / 2 - 1] + ' +
               'localList[len(localList) / 2]) / 2.0',
           '  else:',
           '    return localList[(len(localList) - 1) / 2]']);
      code = functionName + '(' + list + ')';
      break;
    case 'MODE':
      var functionName = Blockly.c.provideFunction_(
          'math_modes',
          // As a list of numbers can contain more than one mode,
          // the returned result is provided as an array.
          // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
          ['def ' + Blockly.c.FUNCTION_NAME_PLACEHOLDER_ + '(some_list):',
           '  modes = []',
           '  # Using a lists of [item, count] to keep count rather than dict',
           '  # to avoid "unhashable" errors when the counted item is ' +
               'itself a list or dict.',
           '  counts = []',
           '  maxCount = 1',
           '  for item in some_list:',
           '    found = False',
           '    for count in counts:',
           '      if count[0] == item:',
           '        count[1] += 1',
           '        maxCount = max(maxCount, count[1])',
           '        found = True',
           '    if not found:',
           '      counts.append([item, 1])',
           '  for counted_item, item_count in counts:',
           '    if item_count == maxCount:',
           '      modes.append(counted_item)',
           '  return modes']);
      code = functionName + '(' + list + ')';
      break;
    case 'STD_DEV':
      Blockly.c.definitions_['import_math'] = 'import math';
      var functionName = Blockly.c.provideFunction_(
          'math_standard_deviation',
          ['def ' + Blockly.c.FUNCTION_NAME_PLACEHOLDER_ + '(numbers):',
           '  n = len(numbers)',
           '  if n == 0: return',
           '  mean = float(sum(numbers)) / n',
           '  variance = sum((x - mean) ** 2 for x in numbers) / n',
           '  return math.sqrt(variance)']);
      code = functionName + '(' + list + ')';
      break;
    case 'RANDOM':
      Blockly.c.definitions_['import_random'] = 'import random';
      code = 'random.choice(' + list + ')';
      break;
    default:
      throw 'Unknown operator: ' + func;
  }
  return [code, Blockly.c.ORDER_FUNCTION_CALL];
};

Blockly.c['math_modulo'] = function(block) {
  // Remainder computation.
  var argument0 = Blockly.c.valueToCode(block, 'DIVIDEND',
      Blockly.c.ORDER_MULTIPLICATIVE) || '0';
  var argument1 = Blockly.c.valueToCode(block, 'DIVISOR',
      Blockly.c.ORDER_MULTIPLICATIVE) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.c.ORDER_MULTIPLICATIVE];
};

Blockly.c['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  var argument0 = Blockly.c.valueToCode(block, 'VALUE',
      Blockly.c.ORDER_NONE) || '0';
  var argument1 = Blockly.c.valueToCode(block, 'LOW',
      Blockly.c.ORDER_NONE) || '0';
  var argument2 = Blockly.c.valueToCode(block, 'HIGH',
      Blockly.c.ORDER_NONE) || 'float(\'inf\')';
  var code = 'min(max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.c.ORDER_FUNCTION_CALL];
};

Blockly.c['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  Blockly.c.definitions_['import_random'] = 'import random';
  var argument0 = Blockly.c.valueToCode(block, 'FROM',
      Blockly.c.ORDER_NONE) || '0';
  var argument1 = Blockly.c.valueToCode(block, 'TO',
      Blockly.c.ORDER_NONE) || '0';
  var code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.c.ORDER_FUNCTION_CALL];
};

Blockly.c['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  Blockly.c.definitions_['import_random'] = 'import random';
  return ['random.random()', Blockly.c.ORDER_FUNCTION_CALL];
};

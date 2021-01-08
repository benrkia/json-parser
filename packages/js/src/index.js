const PARSER = (function () {

  const _parse = (str) => {

    {// Run a first check before start the parsing
      str = str + '';
      if (str.length === 0)
        throw new Error('Unexpected end of JSON input');
    }

    let curr = 0;
    const _orgLength = str.length;

    const WHITESPACES = [NaN, 0x0020, 0x000A, 0x000D, 0x0009];

    const NUMBER = {
      _0: '0',
      ONENINE: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      SIGNS: ['-', '+'],
      SIGNED: '-',
      FRACTION: '.',
      EXPs: ['E', 'e']
    }

    const CONSTANTS = {
      O_CB: '{',
      C_CB: '}',
      O_B: '[',
      C_B: ']',
      DQ: '"',
      COLON: ':',
      COMMA: ',',
      NULL: "null",
      TRUE: "true",
      FALSE: "false",
    };

    const TYPES = {
      ObjectExpression: Symbol.for("ObjectExpression"),
      ArrayExpression: Symbol.for("ArrayExpression"),
      NumberLiteral: Symbol.for("NumberLiteral"),
      BooleanLiteral: Symbol.for("BooleanLiteral"),
      StringLiteral: Symbol.for("StringLiteral"),
      NullLiteral: Symbol.for("NullLiteral"),
      Property: Symbol.for("Property"),
    }

    const skipWhitespace = () => {
      if (curr >= _orgLength)
        return;

      while (curr < _orgLength && WHITESPACES.indexOf(str[curr].codePointAt(0)) !== -1) {
        ++curr;
      }
    }

    const eatColon = () => {
      if (curr >= _orgLength)
        return;

      if (str[curr] !== CONSTANTS.COLON)
        throw new Error(`Unexpected token ${str[curr]} in JSON at position ${curr}`);
      ++curr;
    }

    const eatComma = () => {
      if (curr >= _orgLength)
        return;

      if (str[curr] !== CONSTANTS.COMMA)
        throw new Error(`Unexpected token ${str[curr]} in JSON at position ${curr}`);
      ++curr;
    }

    const isOneNine = (c) => {
      const { ONENINE } = NUMBER;
      return ONENINE.indexOf(c) !== -1;
    }

    const isDigit = (c) => {
      return c === NUMBER._0 || isOneNine(c);
    }

    const isSign = (c) => {
      return NUMBER.SIGNS.indexOf(c) !== -1;
    }

    const isSigned = (c) => {
      return c === NUMBER.SIGNED;
    }

    const isFraction = (c) => {
      return c === NUMBER.FRACTION;
    }

    const isExponent = (c) => {
      return NUMBER.EXPs.indexOf(c) !== -1;
    }

    const tryParseNumber = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      const isPotentialNumber = isDigit(str[curr]) || isSigned(str[curr]);
      if (!isPotentialNumber)
        return [undefined, curr];
      return parseNumber();
    }

    const validateOrThrow = (rawAndError) => {
      const [raw, errorPos] = rawAndError;

      if (errorPos !== -1)
        throw new Error(`Unexpected token ${str[errorPos]} in JSON at position ${errorPos}`);

      if (!raw)
        throw new Error('Unexpected end of JSON input');

      return raw;
    }

    const parseToMatch = (toBeMatched) => {
      if (curr >= _orgLength || !toBeMatched)
        return [undefined, -1];

      toBeMatched = toBeMatched + '';
      const toBeMatchedLength = toBeMatched.length;

      let errorPos = -1;
      let rawValue = '';

      for (let i = 0; i < toBeMatchedLength && curr < _orgLength; ++i) {
        if (toBeMatched[i] !== str[curr]) {
          errorPos = curr;
          break;
        }
        else {
          rawValue += str[curr];
        }
        ++curr;
      }

      if (rawValue.length !== toBeMatchedLength)
        rawValue = undefined;

      return [rawValue, errorPos];
    }

    const parseNull = () => {
      const start = curr;
      const [raw, errorPos] = parseToMatch(CONSTANTS.NULL);
      let value = undefined;

      if (raw !== undefined) {
        value = {
          type: TYPES.NullLiteral,
          start,
          end: curr,
          value: null,
          raw,
        };
      }

      return [value, errorPos];
    }

    const parseTrue = () => {
      const start = curr;
      const [raw, errorPos] = parseToMatch(CONSTANTS.TRUE);
      let value = undefined;

      if (raw !== undefined) {
        value = {
          type: TYPES.BooleanLiteral,
          start,
          end: curr,
          value: true,
          raw,
        };
      }

      return [value, errorPos];
    }

    const parseFalse = () => {
      const start = curr;
      const [raw, errorPos] = parseToMatch(CONSTANTS.FALSE);
      let value = undefined;

      if (raw !== undefined) {
        value = {
          type: TYPES.BooleanLiteral,
          start,
          end: curr,
          value: false,
          raw,
        };
      }

      return [value, errorPos];
    }

    const parseString = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      if (str[curr] !== CONSTANTS.DQ)
        return [undefined, curr];

      ++curr;
      let value = '';
      let stringExpression = {
        type: TYPES.StringLiteral,
        start: curr - 1,
      }

      while (curr < _orgLength && str[curr] !== CONSTANTS.DQ) {
        value += str[curr];
        ++curr;
      }

      if (curr >= _orgLength)
        stringExpression = undefined;
      else {
        ++curr;
        stringExpression = {
          ...stringExpression,
          end: curr,
          value,
          raw: CONSTANTS.DQ + value + CONSTANTS.DQ,
        }
      }

      return [stringExpression, -1];
    }

    const parseInteger = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      let value = '';
      let errorPos = -1;

      if (isSigned(str[curr])) {
        value = str[curr];
        ++curr;
      }


      if (!isDigit(str[curr])) {
        errorPos = curr;
      }
      else if (!isOneNine(str[curr])) {
        value += str[curr];
        ++curr;
      }
      else {
        while (curr < _orgLength && isDigit(str[curr])) {
          value += str[curr];
          ++curr;
        }
      }

      return [value, errorPos];
    }

    const parseFraction = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      let value = undefined;
      let errorPos = -1;

      if (!isFraction(str[curr])) {
        errorPos = curr;
      }
      else {
        value = str[curr];
        ++curr;

        if (!isDigit(str[curr])) {
          errorPos = curr;
        }

        while (curr < _orgLength && isDigit(str[curr])) {
          value += str[curr];
          ++curr;
        }
        if (!(value.length > 1))
          value = undefined;
      }

      return [value, errorPos];
    }

    const parseExponent = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      let value = undefined;
      let errorPos = -1;

      if (!isExponent(str[curr])) {
        errorPos = curr;
      }
      else {
        value = str[curr];
        ++curr;

        let minLength = 1;
        if (isSign(str[curr])) {
          ++minLength;
          value += str[curr];
          ++curr;
        }

        if (!isDigit(str[curr])) {
          errorPos = curr;
        }

        while (curr < _orgLength && isDigit(str[curr])) {
          value += str[curr];
          ++curr;
        }
        if (!(value.length > minLength))
          value = undefined;
      }

      return [value, errorPos];
    }

    const parseNumber = () => {

      let raw = '';
      let numberExpression = {
        type: TYPES.NumberLiteral,
        start: curr,
      }

      raw += validateOrThrow(parseInteger());
      if (isFraction(str[curr]))
        raw += validateOrThrow(parseFraction());
      if (isExponent(str[curr]))
        raw += validateOrThrow(parseExponent());

      numberExpression = {
        ...numberExpression,
        end: curr,
        value: parseFloat(raw),
        raw,
      }

      return [numberExpression, -1];
    }

    const parseObject = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      if (str[curr] !== CONSTANTS.O_CB)
        return [undefined, curr];

      ++curr;
      const objectExpressionChildren = [];
      let objectExpression = {
        type: TYPES.ObjectExpression,
        start: curr - 1,
      }
      let INIT = true;

      skipWhitespace();

      while (curr < _orgLength && str[curr] !== CONSTANTS.C_CB) {
        if (!INIT) {
          eatComma();
          skipWhitespace();
        }
        INIT = false;

        const propertyStart = curr;
        const propertyKey = validateOrThrow(parseString());

        skipWhitespace();
        eatColon();

        const propertyValue = parseElement();

        objectExpressionChildren.push({
          type: TYPES.Property,
          start: propertyStart,
          end: propertyValue.end,
          key: propertyKey,
          value: propertyValue,
        });
      }

      if (curr >= _orgLength)
        objectExpression = undefined;
      else {
        ++curr;
        objectExpression = {
          ...objectExpression,
          end: curr,
          children: objectExpressionChildren,
        }
      }

      return [objectExpression, -1];
    }

    const parseArray = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      if (str[curr] !== CONSTANTS.O_B)
        return [undefined, curr];

      ++curr;
      const arrayExpressionChildren = [];
      let arrayExpression = {
        type: TYPES.ArrayExpression,
        start: curr - 1,
      }
      let INIT = true;

      skipWhitespace();

      while (curr < _orgLength && str[curr] !== CONSTANTS.C_B) {
        if (!INIT) {
          eatComma();
        }
        INIT = false;

        const childrenValue = parseElement();

        arrayExpressionChildren.push(childrenValue);
      }

      if (curr >= _orgLength)
        arrayExpression = undefined;
      else {
        ++curr;
        arrayExpression = {
          ...arrayExpression,
          end: curr,
          children: arrayExpressionChildren,
        }
      }

      return [arrayExpression, -1];
    }

    const parseValue = () => {
      if (curr >= _orgLength)
        return [undefined, -1];

      switch (str[curr]) {
        case CONSTANTS.O_CB:
          return parseObject();
        case CONSTANTS.DQ:
          return parseString();
        case CONSTANTS.O_B:
          return parseArray();
        case CONSTANTS.TRUE[0]:
          return parseTrue();
        case CONSTANTS.FALSE[0]:
          return parseFalse();
        case CONSTANTS.NULL[0]:
          return parseNull();
        default:
          return tryParseNumber();
      }
    }

    const parseElement = () => {
      skipWhitespace();
      const valueAndError = parseValue();
      const value = validateOrThrow(valueAndError);
      skipWhitespace();

      return value;
    }

    const parseJson = () => {

      const element = parseElement();

      if (curr < _orgLength) {
        throw new Error(`Unexpected token ${str[curr]} in JSON at position ${curr}`);
      }

      return element;
    }

    return parseJson();

  }

  const getAst = (str) => {
    return _parse(str);
  }

  return {
    getAst
  }
}());

// Update to use UMD
exports.JSONPARSER = PARSER;

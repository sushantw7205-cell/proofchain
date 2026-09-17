/* ============================================
   QUESTIONS.JS — Question bank per skill
   ============================================
   Each question has:
   - q: the question text
   - options: array of 4 answers
   - correct: index (0-3) of the correct answer
   ============================================ */

var QUESTIONS = {

  'JavaScript': [
    {
      q: 'What does `typeof null` return in JavaScript?',
      options: ['"null"', '"object"', '"undefined"', '"number"'],
      correct: 1
    },
    {
      q: 'Which method removes the last element from an array?',
      options: ['shift()', 'pop()', 'push()', 'slice()'],
      correct: 1
    },
    {
      q: 'What is the result of `2 + "2"` in JavaScript?',
      options: ['4', '"22"', 'NaN', 'Error'],
      correct: 1
    },
    {
      q: 'Which keyword creates a block-scoped variable?',
      options: ['var', 'let', 'global', 'static'],
      correct: 1
    },
    {
      q: 'What does `===` compare?',
      options: ['Value only', 'Type only', 'Value and type', 'Reference only'],
      correct: 2
    }
  ],

  'HTML': [
    {
      q: 'Which tag creates a hyperlink?',
      options: ['<link>', '<a>', '<href>', '<url>'],
      correct: 1
    },
    {
      q: 'Which HTML5 tag defines a navigation section?',
      options: ['<nav>', '<header>', '<section>', '<menu>'],
      correct: 0
    },
    {
      q: 'What does the `<meta charset="UTF-8">` tag do?',
      options: [
        'Sets the page title',
        'Defines character encoding',
        'Links a stylesheet',
        'Adds a favicon'
      ],
      correct: 1
    },
    {
      q: 'Which attribute makes an input field required?',
      options: ['validate', 'must', 'required', 'mandatory'],
      correct: 2
    },
    {
      q: 'What is the correct HTML5 doctype?',
      options: [
        '<!DOCTYPE HTML PUBLIC>',
        '<!DOCTYPE html>',
        '<doctype html>',
        '<html5>'
      ],
      correct: 1
    }
  ],

  'CSS': [
    {
      q: 'Which property changes text color?',
      options: ['font-color', 'text-color', 'color', 'foreground'],
      correct: 2
    },
    {
      q: 'Which display value makes an element a flex container?',
      options: ['block', 'flex', 'inline-block', 'grid'],
      correct: 1
    },
    {
      q: 'What does `position: absolute` do?',
      options: [
        'Positions relative to the page',
        'Positions relative to the nearest positioned ancestor',
        'Positions at the top-left of the viewport',
        'Nothing changes'
      ],
      correct: 1
    },
    {
      q: 'Which unit is relative to the root font size?',
      options: ['px', 'em', 'rem', 'vh'],
      correct: 2
    },
    {
      q: 'What is the default value of `box-sizing`?',
      options: ['border-box', 'content-box', 'padding-box', 'inherit'],
      correct: 1
    }
  ],

  'SQL': [
    {
      q: 'Which clause filters rows in a SELECT query?',
      options: ['WHERE', 'HAVING', 'FILTER', 'IF'],
      correct: 0
    },
    {
      q: 'Which JOIN returns only matching rows from both tables?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN'],
      correct: 2
    },
    {
      q: 'What does `GROUP BY` do?',
      options: [
        'Sorts the results',
        'Groups rows by a column',
        'Limits the number of rows',
        'Joins two tables'
      ],
      correct: 1
    },
    {
      q: 'Which command removes a table but keeps its structure?',
      options: ['DROP TABLE', 'DELETE TABLE', 'TRUNCATE TABLE', 'REMOVE TABLE'],
      correct: 2
    },
    {
      q: 'Which function counts the number of rows?',
      options: ['SUM()', 'TOTAL()', 'COUNT()', 'LEN()'],
      correct: 2
    }
  ],

  'Python': [
    {
      q: 'Which keyword defines a function in Python?',
      options: ['function', 'def', 'fun', 'func'],
      correct: 1
    },
    {
      q: 'What is the correct way to create a list?',
      options: ['[1, 2, 3]', '{1, 2, 3}', '(1, 2, 3)', '<1, 2, 3>'],
      correct: 0
    },
    {
      q: 'Which method adds an item to the end of a list?',
      options: ['push()', 'add()', 'append()', 'insert()'],
      correct: 2
    },
    {
      q: 'What does `len("hello")` return?',
      options: ['4', '5', '6', 'Error'],
      correct: 1
    },
    {
      q: 'Which is used for comments in Python?',
      options: ['//', '/* */', '#', '--'],
      correct: 2
    }
  ]
};

/* Default questions for unknown skills */
var DEFAULT_QUESTIONS = [
  {
    q: 'What is this skill primarily used for?',
    options: ['Web development', 'Data analysis', 'Automation', 'All of the above'],
    correct: 3
  },
  {
    q: 'Is this skill beginner-friendly?',
    options: ['Yes', 'No', 'Sometimes', 'Depends'],
    correct: 0
  }
];
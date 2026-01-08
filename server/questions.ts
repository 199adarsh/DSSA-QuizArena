import { Question } from "@shared/schema";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "MCQ_SINGLE",
    text: "Which of the following is NOT a JavaScript data type?",
    options: ["Symbol", "Boolean", "Float", "BigInt"],
    correctAnswer: "Float",
    difficulty: "EASY",
    explanation: "Float is not a primitive data type in JavaScript. Numbers are always floating-point, but the type is just 'Number'."
  },
  {
    id: "q2",
    type: "MCQ_SINGLE",
    text: "What is the output of the following code?",
    codeSnippet: "console.log(typeof NaN);",
    options: ["'number'", "'NaN'", "'undefined'", "'object'"],
    correctAnswer: "'number'",
    difficulty: "EASY",
    explanation: "NaN stands for 'Not-a-Number', but its type is technically 'number'."
  },
  {
    id: "q3",
    type: "MCQ_MULTI",
    text: "Which of these are valid ways to declare a variable in modern JavaScript?",
    options: ["var", "let", "const", "def"],
    correctAnswer: ["var", "let", "const"],
    difficulty: "EASY",
    explanation: "'def' is used in Python, not JavaScript."
  },
  {
    id: "q4",
    type: "MCQ_SINGLE",
    text: "What does the 'useEffect' hook do in React?",
    options: ["Manages state", "Performs side effects", "Creates a reference", "Optimizes rendering"],
    correctAnswer: "Performs side effects",
    difficulty: "MEDIUM"
  },
  {
    id: "q5",
    type: "TRUE_FALSE",
    text: "In JavaScript, 'null' is an object.",
    options: ["True", "False"],
    correctAnswer: "True",
    difficulty: "MEDIUM",
    explanation: "This is a long-standing bug in JS. typeof null returns 'object'."
  },
  {
    id: "q6",
    type: "MCQ_SINGLE",
    text: "What is the time complexity of searching in a Hash Map (average case)?",
    options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
    correctAnswer: "O(1)",
    difficulty: "MEDIUM"
  },
  {
    id: "q7",
    type: "MCQ_SINGLE",
    text: "Which method is used to remove the last element from an array?",
    options: ["shift()", "pop()", "push()", "unshift()"],
    correctAnswer: "pop()",
    difficulty: "EASY"
  },
  {
    id: "q8",
    type: "CODE",
    text: "What will this code log?",
    codeSnippet: "const a = [1, 2, 3];\nconst b = a;\nb.push(4);\nconsole.log(a.length);",
    options: ["3", "4", "undefined", "Error"],
    correctAnswer: "4",
    difficulty: "MEDIUM",
    explanation: "Arrays are reference types. 'b' references the same array as 'a'."
  },
  {
    id: "q9",
    type: "MCQ_SINGLE",
    text: "Which HTTP status code represents 'Teapot'?",
    options: ["404", "500", "418", "200"],
    correctAnswer: "418",
    difficulty: "HARD",
    explanation: "418 I'm a teapot is an RFC 2324 joke code."
  },
  {
    id: "q10",
    type: "MCQ_SINGLE",
    text: "What is 'Hoisting' in JavaScript?",
    options: ["Lifting heavy weights", "Moving declarations to the top", "Moving initializations to the top", "None of the above"],
    correctAnswer: "Moving declarations to the top",
    difficulty: "MEDIUM"
  }
];

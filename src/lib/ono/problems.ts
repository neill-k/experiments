/**
 * O(no) problem definitions.
 * Each problem includes test cases and optimal baselines for scoring.
 */

import type { Category, Difficulty } from './constants'

export interface TestCase {
  input: unknown[]
  expected: unknown
}

export interface Problem {
  slug: string
  title: string
  description: string
  constraints: string
  category: Category
  difficulty: Difficulty
  functionName: string
  functionSig: string
  testCases: TestCase[]
  optimalCode: string
  optimalLoc: number
  optimalTimeMs: number
  optimalMemoryBytes: number
}

/**
 * Seed problems for MVP launch.
 * Descriptions are written deadpan, as if these are legitimate interview questions.
 */
export const SEED_PROBLEMS: Problem[] = [
  {
    slug: 'two-sum',
    title: 'Two Sum',
    description:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou may return the answer in any order.',
    constraints:
      'Your solution must be correct. We cannot stress this enough. It must also terminate. Eventually.',
    category: 'classic',
    difficulty: 'hard',
    functionName: 'two_sum',
    functionSig: 'def two_sum(nums: list[int], target: int) -> list[int]',
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[1, 5, 8, 3, 9, 2], 11], expected: [1, 3] },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3] },
    ],
    optimalCode: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`,
    optimalLoc: 6,
    optimalTimeMs: 0.01,
    optimalMemoryBytes: 1024,
  },
  {
    slug: 'fizzbuzz',
    title: 'FizzBuzz',
    description:
      'Given an integer `n`, return a list of strings where for each number from 1 to n:\n\n- If the number is divisible by 3, the string is `"Fizz"`\n- If the number is divisible by 5, the string is `"Buzz"`\n- If the number is divisible by both 3 and 5, the string is `"FizzBuzz"`\n- Otherwise, the string is the number itself\n\nThis is a standard screening question. Your solution should reflect the gravity of that responsibility.',
    constraints:
      'Constraints: 1 <= n <= 10000. Your solution must produce the correct output. This is non-negotiable.',
    category: 'classic',
    difficulty: 'legendary',
    functionName: 'fizzbuzz',
    functionSig: 'def fizzbuzz(n: int) -> list[str]',
    testCases: [
      { input: [1], expected: ['1'] },
      { input: [3], expected: ['1', '2', 'Fizz'] },
      { input: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      {
        input: [15],
        expected: [
          '1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz',
          '11', 'Fizz', '13', '14', 'FizzBuzz',
        ],
      },
      {
        input: [20],
        expected: [
          '1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz',
          '11', 'Fizz', '13', '14', 'FizzBuzz', '16', '17', 'Fizz', '19', 'Buzz',
        ],
      },
    ],
    optimalCode: `def fizzbuzz(n):
    return ['FizzBuzz' if i%15==0 else 'Fizz' if i%3==0 else 'Buzz' if i%5==0 else str(i) for i in range(1,n+1)]`,
    optimalLoc: 2,
    optimalTimeMs: 0.05,
    optimalMemoryBytes: 2048,
  },
  {
    slug: 'reverse-string',
    title: 'Reverse a String',
    description:
      'Given a string `s`, return the string reversed.\n\nThis problem has been asked in over 47,000 technical interviews. The optimal solution is one line of Python. Your task is to ensure no interviewer will ever ask it again.',
    constraints:
      'Your solution must return the correct reversed string. Speed is not a concern. Nothing is a concern anymore.',
    category: 'classic',
    difficulty: 'legendary',
    functionName: 'reverse_string',
    functionSig: 'def reverse_string(s: str) -> str',
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: [''], expected: '' },
      { input: ['a'], expected: 'a' },
      { input: ['racecar'], expected: 'racecar' },
      { input: ['OpenAI'], expected: 'IAnepO' },
      { input: ['The quick brown fox'], expected: 'xof nworb kciuq ehT' },
    ],
    optimalCode: `def reverse_string(s):
    return s[::-1]`,
    optimalLoc: 2,
    optimalTimeMs: 0.001,
    optimalMemoryBytes: 512,
  },
  {
    slug: 'is-palindrome',
    title: 'Valid Palindrome',
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `True` if it is a palindrome, or `False` otherwise.\n\nPlease approach this with the seriousness it deserves.',
    constraints:
      'Constraints: 1 <= len(s) <= 200000. Your solution must be correct. Alphanumeric only. Case insensitive.',
    category: 'classic',
    difficulty: 'hard',
    functionName: 'is_palindrome',
    functionSig: 'def is_palindrome(s: str) -> bool',
    testCases: [
      { input: ['A man, a plan, a canal: Panama'], expected: true },
      { input: ['race a car'], expected: false },
      { input: [' '], expected: true },
      { input: ['Was it a car or a cat I saw?'], expected: true },
      { input: ['hello'], expected: false },
      { input: ['aa'], expected: true },
    ],
    optimalCode: `def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]`,
    optimalLoc: 3,
    optimalTimeMs: 0.01,
    optimalMemoryBytes: 1024,
  },
  {
    slug: 'fibonacci',
    title: 'Fibonacci Number',
    description:
      'The Fibonacci numbers, commonly denoted `F(n)`, form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\nGiven `n`, calculate `F(n)`.\n\nThe optimal solution runs in O(n) time. We trust you will find a more... expressive approach.',
    constraints:
      'Constraints: 0 <= n <= 30. Your answer must be mathematically correct. The path you take to get there is between you and your conscience.',
    category: 'classic',
    difficulty: 'medium',
    functionName: 'fibonacci',
    functionSig: 'def fibonacci(n: int) -> int',
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [2], expected: 1 },
      { input: [5], expected: 5 },
      { input: [10], expected: 55 },
      { input: [20], expected: 6765 },
      { input: [30], expected: 832040 },
    ],
    optimalCode: `def fibonacci(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
    optimalLoc: 5,
    optimalTimeMs: 0.001,
    optimalMemoryBytes: 256,
  },
  {
    slug: 'find-maximum',
    title: 'Find the Maximum',
    description:
      'Given a non-empty list of integers, return the maximum value.\n\nPython provides `max()`. We provide the opportunity to pretend it doesn\'t exist.',
    constraints:
      'Constraints: 1 <= len(nums) <= 10000. The list is non-empty. Your solution must return the largest integer. We will verify this.',
    category: 'classic',
    difficulty: 'legendary',
    functionName: 'find_maximum',
    functionSig: 'def find_maximum(nums: list[int]) -> int',
    testCases: [
      { input: [[1]], expected: 1 },
      { input: [[3, 1, 2]], expected: 3 },
      { input: [[-1, -5, -3]], expected: -1 },
      { input: [[42, 42, 42]], expected: 42 },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], expected: 10 },
      { input: [[-100, 0, 100]], expected: 100 },
    ],
    optimalCode: `def find_maximum(nums):
    return max(nums)`,
    optimalLoc: 2,
    optimalTimeMs: 0.001,
    optimalMemoryBytes: 256,
  },
  {
    slug: 'binary-search',
    title: 'Binary Search',
    description:
      'Given a sorted array of distinct integers `nums` and a target value `target`, return the index if the target is found. If not, return `-1`.\n\nThe expected approach is O(log n). We expect you to find a different approach.',
    constraints:
      'Constraints: 1 <= len(nums) <= 10000. All integers are unique and sorted in ascending order. Your solution must return the correct index.',
    category: 'classic',
    difficulty: 'medium',
    functionName: 'binary_search',
    functionSig: 'def binary_search(nums: list[int], target: int) -> int',
    testCases: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { input: [[5], 5], expected: 0 },
      { input: [[1, 2, 3, 4, 5], 1], expected: 0 },
      { input: [[1, 2, 3, 4, 5], 5], expected: 4 },
      { input: [[1, 2, 3, 4, 5], 6], expected: -1 },
    ],
    optimalCode: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1`,
    optimalLoc: 8,
    optimalTimeMs: 0.001,
    optimalMemoryBytes: 256,
  },
  {
    slug: 'count-words',
    title: 'Word Frequency Count',
    description:
      'Given a string `text`, return a dictionary mapping each word (lowercased) to its frequency count. Words are separated by whitespace.\n\nPython\'s `collections.Counter` solves this in one line. We believe in you to find a longer path.',
    constraints:
      'Constraints: Words are separated by whitespace. Convert to lowercase. Return a dict (or Counter). Punctuation stays attached to words.',
    category: 'classic',
    difficulty: 'hard',
    functionName: 'count_words',
    functionSig: 'def count_words(text: str) -> dict[str, int]',
    testCases: [
      { input: ['hello world'], expected: { hello: 1, world: 1 } },
      { input: ['the the the'], expected: { the: 3 } },
      { input: [''], expected: {} },
      { input: ['One one ONE'], expected: { one: 3 } },
      {
        input: ['the quick brown fox jumps over the lazy dog'],
        expected: { the: 2, quick: 1, brown: 1, fox: 1, jumps: 1, over: 1, lazy: 1, dog: 1 },
      },
    ],
    optimalCode: `def count_words(text):
    from collections import Counter
    return dict(Counter(text.lower().split()))`,
    optimalLoc: 3,
    optimalTimeMs: 0.01,
    optimalMemoryBytes: 1024,
  },
  {
    slug: 'sort-array',
    title: 'Sort an Array',
    description:
      'Given an array of integers `nums`, sort the array in ascending order and return it.\n\nPython\'s built-in `sorted()` uses Timsort — O(n log n), stable, elegant. Your solution should aspire to none of these qualities.',
    constraints:
      'Constraints: 1 <= len(nums) <= 5000. The output must be sorted in non-decreasing order. How you get there is your burden to bear.',
    category: 'classic',
    difficulty: 'easy',
    functionName: 'sort_array',
    functionSig: 'def sort_array(nums: list[int]) -> list[int]',
    testCases: [
      { input: [[5, 2, 3, 1]], expected: [1, 2, 3, 5] },
      { input: [[5, 1, 1, 2, 0, 0]], expected: [0, 0, 1, 1, 2, 5] },
      { input: [[1]], expected: [1] },
      { input: [[3, 2, 1]], expected: [1, 2, 3] },
      { input: [[-4, 0, 7, 4, 9, -5, -1, 0]], expected: [-5, -4, -1, 0, 0, 4, 7, 9] },
    ],
    optimalCode: `def sort_array(nums):
    return sorted(nums)`,
    optimalLoc: 2,
    optimalTimeMs: 0.01,
    optimalMemoryBytes: 1024,
  },
  {
    slug: 'even-or-odd',
    title: 'Even or Odd',
    description:
      'Given an integer `n`, return `"even"` if `n` is even, or `"odd"` if `n` is odd.\n\nThis problem is typically solved with a single modulo operation. In the O(no) tradition, we encourage you to consider whether a machine learning model might be more appropriate.',
    constraints:
      'Constraints: -1000000 <= n <= 1000000. Your solution must correctly classify the integer. That\'s it. That\'s the whole requirement.',
    category: 'ml',
    difficulty: 'legendary',
    functionName: 'even_or_odd',
    functionSig: 'def even_or_odd(n: int) -> str',
    testCases: [
      { input: [0], expected: 'even' },
      { input: [1], expected: 'odd' },
      { input: [2], expected: 'even' },
      { input: [-3], expected: 'odd' },
      { input: [100], expected: 'even' },
      { input: [999999], expected: 'odd' },
      { input: [-42], expected: 'even' },
    ],
    optimalCode: `def even_or_odd(n):
    return 'even' if n % 2 == 0 else 'odd'`,
    optimalLoc: 2,
    optimalTimeMs: 0.001,
    optimalMemoryBytes: 256,
  },
]

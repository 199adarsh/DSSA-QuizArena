import { z } from 'zod';
import { Attempt } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    user: {
      method: 'GET' as const,
      path: '/api/auth/user',
      responses: {
        200: z.object({
          id: z.string(),
          email: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          profileImageUrl: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  quiz: {
    status: {
      method: 'GET' as const,
      path: '/api/quiz/status',
      responses: {
        200: z.object({
          canAttempt: z.boolean(),
          activeAttempt: z.custom<Attempt>().optional(),
          completedAttempt: z.custom<Attempt>().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/quiz/start',
      responses: {
        201: z.object({
          attemptId: z.number(),
          questions: z.array(z.object({
            id: z.string(),
            type: z.enum(["MCQ_SINGLE", "MCQ_MULTI", "TRUE_FALSE", "CODE"]),
            text: z.string(),
            options: z.array(z.string()).optional(),
            difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
            codeSnippet: z.string().optional(),
          })),
          startTime: z.string(),
        }),
        400: errorSchemas.validation, // Already started
        401: errorSchemas.unauthorized,
      },
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/quiz/answer',
      input: z.object({
        questionId: z.string(),
        answer: z.union([z.string(), z.array(z.string())]),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    finish: {
      method: 'POST' as const,
      path: '/api/quiz/finish',
      responses: {
        200: z.custom<Attempt>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  leaderboard: {
    list: {
      method: 'GET' as const,
      path: '/api/leaderboard',
      responses: {
        200: z.array(z.object({
          rank: z.number(),
          username: z.string(),
          score: z.number(),
          accuracy: z.number(),
          timeTaken: z.string(),
          profileImageUrl: z.string().optional().nullable(),
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

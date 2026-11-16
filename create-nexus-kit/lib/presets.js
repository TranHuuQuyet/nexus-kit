export const PRESETS = {
  nextjs: {
    id: 'nextjs',
    name: 'Next.js 15 (App Router)',
    techStack: 'TypeScript 5, Next.js 15 (App Router), Tailwind CSS, Vitest, Zod'
  },
  fastapi: {
    id: 'fastapi',
    name: 'Python FastAPI',
    techStack: 'Python 3.12, FastAPI, Pydantic v2, Pytest, SQLAlchemy'
  },
  nestjs: {
    id: 'nestjs',
    name: 'NestJS Backend',
    techStack: 'TypeScript 5, NestJS 10, Jest, Prisma'
  },
  react: {
    id: 'react',
    name: 'React 19 + Vite',
    techStack: 'TypeScript 5, Vite, React 19, Tailwind CSS, Vitest'
  },
  node: {
    id: 'node',
    name: 'Node.js (ES Modules)',
    techStack: 'Node.js 20+ (ES Modules), Vitest'
  }
};

export const PRESET_ALIASES = {
  next: 'nextjs',
  python: 'fastapi',
  nest: 'nestjs',
  vite: 'react',
  minimal: 'node'
};

export function resolvePreset(presetName) {
  if (!presetName) return null;
  const key = String(presetName).toLowerCase().trim();
  const canonical = PRESET_ALIASES[key] || key;
  return PRESETS[canonical] || null;
}

const NEW_PROJECT_BASE_NAME = 'New Project';

function parseNewProjectOrdinal(name: string): number | null {
  const trimmed = name.trim();
  const match = /^new\s+project(?:\s+(\d+))?$/i.exec(trimmed);
  if (!match) return null;

  if (!match[1]) {
    return 1;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed) || parsed <= 1) {
    return 1;
  }

  return parsed;
}

export function getNextNewProjectName(existingNames: string[]): string {
  const used = new Set<number>();

  for (const name of existingNames) {
    const ordinal = parseNewProjectOrdinal(name);
    if (ordinal !== null) {
      used.add(ordinal);
    }
  }

  if (!used.has(1)) {
    return NEW_PROJECT_BASE_NAME;
  }

  let next = 2;
  while (used.has(next)) {
    next += 1;
  }

  return `${NEW_PROJECT_BASE_NAME} ${next}`;
}

export { NEW_PROJECT_BASE_NAME };

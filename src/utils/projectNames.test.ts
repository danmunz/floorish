import { describe, expect, it } from 'vitest';
import { getNextNewProjectName, NEW_PROJECT_BASE_NAME } from './projectNames';

describe('getNextNewProjectName', () => {
  it('returns base name when there are no project names', () => {
    expect(getNextNewProjectName([])).toBe(NEW_PROJECT_BASE_NAME);
  });

  it('returns base name when existing names do not match the new project pattern', () => {
    expect(getNextNewProjectName(['Kitchen Plan', 'Client Draft'])).toBe(NEW_PROJECT_BASE_NAME);
  });

  it('returns New Project 2 when base name is already taken', () => {
    expect(getNextNewProjectName(['New Project'])).toBe('New Project 2');
  });

  it('returns the first available numeric suffix from 2 onward', () => {
    expect(getNextNewProjectName(['New Project', 'New Project 2', 'New Project 4'])).toBe('New Project 3');
  });

  it('treats casing and extra spacing as valid matches', () => {
    expect(getNextNewProjectName([' new project ', 'NEW PROJECT 2'])).toBe('New Project 3');
  });

  it('ignores names outside the expected scheme and keeps numbering deterministic', () => {
    expect(getNextNewProjectName(['New Project', 'New Project 1', 'New Project 8', 'New Project - copy'])).toBe('New Project 2');
  });
});

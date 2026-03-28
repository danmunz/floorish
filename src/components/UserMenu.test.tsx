import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UserMenu } from './UserMenu';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

const baseAuthState = {
  user: {
    email: 'sam@example.com',
    user_metadata: {
      full_name: 'Sam Example',
      avatar_url: null,
    },
  },
  session: null,
  loading: false,
  isGuest: false,
  signInWithGoogle: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  continueAsGuest: vi.fn(),
};

function setBmcSlug(slug?: string) {
  (import.meta.env as Record<string, string | undefined>).VITE_BMC_SLUG = slug;
}

function getBmcScript() {
  return document.querySelector(
    'script[src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"]'
  ) as HTMLScriptElement | null;
}

describe('UserMenu', () => {
  const originalBmcSlug = import.meta.env.VITE_BMC_SLUG;

  beforeEach(() => {
    vi.clearAllMocks();
    setBmcSlug(originalBmcSlug);
  });

  it('renders guest sign-in button for guest users', () => {
    mockedUseAuth.mockReturnValue({
      ...baseAuthState,
      user: null,
      isGuest: true,
    } as never);

    render(<UserMenu />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sam/i })).not.toBeInTheDocument();
  });

  it('injects buy me a coffee script for signed-in users', async () => {
    setBmcSlug('danmunz');
    mockedUseAuth.mockReturnValue(baseAuthState as never);

    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /sam/i }));

    await waitFor(() => {
      expect(getBmcScript()).toBeInTheDocument();
    });

    const script = getBmcScript();
    expect(script).toHaveAttribute('data-name', 'bmc-button');
    expect(script).toHaveAttribute('data-slug', 'danmunz');
    expect(script).toHaveAttribute('data-color', '#264653');
    expect(script).toHaveAttribute('data-emoji', '☕');
    expect(script).toHaveAttribute('data-font', 'Inter');
    expect(script).toHaveAttribute('data-text', 'Buy me a coffee');
    expect(script).toHaveAttribute('data-outline-color', '#ffffff');
    expect(script).toHaveAttribute('data-font-color', '#ffffff');
    expect(script).toHaveAttribute('data-coffee-color', '#FFDD00');
  });

  it('falls back to danmunz slug when env value is empty', async () => {
    setBmcSlug('');
    mockedUseAuth.mockReturnValue(baseAuthState as never);

    render(<UserMenu />);
    fireEvent.click(screen.getByRole('button', { name: /sam/i }));

    await waitFor(() => {
      expect(getBmcScript()).toBeInTheDocument();
    });

    expect(getBmcScript()).toHaveAttribute('data-slug', 'danmunz');
  });
});

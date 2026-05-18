import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Identity mock: render next-intl `Link` as a plain `<a>` so jsdom
// doesn't need a locale provider and `href` asserts keep working.
vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={typeof href === 'string' ? href : ''} {...rest}>
      {children}
    </a>
  ),
}));

import { CtaBanner } from '../cta-banner';

describe('CtaBanner', () => {
  afterEach(() => cleanup());

  it('renders the title; no subtitle by default', () => {
    render(
      <CtaBanner
        title="Únete"
        buttons={[{ label: 'Ir', href: '/x', variant: 'mustard' }]}
      />,
    );
    const h2 = screen.getByRole('heading', { level: 2, name: 'Únete' });
    expect(h2).toBeInTheDocument();
    expect(h2.className).toContain('mb-9');
  });

  it('renders the subtitle and tightens the heading margin', () => {
    render(
      <CtaBanner
        title="Únete"
        subtitle="Texto de apoyo"
        buttons={[{ label: 'Ir', href: '/x', variant: 'mustard' }]}
      />,
    );
    expect(screen.getByText('Texto de apoyo')).toBeInTheDocument();
    const h2 = screen.getByRole('heading', { level: 2, name: 'Únete' });
    expect(h2.className).toContain('mb-4');
    expect(h2.className).not.toContain('mb-9');
  });

  it('renders a link button with href', () => {
    render(
      <CtaBanner
        title="T"
        buttons={[{ label: 'Contratar', href: '/contratar', variant: 'mustard' }]}
      />,
    );
    const link = screen.getByRole('link', { name: 'Contratar' });
    expect(link).toHaveAttribute('href', '/contratar');
  });

  it('renders an inert/disabled button (no href) when disabled', () => {
    render(
      <CtaBanner
        title="T"
        buttons={[{ label: 'Reservar', variant: 'mustard', disabled: true }]}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Reservar' })).toBeNull();
    const btn = screen.getByRole('button', { name: 'Reservar' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn.className).toContain('opacity-60');
  });

  it('shows 4 decorative shapes by default and none when disabled', () => {
    const { container, rerender } = render(
      <CtaBanner
        title="T"
        buttons={[{ label: 'Ir', href: '/x', variant: 'mustard' }]}
      />,
    );
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(
      4,
    );
    rerender(
      <CtaBanner
        title="T"
        decorations={false}
        buttons={[{ label: 'Ir', href: '/x', variant: 'mustard' }]}
      />,
    );
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(
      0,
    );
  });
});

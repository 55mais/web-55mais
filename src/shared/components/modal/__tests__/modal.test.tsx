import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { Modal } from '../modal';

const onOpenChange = vi.fn();

const baseProps = {
  open: true,
  onOpenChange,
  title: 'Pedir servicio',
  description: 'Completa los pasos para contratar.',
  closeAriaLabel: 'Cerrar',
};

function setup(over: Partial<Parameters<typeof Modal>[0]> = {}) {
  return render(
    <Modal {...baseProps} {...over}>
      <p>contenido del wizard</p>
    </Modal>,
  );
}

describe('Modal', () => {
  beforeEach(() => onOpenChange.mockReset());
  afterEach(() => cleanup());

  it('renders open as an aria-modal dialog labelled by the title', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', baseProps.title);
  });

  it('renders title, description, children and footer', () => {
    setup({ footer: <button type="button">Siguiente</button> });
    expect(screen.getByText(baseProps.title)).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(screen.getByText('contenido del wizard')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Siguiente' }),
    ).toBeInTheDocument();
  });

  it('omits the description paragraph when not provided', () => {
    setup({ description: undefined });
    expect(
      screen.queryByText(baseProps.description),
    ).not.toBeInTheDocument();
  });

  it('does not render the dialog when open is false', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('size "lg" widens the card; default is "md"', () => {
    const { unmount } = setup();
    expect(screen.getByRole('dialog').innerHTML).toContain('md:max-w-md');
    unmount();
    setup({ size: 'lg' });
    expect(screen.getByRole('dialog').innerHTML).toContain('md:max-w-2xl');
  });

  it('clicking the X button requests close', () => {
    setup();
    fireEvent.click(
      screen.getByRole('button', { name: baseProps.closeAriaLabel }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Escape requests close (base-ui document listener)', () => {
    setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    // base-ui passes (open, eventDetails); assert the close intent.
    expect(onOpenChange).toHaveBeenCalled();
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false);
  });
});

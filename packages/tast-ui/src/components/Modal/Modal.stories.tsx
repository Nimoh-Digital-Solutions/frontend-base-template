import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Modal } from './Modal';
import { Button } from '../Button';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * Interactive story — wraps the Modal in a controlled component so the
 * open/close button works in the Storybook canvas.
 */
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Example Dialog">
          <p style={{ margin: 0 }}>
            This is a modal dialog. Click outside or press the close button to dismiss.
          </p>
        </Modal>
      </>
    );
  },
};

export const WithActions: Story = {
  name: 'With Actions',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Confirm Delete</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Item"
        >
          <p style={{ margin: '0 0 1.5rem' }}>
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const NoTitle: Story = {
  name: 'No Title (no header)',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open (no title)</Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <p style={{ margin: 0 }}>
            This modal has no title prop, so the header is omitted entirely.
          </p>
        </Modal>
      </>
    );
  },
};

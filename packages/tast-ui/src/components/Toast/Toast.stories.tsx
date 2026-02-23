import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Toast } from './Toast';
import { Button } from '../Button';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    id: 'story-toast',
    message: 'This is a notification message.',
    variant: 'info',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    message: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 480 }}>
      <Toast id="1" variant="info"    message="Your changes have been saved." />
      <Toast id="2" variant="success" message="File uploaded successfully!" />
      <Toast id="3" variant="warning" message="Your session will expire in 5 minutes." />
      <Toast id="4" variant="error"   message="Failed to connect to the server." />
    </div>
  ),
};

export const WithDismiss: Story = {
  name: 'With Dismiss Button',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 480 }}>
      <Toast
        id="1"
        variant="info"
        message="Click × to dismiss this notification."
        onDismiss={() => console.info('dismissed')}
      />
      <Toast
        id="2"
        variant="success"
        message="Upload complete!"
        onDismiss={() => console.info('dismissed')}
      />
    </div>
  ),
};

/**
 * Interactive demo — uses useToast-style state to add and dismiss toasts.
 */
export const LiveDemo: Story = {
  name: 'Live Demo (add & dismiss)',
  render: () => {
    const [toasts, setToasts] = useState<
      Array<{ id: string; message: string; variant: 'info' | 'success' | 'warning' | 'error' }>
    >([]);

    const add = (variant: 'info' | 'success' | 'warning' | 'error') => {
      const id = `t-${Date.now()}`;
      setToasts((prev) => [...prev, { id, message: `A ${variant} notification`, variant }]);
    };

    const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['info', 'success', 'warning', 'error'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={v === 'error' ? 'danger' : v === 'success' ? 'success' : v === 'info' ? 'primary' : 'outline'}
              onClick={() => add(v)}
            >
              Add {v}
            </Button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {toasts.map((t) => (
            <Toast key={t.id} id={t.id} message={t.message} variant={t.variant} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    );
  },
};

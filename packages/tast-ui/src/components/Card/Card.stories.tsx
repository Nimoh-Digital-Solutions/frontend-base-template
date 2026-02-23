import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: (
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Card title</h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          This is some sample content inside a card component.
        </p>
      </div>
    ),
  },
  argTypes: {
    padding: { control: 'radio', options: ['none', 'sm', 'md', 'lg'] },
    shadow: { control: 'radio', options: ['none', 'sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const PaddingVariants: Story = {
  name: 'Padding Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
        <div key={p}>
          <p style={{ marginBottom: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }}>padding="{p}"</p>
          <Card padding={p}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Card content</p>
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const ShadowVariants: Story = {
  name: 'Shadow Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {(['none', 'sm', 'md', 'lg'] as const).map((s) => (
        <div key={s}>
          <p style={{ marginBottom: '0.25rem', fontSize: '0.75rem', opacity: 0.6 }}>shadow="{s}"</p>
          <Card shadow={s}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Card content</p>
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const Elevated: Story = {
  args: {
    padding: 'lg',
    shadow: 'lg',
  },
};

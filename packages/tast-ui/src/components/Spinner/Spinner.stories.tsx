import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <Spinner size="sm" />
        <span style={{ fontSize: '0.75rem' }}>sm</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <Spinner size="md" />
        <span style={{ fontSize: '0.75rem' }}>md</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <Spinner size="lg" />
        <span style={{ fontSize: '0.75rem' }}>lg</span>
      </div>
    </div>
  ),
};

export const CustomLabel: Story = {
  name: 'Custom Label',
  args: {
    label: 'Uploading your file…',
  },
};

export const InlineWithText: Story = {
  name: 'Inline With Text',
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem' }}>
      <Spinner size="sm" />
      <span>Loading results…</span>
    </div>
  ),
};

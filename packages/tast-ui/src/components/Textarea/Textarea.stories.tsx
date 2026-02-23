import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Description',
    placeholder: 'Enter a description…',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    rows: { control: 'number' },
    resize: {
      control: 'radio',
      options: ['none', 'vertical', 'horizontal', 'both'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const WithHelperText: Story = {
  name: 'With Helper Text',
  args: {
    label: 'Bio',
    helperText: 'Tell us about yourself (optional).',
    rows: 4,
  },
};

export const WithError: Story = {
  name: 'With Error',
  args: {
    label: 'Message',
    value: 'Hi',
    error: 'Message must be at least 20 characters.',
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Notes',
    value: 'These notes are read-only.',
    disabled: true,
    readOnly: true,
  },
};

export const ResizeOptions: Story = {
  name: 'Resize Options',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 500 }}>
      {(['none', 'vertical', 'horizontal', 'both'] as const).map((r) => (
        <Textarea key={r} label={`resize="${r}"`} resize={r} rows={3} />
      ))}
    </div>
  ),
};

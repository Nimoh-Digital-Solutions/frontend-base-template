import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    helperText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithHelperText: Story = {
  name: 'With Helper Text',
  args: {
    label: 'Password',
    type: 'password',
    helperText: 'Must be at least 8 characters.',
  },
};

export const WithError: Story = {
  name: 'With Error',
  args: {
    label: 'Email address',
    value: 'not-an-email',
    error: 'Please enter a valid email address.',
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Locked field',
    value: 'read-only value',
    disabled: true,
    readOnly: true,
  },
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
      <Input label="Small" size="sm" placeholder="size=sm" />
      <Input label="Medium (default)" size="md" placeholder="size=md" />
      <Input label="Large" size="lg" placeholder="size=lg" />
    </div>
  ),
};

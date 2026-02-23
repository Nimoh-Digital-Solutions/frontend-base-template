import type { Meta, StoryObj } from '@storybook/react';
import { LuDownload, LuHeart, LuTrash2, LuCheck } from 'react-icons/lu';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'outline', 'ghost', 'danger', 'success'],
    },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {(['primary', 'secondary', 'tertiary', 'outline', 'ghost', 'danger', 'success'] as const).map(
        (v) => (
          <Button key={v} variant={v}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button icon={<LuDownload />}>Download</Button>
      <Button variant="outline" icon={<LuHeart />} iconPosition="right">
        Like
      </Button>
      <Button variant="danger" icon={<LuTrash2 />}>
        Delete
      </Button>
      <Button variant="success" icon={<LuCheck />}>
        Confirm
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving…' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const FullWidth: Story = {
  name: 'Full Width',
  parameters: { layout: 'padded' },
  args: { fullWidth: true, children: 'Full Width Button' },
};

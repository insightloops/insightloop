import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'
import { withTheme } from './decorators'

const preview: Preview = {
  parameters: {
    backgrounds: {
      disable: true, // Disable default backgrounds since we handle theme via CSS
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    },
    docs: {
      toc: true,
    },
    layout: 'centered',
  },

  decorators: [withTheme],

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light Theme' },
          { value: 'dark', icon: 'moon', title: 'Dark Theme' }
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
import type { Preview } from '@storybook/nextjs'
import React from 'react'
import '../src/styles/globals.css'
import { I18nProvider } from '@/providers/I18nProvider'

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals?.theme === 'dark'
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark)
      }
      return (
        <React.StrictMode>
          <I18nProvider>
            <Story />
          </I18nProvider>
        </React.StrictMode>
      )
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
}

export default preview

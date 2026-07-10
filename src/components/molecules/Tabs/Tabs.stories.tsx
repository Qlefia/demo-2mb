import type { Meta, StoryObj } from '@storybook/nextjs'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { Activity, ClipboardCheck, MessageSquare, StickyNote, Zap } from 'lucide-react'
import { Tabs } from './Tabs'
import { tabListIconToolRailClass, tabTriggerIconClass } from './tabListStyles'

const iconStroke = { strokeWidth: 1.25 as const }

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  args: {
    items: [
      { label: 'Overview', content: <p className="text-sm">Survey overview content goes here.</p> },
      { label: 'Responses', content: <p className="text-sm">Response data and charts.</p> },
      { label: 'Settings', content: <p className="text-sm">Survey settings and configuration.</p> },
    ],
  },
}

export const TwoTabs: Story = {
  args: {
    items: [
      { label: 'Edit', content: <p className="text-sm">Builder interface.</p> },
      { label: 'Preview', content: <p className="text-sm">Live preview of the survey.</p> },
    ],
  },
}

/** Prospect workspace right rail — icon row + selected chip (reference layout). */
export const WorkspaceIconToolRail: Story = {
  name: 'Workspace icon tool rail',
  render: () => (
    <div className="max-w-sm border border-border bg-background">
      <TabGroup defaultIndex={3}>
        <TabList className={tabListIconToolRailClass}>
          <Tab className={tabTriggerIconClass} aria-label="Tasks">
            <ClipboardCheck size={19} {...iconStroke} aria-hidden />
          </Tab>
          <Tab className={tabTriggerIconClass} aria-label="Notes">
            <StickyNote size={19} {...iconStroke} aria-hidden />
          </Tab>
          <Tab className={tabTriggerIconClass} aria-label="Outreach">
            <MessageSquare size={19} {...iconStroke} aria-hidden />
          </Tab>
          <Tab className={tabTriggerIconClass} aria-label="AI">
            <Zap size={19} {...iconStroke} aria-hidden />
          </Tab>
          <Tab className={tabTriggerIconClass} aria-label="Activity">
            <Activity size={19} {...iconStroke} aria-hidden />
          </Tab>
        </TabList>
        <TabPanels className="border-t border-border p-3 text-sm text-muted">
          <TabPanel>Tasks content</TabPanel>
          <TabPanel>Notes content</TabPanel>
          <TabPanel>Outreach content</TabPanel>
          <TabPanel>AI content (default selected tab)</TabPanel>
          <TabPanel>Activity / deals content</TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  ),
}

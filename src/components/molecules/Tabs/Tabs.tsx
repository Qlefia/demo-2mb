import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import type { ReactNode } from 'react'
import { tabListBorderClass, tabTriggerClass } from './tabListStyles'

interface TabItem {
  label: string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultIndex?: number
}

export function Tabs({ items, defaultIndex = 0 }: TabsProps) {
  return (
    <TabGroup defaultIndex={defaultIndex}>
      <TabList className={tabListBorderClass}>
        {items.map((item) => (
          <Tab key={item.label} className={tabTriggerClass}>
            {item.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="pt-4">
        {items.map((item) => (
          <TabPanel key={item.label}>{item.content}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}

'use client'

import { useEffect, useState, type RefObject } from 'react'

export type ObjectContainRect = {
  left: number
  top: number
  width: number
  height: number
}

type Size = { width: number; height: number }

function computeObjectContainRect(container: Size, image: Size): ObjectContainRect | null {
  if (container.width <= 0 || container.height <= 0 || image.width <= 0 || image.height <= 0) {
    return null
  }

  const containerAspect = container.width / container.height
  const imageAspect = image.width / image.height

  if (imageAspect > containerAspect) {
    const width = container.width
    const height = container.width / imageAspect
    return {
      left: 0,
      top: (container.height - height) / 2,
      width,
      height,
    }
  }

  const height = container.height
  const width = container.height * imageAspect
  return {
    left: (container.width - width) / 2,
    top: 0,
    width,
    height,
  }
}

export function imagePointToContainerPercent(
  rect: ObjectContainRect,
  container: Size,
  x: number,
  y: number,
): { left: number; top: number } {
  const left = ((rect.left + (x / 100) * rect.width) / container.width) * 100
  const top = ((rect.top + (y / 100) * rect.height) / container.height) * 100
  return { left, top }
}

export function containerPercentToImagePoint(
  rect: ObjectContainRect,
  container: Size,
  leftPercent: number,
  topPercent: number,
): { x: number; y: number } {
  const px = (leftPercent / 100) * container.width
  const py = (topPercent / 100) * container.height
  const x = ((px - rect.left) / rect.width) * 100
  const y = ((py - rect.top) / rect.height) * 100
  return {
    x: Math.min(100, Math.max(0, Math.round(x * 10) / 10)),
    y: Math.min(100, Math.max(0, Math.round(y * 10) / 10)),
  }
}

export function useObjectContainLayout(
  containerRef: RefObject<HTMLElement | null>,
  imageSize: Size,
): { rect: ObjectContainRect | null; container: Size } {
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const measure = () => {
      const { width, height } = node.getBoundingClientRect()
      setContainerSize({ width, height })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [containerRef, imageSize.width, imageSize.height])

  return {
    container: containerSize,
    rect: computeObjectContainRect(containerSize, imageSize),
  }
}

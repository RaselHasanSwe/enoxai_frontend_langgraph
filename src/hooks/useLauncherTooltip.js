import { useCallback, useEffect, useRef, useState } from 'react'

const CHAT_OPENED_KEY = 'enox_chat_opened_once'
const TOOLTIP_INTERVAL_MS = 30000
const TOOLTIP_INITIAL_DELAY_MS = 1200
const TOOLTIP_VISIBLE_MS = 20000

export function useLauncherTooltip(isOpen) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipDismissedForever, setTooltipDismissedForever] = useState(
    () => localStorage.getItem(CHAT_OPENED_KEY) === '1'
  )
  const hideTimerRef = useRef(null)

  const dismissForever = useCallback(() => {
    localStorage.setItem(CHAT_OPENED_KEY, '1')
    setTooltipDismissedForever(true)
    setShowTooltip(false)
  }, [])

  const hideTooltip = useCallback(() => {
    setShowTooltip(false)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const revealTooltip = useCallback(() => {
    if (tooltipDismissedForever || isOpen) return
    setShowTooltip(true)
  }, [isOpen, tooltipDismissedForever])

  useEffect(() => {
    if (!isOpen) return
    hideTooltip()
    dismissForever()
  }, [isOpen, dismissForever, hideTooltip])

  useEffect(() => {
    if (isOpen || tooltipDismissedForever) return

    const initialTimer = setTimeout(revealTooltip, TOOLTIP_INITIAL_DELAY_MS)
    const interval = setInterval(revealTooltip, TOOLTIP_INTERVAL_MS)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [isOpen, tooltipDismissedForever, revealTooltip])

  useEffect(() => {
    if (!showTooltip) return

    hideTimerRef.current = setTimeout(() => {
      setShowTooltip(false)
    }, TOOLTIP_VISIBLE_MS)

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [showTooltip])

  return {
    showTooltip: showTooltip && !isOpen && !tooltipDismissedForever,
    dismissForever,
    hideTooltip,
  }
}

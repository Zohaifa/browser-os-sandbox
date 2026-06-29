import { useEffect, useRef, useState } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function Window({
  id,
  title,
  desktopRef,
  initialPosition,
  zIndex,
  onClose,
  onFocus,
  onContentContextMenu,
  children,
}) {
  const windowRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const [position, setPosition] = useState(initialPosition)
  const [size, setSize] = useState({ width: 'auto', height: 'auto' })
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (isMaximized) return

      if (dragRef.current && desktopRef?.current && windowRef.current) {
        const desktopRect = desktopRef.current.getBoundingClientRect()
        const windowRect = windowRef.current.getBoundingClientRect()

        const maxX = Math.max(0, desktopRect.width - windowRect.width)
        const maxY = Math.max(0, desktopRect.height - windowRect.height)

        setPosition({
          x: clamp(event.clientX - dragRef.current.offsetX, 0, maxX),
          y: clamp(event.clientY - dragRef.current.offsetY, 0, maxY),
        })
      } else if (resizeRef.current && windowRef.current) {
        const dx = event.clientX - resizeRef.current.startX
        const dy = event.clientY - resizeRef.current.startY
        setSize({
          width: Math.max(200, resizeRef.current.initWidth + dx),
          height: Math.max(100, resizeRef.current.initHeight + dy),
        })
      }
    }

    const handlePointerUp = () => {
      dragRef.current = null
      resizeRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [desktopRef])

  const startDrag = (event) => {
    if (event.button !== 0 || !windowRef.current || isMaximized) {
      return
    }

    const bounds = windowRef.current.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    }

    onFocus?.(id)
    event.preventDefault()
  }

  const startResize = (event) => {
    if (event.button !== 0 || !windowRef.current || isMaximized) return
    const bounds = windowRef.current.getBoundingClientRect()
    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initWidth: bounds.width,
      initHeight: bounds.height
    }
    onFocus?.(id)
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <article
      ref={windowRef}
      className={`absolute w-fit max-w-[calc(100%-0.75rem)] rounded-sm border border-[#083178] bg-[#ece9d8] text-slate-900 shadow-[2px_2px_0_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.25)] flex flex-col ${isMaximized ? '!left-0 !top-0 !w-full !max-w-none !h-full' : ''}`}
      style={!isMaximized ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: size.width !== 'auto' ? `${size.width}px` : 'fit-content',
        height: size.height !== 'auto' ? `${size.height}px` : 'auto',
        zIndex,
      } : { zIndex }}
      onMouseDown={() => onFocus?.(id)}
    >
      <header
        className="flex h-8 cursor-move items-center justify-between rounded-t-[3px] border-b border-[#083178] bg-[linear-gradient(180deg,#0a6be4_0%,#0f4fbf_48%,#1f68df_100%)] px-2 text-white"
        onPointerDown={startDrag}
      >
        <h2 className="truncate pr-2 text-[12px] font-bold">{title}</h2>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMaximized(m => !m)}
            aria-label="Maximize"
            className="grid h-5 w-5 place-items-center rounded-xs border border-[#ffffff] border-b-[#808080] border-r-[#808080] bg-[#ece9d8] text-[11px] font-bold leading-none text-black hover:border-b-[#0831d9] hover:border-r-[#0831d9] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white"
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
          <button
            type="button"
            onClick={() => onClose(id)}
            aria-label={`Close ${title}`}
            className="grid h-5 w-5 place-items-center rounded-xs border border-[#6b0f0f] bg-[linear-gradient(180deg,#f68b87_0%,#d73b36_100%)] text-[11px] font-bold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            X
          </button>
        </div>
      </header>

      <div
        className="min-h-28 border border-white bg-[#f5f2e6] p-3 flex-1 overflow-auto"
        onContextMenu={onContentContextMenu}
      >
        {children}
      </div>

      {!isMaximized && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onPointerDown={startResize}
        />
      )}
    </article>
  )
}

export default Window

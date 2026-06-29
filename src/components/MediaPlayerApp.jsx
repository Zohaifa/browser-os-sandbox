import { forwardRef, useImperativeHandle, useRef } from 'react'

const MediaPlayerApp = forwardRef(function MediaPlayerApp({ process }, ref) {
  const mediaRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play() { mediaRef.current?.play().catch(() => {}) },
    pause() { mediaRef.current?.pause() },
  }))

  if (!process) return null

  const { name, blobUrl, mediaType, state, pid, burstTime, remainingTime, color, waitingTime } = process
  const progress = burstTime > 0 ? Math.max(0, ((burstTime - remainingTime) / burstTime) * 100) : 100

  const stateLabel = {
    Running: { label: 'Running', bg: '#4472c4', border: '#2f5597' },
    Ready: { label: 'Ready', bg: '#e6a817', border: '#c07d00' },
    Paused: { label: 'Paused', bg: '#c55a11', border: '#9c4000' },
    Completed: { label: 'Completed', bg: '#70ad47', border: '#4e7a30' },
  }[state] || { label: state, bg: '#666', border: '#444' }

  return (
    <div className="w-[320px] font-[Tahoma,Verdana,sans-serif] text-[12px] text-black flex flex-col gap-2">

      {/* Title bar info */}
      <div className="flex items-center justify-between bg-[#ece9d8] border border-[#d4d0c8] px-2 py-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-bold truncate">P{pid}</span>
          <span className="text-gray-500 truncate text-[11px]">{name}</span>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white shrink-0 ml-2"
          style={{ backgroundColor: stateLabel.bg }}
        >
          {stateLabel.label}
        </span>
      </div>

      {/* Media */}
      <div className="bg-black border border-[#a0a0a0] flex items-center justify-center" style={{ minHeight: 120 }}>
        {!blobUrl ? (
          <div className="text-gray-400 text-[11px] italic text-center p-4">
            <div className="text-3xl mb-1">{mediaType === 'video' ? '🎬' : '🎵'}</div>
            Simulated process — no media file
          </div>
        ) : mediaType === 'video' ? (
          <video ref={mediaRef} src={blobUrl} className="w-full" style={{ maxHeight: 180 }} controls loop />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 w-full">
            <div className="text-4xl">🎵</div>
            <p className="text-white text-[11px] truncate max-w-full px-2">{name}</p>
            <audio ref={mediaRef} src={blobUrl} className="w-full" controls loop />
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="px-0.5">
        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
          <span>CPU Time Used: {burstTime - remainingTime}s / {burstTime}s</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-[#d4d0c8] h-3 border border-[#a0a0a0]">
          <div
            className="h-full transition-all duration-900"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* State message */}
      <div className="bg-[#f0f0f0] border border-[#d4d0c8] px-2 py-1.5 text-[11px] text-gray-700">
        {state === 'Running' && `▶ Running on CPU — ${remainingTime}s remaining`}
        {state === 'Paused' && `⏸ Preempted by scheduler — waiting to resume`}
        {state === 'Ready' && `⏳ In ready queue — waiting for CPU`}
        {state === 'Completed' && `✔ Process completed. Total wait: ${waitingTime}s`}
      </div>
    </div>
  )
})

export default MediaPlayerApp

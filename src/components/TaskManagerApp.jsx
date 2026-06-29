import { useRef, useEffect } from 'react'

function GanttChart({ ganttLog }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [ganttLog.length])

  if (ganttLog.length === 0) {
    return (
      <div className="flex items-center justify-center h-10 bg-[#f0f0f0] border border-[#a0a0a0] text-gray-500 text-[11px] italic">
        Gantt chart will appear when processes run...
      </div>
    )
  }

  // Compact consecutive same-pid entries into blocks
  const blocks = []
  for (const entry of ganttLog) {
    if (blocks.length > 0 && blocks[blocks.length - 1].pid === entry.pid) {
      blocks[blocks.length - 1].duration++
    } else {
      blocks.push({ pid: entry.pid, name: entry.name, color: entry.color, duration: 1, startTick: blocks.length > 0 ? blocks[blocks.length - 1].startTick + blocks[blocks.length - 1].duration : 0 })
    }
  }

  const BLOCK_W = 36
  const CHART_H = 28
  let x = 0
  const rendered = blocks.map(b => { const bx = x; x += b.duration * BLOCK_W; return { ...b, x: bx } })
  const totalW = x

  return (
    <div ref={scrollRef} className="overflow-x-auto border border-[#a0a0a0] bg-white" style={{ maxHeight: 60 }}>
      <div style={{ width: Math.max(totalW, 100) }}>
        <svg width={Math.max(totalW, 100)} height={CHART_H} style={{ display: 'block' }}>
          {rendered.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={0} width={b.duration * BLOCK_W} height={CHART_H} fill={b.color} stroke="white" strokeWidth={1} />
              {b.duration >= 1 && (
                <text x={b.x + (b.duration * BLOCK_W) / 2} y={CHART_H / 2 + 4} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">
                  P{b.pid}
                </text>
              )}
            </g>
          ))}
        </svg>
        {/* Tick markers */}
        <div className="flex text-[9px] text-gray-500" style={{ width: Math.max(totalW, 100) }}>
          {rendered.map((b, i) => (
            <div key={i} style={{ width: b.duration * BLOCK_W }} className="border-l border-gray-300 pl-0.5 truncate">
              {b.startTick}
            </div>
          ))}
          <span className="pl-0.5">{ganttLog.length}</span>
        </div>
      </div>
    </div>
  )
}

const STATE_STYLE = {
  Running:   'bg-[#4472c4] text-white',
  Ready:     'bg-[#e6a817] text-white',
  Paused:    'bg-[#c55a11] text-white',
  Completed: 'bg-[#70ad47] text-white',
}

export default function TaskManagerApp({ allProcesses, ganttLog, virtualClock, metrics, runningProcess, onTerminate, ramSize, usedRam }) {
  const ramPercent = Math.min(100, (usedRam / ramSize) * 100).toFixed(1)
  return (
    <div className="w-[560px] text-[12px] text-black font-[Tahoma,Verdana,sans-serif] flex flex-col gap-2 p-1">

      {/* Status Bar */}
      <div className="flex items-center gap-2 bg-[#ece9d8] border border-[#d4d0c8] rounded px-2 py-1 text-[11px]">
        <span className="font-bold text-[#0a246a]">Virtual Clock:</span>
        <span className="font-mono font-bold">{virtualClock}s</span>
        <span className="mx-2 text-gray-400">|</span>
        <span className="font-bold text-[#0a246a]">CPU:</span>
        <span className={runningProcess ? 'text-green-700 font-bold' : 'text-gray-500'}>
          {runningProcess ? `P${runningProcess.pid} — ${runningProcess.name}` : 'Idle'}
        </span>
        <span className="mx-2 text-gray-400">|</span>
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#0a246a]">RAM:</span>
          <div className="w-20 h-3 bg-gray-200 border border-gray-400 relative">
            <div className={`h-full ${ramPercent > 90 ? 'bg-red-500' : 'bg-green-500'} transition-all`} style={{ width: `${ramPercent}%` }} />
          </div>
          <span className="text-[10px] font-mono">{usedRam}/{ramSize} MB</span>
        </div>
      </div>

      {/* Process Table */}
      <div className="border border-[#d4d0c8] overflow-hidden">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#d4d0c8] text-left">
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">PID</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">Process Name</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">State</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">RAM</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">Burst</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">Remaining</th>
              <th className="px-2 py-1 border-r border-[#c0bdb5] font-bold">Wait</th>
              <th className="px-2 py-1 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {allProcesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 italic py-6 text-[11px]">
                  No processes. Double-click a media file on the desktop to schedule it.
                </td>
              </tr>
            ) : (
              allProcesses.map((p, i) => (
                <tr key={p.pid} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f3f3f3]'}>
                  <td className="px-2 py-1 border-r border-[#e0ddd5] font-mono font-bold" style={{ color: p.color }}>
                    P{p.pid}
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5] truncate max-w-[140px]" title={p.name}>
                    {p.name}
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5]">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${STATE_STYLE[p.state] || 'bg-gray-300'}`}>
                      {p.state}
                    </span>
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5] font-mono text-center">
                    {p.state !== 'Completed' && p.state !== 'Failed (OOM)' ? (
                      <span className={p.inMemory ? 'text-green-700 font-bold' : 'text-red-600 font-bold'} title={p.inMemory ? 'In Memory' : 'Swapped to Disk'}>
                        {p.memoryReq}M {p.inMemory ? '✓' : '✗'}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5] font-mono">{p.burstTime}s</td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5]">
                    <div className="flex items-center gap-1">
                      <div className="flex-1 bg-[#d4d0c8] h-2">
                        <div
                          className="h-2 transition-all duration-700"
                          style={{
                            width: `${Math.max(0, (p.remainingTime / p.burstTime) * 100)}%`,
                            backgroundColor: p.color,
                          }}
                        />
                      </div>
                      <span className="font-mono w-6 text-right shrink-0">{p.remainingTime}s</span>
                    </div>
                  </td>
                  <td className="px-2 py-1 border-r border-[#e0ddd5] font-mono">{p.waitingTime}s</td>
                  <td className="px-2 py-1">
                    {p.state !== 'Completed' && (
                      <button
                        onClick={() => onTerminate?.(p.pid)}
                        className="text-[10px] px-2 py-0.5 border border-[#c0bdb5] bg-[#ece9d8] hover:bg-[#e55137] hover:text-white hover:border-[#a01010] transition-colors font-bold"
                      >
                        End Task
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Gantt Chart */}
      <div>
        <div className="text-[11px] font-bold text-[#0a246a] mb-1 border-b border-[#d4d0c8] pb-0.5">
          Gantt Chart
        </div>
        <GanttChart ganttLog={ganttLog} />
      </div>

      {/* Final Metrics */}
      {metrics && (
        <div className="border border-[#7f9db9] bg-[#ece9d8] p-2">
          <div className="font-bold text-[#0a246a] text-[11px] mb-2 border-b border-[#d4d0c8] pb-1">
            ✓ All Processes Completed — Performance Metrics
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Avg Waiting Time', value: metrics.avgWaiting + 's' },
              { label: 'Avg Turnaround', value: metrics.avgTurnaround + 's' },
              { label: 'CPU Utilization', value: metrics.cpuUtilization + '%' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-[#d4d0c8] p-2 text-center">
                <div className="text-[9px] text-gray-500 uppercase tracking-wide">{m.label}</div>
                <div className="text-lg font-bold text-[#0a246a] mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

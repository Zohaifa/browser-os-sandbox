import { useState, useRef, useEffect } from 'react'

export default function DiskSchedulerApp() {
  const [queueStr, setQueueStr] = useState('98, 183, 37, 122, 14, 124, 65, 67')
  const [headPos, setHeadPos] = useState(53)
  const [algo, setAlgo] = useState('FCFS')
  const [results, setResults] = useState(null)
  
  const canvasRef = useRef(null)

  const simulate = () => {
    const queue = queueStr.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
    let currentPos = Number(headPos)
    let totalSeek = 0
    let path = [currentPos]

    if (algo === 'FCFS') {
      for (const req of queue) {
        totalSeek += Math.abs(req - currentPos)
        currentPos = req
        path.push(currentPos)
      }
    } else if (algo === 'SSTF') {
      let pending = [...queue]
      while (pending.length > 0) {
        let minDiff = Infinity
        let minIdx = -1
        for (let i = 0; i < pending.length; i++) {
          const diff = Math.abs(pending[i] - currentPos)
          if (diff < minDiff) {
            minDiff = diff
            minIdx = i
          }
        }
        totalSeek += minDiff
        currentPos = pending[minIdx]
        path.push(currentPos)
        pending.splice(minIdx, 1)
      }
    }

    setResults({ path, totalSeek })
  }

  useEffect(() => {
    if (results && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const maxCyl = 200 // Assume 0-199 cylinders
      const padding = 20
      const width = canvas.width - padding * 2
      const height = canvas.height - padding * 2
      
      const getX = (cyl) => padding + (cyl / maxCyl) * width
      const stepY = height / (results.path.length > 1 ? results.path.length - 1 : 1)
      const getY = (idx) => padding + idx * stepY

      // Draw grid lines
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      ctx.beginPath()
      for(let i=0; i<=200; i+=20) {
         const x = getX(i)
         ctx.moveTo(x, 0)
         ctx.lineTo(x, canvas.height)
      }
      ctx.stroke()
      
      // Draw text for cylinders
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.fillText('0', getX(0) - 5, 12)
      ctx.fillText('100', getX(100) - 10, 12)
      ctx.fillText('200', getX(200) - 10, 12)

      // Draw path
      ctx.strokeStyle = '#245edb'
      ctx.lineWidth = 2
      ctx.beginPath()
      
      for (let i = 0; i < results.path.length; i++) {
        const x = getX(results.path[i])
        const y = getY(i)
        
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      
      // Draw dots
      for (let i = 0; i < results.path.length; i++) {
        const x = getX(results.path[i])
        const y = getY(i)
        ctx.fillStyle = i === 0 ? 'green' : (i === results.path.length-1 ? 'red' : 'blue')
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    }
  }, [results])

  return (
    <div className="w-[550px] h-[400px] bg-[#ece9d8] text-[12px] text-black flex flex-col p-2 font-sans">
      <div className="bg-white border border-[#7f9db9] p-2 mb-3">
        <h2 className="font-bold mb-2 pb-1 border-b border-gray-300">Disk Scheduler Settings</h2>
        
        <div className="flex gap-4 mb-2">
          <label className="flex flex-col">
            <span>Queue:</span>
            <input 
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[200px]"
              value={queueStr}
              onChange={(e) => setQueueStr(e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span>Head Start:</span>
            <input 
              type="number"
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[60px]"
              value={headPos}
              onChange={(e) => setHeadPos(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col">
            <span>Algorithm:</span>
            <select 
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[80px]"
              value={algo}
              onChange={(e) => setAlgo(e.target.value)}
            >
              <option value="FCFS">FCFS</option>
              <option value="SSTF">SSTF</option>
            </select>
          </label>
        </div>

        <button 
          onClick={simulate}
          className="border border-gray-500 bg-[#f0f0f0] px-4 py-1 mt-1 active:bg-[#e0e0e0] active:border-t-black active:border-l-black"
        >
          Simulate
        </button>
      </div>

      <div className="flex-1 bg-white border border-[#7f9db9] p-2 flex flex-col">
        {results ? (
          <>
            <div className="mb-2 font-bold text-blue-700">Total Seek Distance: {results.totalSeek}</div>
            <div className="flex-1 relative">
              <canvas 
                ref={canvasRef} 
                width={510} 
                height={220}
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic p-4 text-center">Click Simulate to view disk head movement.</div>
        )}
      </div>
    </div>
  )
}

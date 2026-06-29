import { useState } from 'react'

export default function MemoryManagerApp() {
  const [refString, setRefString] = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1')
  const [framesCount, setFramesCount] = useState(3)
  const [algo, setAlgo] = useState('FIFO')
  const [simulationSteps, setSimulationSteps] = useState([])
  const [totalFaults, setTotalFaults] = useState(0)

  const simulate = () => {
    const pages = refString.split(',').map((s) => s.trim()).filter((s) => s !== '')
    const frames = []
    const steps = []
    let faults = 0
    let lruCounter = 0
    const lruTrack = new Map()

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      lruCounter++
      let isFault = false

      if (algo === 'FIFO') {
        if (!frames.includes(page)) {
          isFault = true
          faults++
          if (frames.length < framesCount) {
            frames.push(page)
          } else {
            frames.shift()
            frames.push(page)
          }
        }
      } else if (algo === 'LRU') {
        if (!frames.includes(page)) {
          isFault = true
          faults++
          if (frames.length < framesCount) {
            frames.push(page)
          } else {
            let lruPage = frames[0]
            let minTime = lruTrack.get(lruPage) || 0
            for (let f of frames) {
              const time = lruTrack.get(f) || 0
              if (time < minTime) {
                minTime = time
                lruPage = f
              }
            }
            const idx = frames.indexOf(lruPage)
            frames[idx] = page
          }
        }
        lruTrack.set(page, lruCounter)
      }

      steps.push({
        page,
        frames: [...frames],
        isFault,
      })
    }

    setSimulationSteps(steps)
    setTotalFaults(faults)
  }

  return (
    <div className="w-[500px] h-[350px] bg-[#ece9d8] text-[12px] text-black flex flex-col p-2 font-sans">
      <div className="bg-white border border-[#7f9db9] p-2 mb-3">
        <h2 className="font-bold mb-2 pb-1 border-b border-gray-300">Memory Manager Settings</h2>
        
        <div className="flex gap-4 mb-2">
          <label className="flex flex-col">
            <span>Reference String:</span>
            <input 
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[200px]"
              value={refString}
              onChange={(e) => setRefString(e.target.value)}
            />
          </label>

          <label className="flex flex-col">
            <span>Frames:</span>
            <input 
              type="number"
              min="1"
              max="10"
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[60px]"
              value={framesCount}
              onChange={(e) => setFramesCount(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col">
            <span>Algorithm:</span>
            <select 
              className="border border-[#7f9db9] px-1 py-0.5 mt-1 w-[80px]"
              value={algo}
              onChange={(e) => setAlgo(e.target.value)}
            >
              <option value="FIFO">FIFO</option>
              <option value="LRU">LRU</option>
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

      <div className="flex-1 overflow-auto bg-white border border-[#7f9db9] p-2">
        {simulationSteps.length > 0 ? (
          <div>
            <div className="mb-2 font-bold text-red-700">Total Page Faults: {totalFaults}</div>
            <div className="flex overflow-x-auto pb-2">
              {simulationSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center mr-1 min-w-[30px]">
                  <div className="font-bold mb-1">{step.page}</div>
                  <div className="border border-gray-400 bg-[#fcfcfc] flex flex-col justify-end w-[30px] h-[70px]">
                    {/* Render frames top to bottom based on frames count */}
                    {Array.from({ length: framesCount }).map((_, fIdx) => {
                      const frameVal = step.frames[fIdx]
                      return (
                        <div key={fIdx} className="h-[22px] flex items-center justify-center border-t border-gray-200">
                          {frameVal !== undefined ? frameVal : '-'}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-red-500 font-bold h-[20px] mt-1">
                    {step.isFault ? 'F' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic p-4 text-center">Click Simulate to run the page replacement algorithm.</div>
        )}
      </div>
    </div>
  )
}

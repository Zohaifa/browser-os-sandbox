import { useState } from 'react'

export default function BankersAlgorithmApp() {
  const [available, setAvailable] = useState([3, 3, 2])
  const [processes, setProcesses] = useState([
    { id: 'P0', alloc: [0, 1, 0], max: [7, 5, 3] },
    { id: 'P1', alloc: [2, 0, 0], max: [3, 2, 2] },
    { id: 'P2', alloc: [3, 0, 2], max: [9, 0, 2] },
    { id: 'P3', alloc: [2, 1, 1], max: [2, 2, 2] },
    { id: 'P4', alloc: [0, 0, 2], max: [4, 3, 3] },
  ])
  const [result, setResult] = useState(null)

  const handleAvailableChange = (index, val) => {
    const newAvail = [...available]
    newAvail[index] = Number(val)
    setAvailable(newAvail)
  }

  const handleProcessChange = (pIndex, type, rIndex, val) => {
    const newProcs = [...processes]
    newProcs[pIndex][type][rIndex] = Number(val)
    setProcesses(newProcs)
  }

  const runBankers = () => {
    const n = processes.length
    const m = available.length
    
    // Calculate Need matrix
    const need = processes.map(p => 
      p.max.map((maxVal, i) => maxVal - p.alloc[i])
    )

    const finish = new Array(n).fill(false)
    let work = [...available]
    const safeSeq = []
    
    let count = 0
    while (count < n) {
      let found = false
      for (let p = 0; p < n; p++) {
        if (!finish[p]) {
          let j
          for (j = 0; j < m; j++) {
            if (need[p][j] > work[j]) {
              break
            }
          }
          if (j === m) {
            for (let k = 0; k < m; k++) {
              work[k] += processes[p].alloc[k]
            }
            safeSeq.push(processes[p].id)
            finish[p] = true
            found = true
            count++
          }
        }
      }
      
      if (found === false) {
        setResult({
          isSafe: false,
          message: 'DEADLOCK WARNING: System is not in a safe state!'
        })
        return
      }
    }
    
    setResult({
      isSafe: true,
      sequence: safeSeq,
      message: 'System is SAFE. Deadlock Avoided.'
    })
  }

  return (
    <div className="w-[500px] h-full text-[12px] text-black font-sans flex flex-col p-2">
      <div className="bg-white border border-[#7f9db9] p-3 mb-3">
        <h2 className="font-bold mb-2 pb-1 border-b border-gray-300">Available Resources (A, B, C)</h2>
        <div className="flex gap-2">
          {available.map((val, i) => (
            <input 
              key={i}
              type="number" 
              className="w-12 border border-[#7f9db9] px-1 py-0.5 text-center"
              value={val}
              onChange={(e) => handleAvailableChange(i, e.target.value)}
            />
          ))}
          <button 
             onClick={runBankers}
             className="ml-auto bg-[#f0f0f0] border border-gray-500 font-bold py-1 px-4 active:bg-[#e0e0e0] active:border-t-black active:border-l-black"
           >
             Run Safety Check
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white border border-[#7f9db9] p-1 mb-3">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-[#ece9d8] border-b border-gray-300">
              <th className="p-1 border-r border-gray-300 font-normal">Process ID</th>
              <th className="p-1 border-r border-gray-300 font-normal">Allocation (A,B,C)</th>
              <th className="p-1 font-normal">Max Need (A,B,C)</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, pIndex) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-blue-50">
                <td className="p-1 font-bold border-r border-gray-200">{p.id}</td>
                <td className="p-1 border-r border-gray-200">
                  <div className="flex justify-center gap-1">
                    {p.alloc.map((val, rIndex) => (
                      <input 
                        key={rIndex} type="number" 
                        className="w-8 border border-gray-300 text-center"
                        value={val}
                        onChange={(e) => handleProcessChange(pIndex, 'alloc', rIndex, e.target.value)}
                      />
                    ))}
                  </div>
                </td>
                <td className="p-1">
                  <div className="flex justify-center gap-1">
                    {p.max.map((val, rIndex) => (
                      <input 
                        key={rIndex} type="number" 
                        className="w-8 border border-gray-300 text-center"
                        value={val}
                        onChange={(e) => handleProcessChange(pIndex, 'max', rIndex, e.target.value)}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-[#7f9db9] p-3 text-center min-h-[60px] flex flex-col justify-center">
        {result ? (
          result.isSafe ? (
             <>
               <div className="font-bold text-green-700 mb-1">{result.message}</div>
               <div className="text-black bg-gray-100 border border-gray-200 p-1 inline-block mx-auto rounded">
                 Safe Sequence: <span className="font-mono">{result.sequence.join(' ➔ ')}</span>
               </div>
             </>
          ) : (
             <div className="font-bold text-red-600">
               {result.message}
             </div>
          )
        ) : (
          <div className="text-gray-500 italic">No safety check run yet.</div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'

const calculatorKeys = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
]

function applyOperator(left, right, operator) {
  if (operator === '+') return left + right
  if (operator === '-') return left - right
  if (operator === '*') return left * right
  if (operator === '/') return right === 0 ? NaN : left / right
  return right
}

function CalculatorApp() {
  const [display, setDisplay] = useState('0')
  const [pendingValue, setPendingValue] = useState(null)
  const [pendingOperator, setPendingOperator] = useState(null)
  const [resetDisplay, setResetDisplay] = useState(false)

  const pressNumber = (value) => {
    if (resetDisplay) {
      setDisplay(value)
      setResetDisplay(false)
      return
    }

    setDisplay((prev) => (prev === '0' ? value : `${prev}${value}`))
  }

  const pressDecimal = () => {
    if (resetDisplay) {
      setDisplay('0.')
      setResetDisplay(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay((prev) => `${prev}.`)
    }
  }

  const compute = (nextOperator = null) => {
    const currentValue = Number(display)

    if (pendingValue === null || pendingOperator === null) {
      setPendingValue(currentValue)
      setPendingOperator(nextOperator)
      setResetDisplay(true)
      return
    }

    const result = applyOperator(pendingValue, currentValue, pendingOperator)
    const nextDisplay = Number.isFinite(result) ? String(result) : 'Error'

    setDisplay(nextDisplay)
    setPendingValue(Number.isFinite(result) ? result : null)
    setPendingOperator(nextOperator)
    setResetDisplay(true)
  }

  const clearAll = () => {
    setDisplay('0')
    setPendingValue(null)
    setPendingOperator(null)
    setResetDisplay(false)
  }

  const handleKey = (key) => {
    if (/^\d$/.test(key)) {
      pressNumber(key)
      return
    }

    if (key === '.') {
      pressDecimal()
      return
    }

    if (key === '=') {
      compute(null)
      return
    }

    if (['+', '-', '*', '/'].includes(key)) {
      compute(key)
    }
  }

  return (
    <div className="w-[260px]">
      <div className="mb-2 rounded border border-[#9fb5d9] bg-[#fcfeff] px-3 py-2 text-right font-mono text-xl text-[#0f2954]">
        {display}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={clearAll}
          className="col-span-2 rounded border border-[#b98888] bg-[#f9dede] px-2 py-1 text-xs font-bold text-[#7e1f1f]"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => {
            if (display !== '0' && display !== 'Error') {
              setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`)
            }
          }}
          className="rounded border border-[#8ba6cb] bg-[#e8f0fd] px-2 py-1 text-xs font-bold text-[#194379]"
        >
          +/-
        </button>
        <button
          type="button"
          onClick={() => compute('/')}
          className="rounded border border-[#8ba6cb] bg-[#e8f0fd] px-2 py-1 text-xs font-bold text-[#194379]"
        >
          /
        </button>

        {calculatorKeys.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            className="rounded border border-[#8ba6cb] bg-[#edf4ff] px-2 py-2 text-sm font-semibold text-[#173765] hover:bg-[#dceafc]"
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CalculatorApp

import React, { useState } from 'react'
import './App.css'
import Globe from './globe/Globe';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Globe />
      <h1>Interactive 3D Globe</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on a country to view more information
      </p>
    </>
  )
}

export default App 
import React, { useState } from 'react'
import './App.css'

function App(): React.ReactElement {
  const [apiStatus, setApiStatus] = useState<string>('')

  const checkHealth = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/health')
      const data = await response.json()
      setApiStatus(data.status)
    } catch (error) {
      setApiStatus('error')
    }
  }

  return (
    <div className="App">
      <h1>EyeSmile</h1>
      <button onClick={checkHealth}>Check API Status</button>
      <p>API Status: {apiStatus}</p>
    </div>
  )
}

export default App 
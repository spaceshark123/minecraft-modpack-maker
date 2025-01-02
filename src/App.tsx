import { useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"

function App() {
  const [count, setCount] = useState(0)
  const increment = () => setCount((count) => count + 1)

  return (
    <>
      <Button onClick={increment} className='m-5 block'>count is: {count}</Button>
    </>
  )
}

export default App

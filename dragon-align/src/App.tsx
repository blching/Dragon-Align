import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import DragonBoatLineup from './DragonBoatLineup';


function App() {
  const [count, setCount] = useState(0)

  return (
      <>
      <Router>
        <Routes>
          <Route path="/" element={<DragonBoatLineup/>}></Route>
        </Routes>
      </Router>
    </>
  )
}

export default App

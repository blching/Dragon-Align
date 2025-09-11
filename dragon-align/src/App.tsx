import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import DragonBoatLineup from './DragonBoatLineup';


function App() {

  return (

      <Router>
        <Routes>
          <Route path="/Dragon-Align" element={<DragonBoatLineup/>}></Route>
        </Routes>
      </Router>

  )
}

export default App

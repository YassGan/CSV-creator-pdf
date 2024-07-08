import './App.css';

import PdfImporter from './Pages/PdfImporter'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function App() {
  return (
    <div className="App">
    
   

<div>

  
<Router>
      <Routes>
        <Route path='/pdfImporter' element={<PdfImporter/>}/>  
        </Routes>



    </Router>


</div>


    </div>
  );
}

export default App;

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobeExplorer } from './pages/GlobeExplorer';
import { DestinationDetail } from './pages/DestinationDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GlobeExplorer />} />
        <Route path="/destination/:key" element={<DestinationDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

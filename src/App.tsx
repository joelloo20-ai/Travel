import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const GlobeExplorer = lazy(() => import('./pages/GlobeExplorer').then((module) => ({ default: module.GlobeExplorer })));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail').then((module) => ({ default: module.DestinationDetail })));
const Atlas = lazy(() => import('./pages/Atlas').then((module) => ({ default: module.Atlas })));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<div className="route-loader" aria-label="Loading page" />}>
        <Routes>
          <Route path="/" element={<GlobeExplorer />} />
          <Route path="/destination/:key" element={<DestinationDetail />} />
          <Route path="/atlas" element={<Atlas />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

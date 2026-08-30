import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';

const GlobeExplorer = lazy(() => import('./pages/GlobeExplorer').then((module) => ({ default: module.GlobeExplorer })));
const DestinationDetail = lazy(() => import('./pages/DestinationDetail').then((module) => ({ default: module.DestinationDetail })));
const Atlas = lazy(() => import('./pages/Atlas').then((module) => ({ default: module.Atlas })));

// Local development keeps normal URLs; GitHub Pages uses hashes so deep links do not 404.
const Router = import.meta.env.BASE_URL === '/' ? BrowserRouter : HashRouter;

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="route-loader" aria-label="Loading page" />}>
        <Routes>
        <Route path="/" element={<GlobeExplorer />} />
        <Route path="/globe" element={<GlobeExplorer />} />
          <Route path="/destination/:key" element={<DestinationDetail />} />
          <Route path="/atlas" element={<Atlas />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

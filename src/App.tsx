import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import QuotesList from './pages/QuotesList';
import NewQuote from './pages/NewQuote';
import EditQuote from './pages/EditQuote';
import CostHistory from './pages/CostHistory';
import Clients from './pages/Clients';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CostCalculation from './pages/CostCalculation';

function App() {
  console.log('App component rendering...');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/quotes/new" element={<NewQuote />} />
            <Route path="/quotes/edit/:id" element={<EditQuote />} />
            <Route path="/cost-calculation" element={<CostCalculation />} />
            <Route path="/cost-history" element={<CostHistory />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App;
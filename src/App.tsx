import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuotesList from './pages/QuotesList';
import QuoteManagement from './pages/QuoteManagement';
import NewQuote from './pages/NewQuote';
import EditQuote from './pages/EditQuote';
import CostHistory from './pages/CostHistory';
import Clients from './pages/Clients';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import CostCalculation from './pages/CostCalculation';
import LoadingSpinner from './components/ui/LoadingSpinner';

function App() {
  const [user, loading, error] = useAuthState(auth);
  
  console.log('App component rendering...');
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication check failed
  if (error) {
    console.error('Authentication error:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          {/* Public routes (no authentication required) */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes (authentication required) */}
          <Route path="/*" element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/quotes" element={<QuotesList />} />
                  <Route path="/quote-management" element={<QuoteManagement />} />
                  <Route path="/quotes/new" element={<NewQuote />} />
                  <Route path="/quotes/edit/:id" element={<EditQuote />} />
                  <Route path="/cost-calculation" element={<CostCalculation />} />
                  <Route path="/cost-history" element={<CostHistory />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            ) : (
              <Login />
            )
          } />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
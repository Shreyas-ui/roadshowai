
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CustomerRegistration from './CustomerRegistration';
import BoothManagement from './BoothManagement';
import Dashboard from './Dashboard';
import ReportManagement from './ReportManagement';
import Configuration from './Configuration';
import { loadData, saveData, fetchInitialData } from './dataUtils';

// Simple logging utility
function logEvent(type, message, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message, ...context };
  // Store logs in localStorage for demo; in real app, send to server
  let logs = [];
  try {
    logs = JSON.parse(localStorage.getItem('roadshowai_logs')) || [];
  } catch (e) {
    // ignore
  }
  logs.push(logEntry);
  localStorage.setItem('roadshowai_logs', JSON.stringify(logs));
  // Optionally, print to console for dev
  if (type === 'error') {
    // eslint-disable-next-line no-console
    console.error(`[${timestamp}] [${type}] ${message}`, context);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] [${type}] ${message}`, context);
  }
}

const DEFAULT_DATA = {
  booths: [
    { id: 1, name: 'AI Everyday', handlers: [], queue: [], completed: [] },
    { id: 2, name: 'AI for Excel', handlers: [], queue: [], completed: [] },
    { id: 3, name: 'AI for Science', handlers: [], queue: [], completed: [] }
  ],
  customers: []
};

function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  // Global active calls state: [{ boothId, customer }]
  const [activeCalls, setActiveCalls] = useState([]);

  useEffect(() => {
    // Load from backend API
    (async () => {
      try {
        const remote = await loadData();
        if (remote) {
          setData(remote);
          setLoading(false);
          logEvent('info', 'Loaded data from backend');
        } else {
          const initial = await fetchInitialData();
          setData(initial);
          await saveData(initial);
          setLoading(false);
          logEvent('info', 'Loaded initial data from backend');
        }
      } catch (e) {
        setLoading(false);
        logEvent('error', 'Failed to fetch initial data', { error: e.message });
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading) {
      (async () => {
        try {
          await saveData(data);
          logEvent('info', 'Data saved to backend', { data });
        } catch (e) {
          logEvent('error', 'Failed to save data', { error: e.message });
        }
      })();
    }
  }, [data, loading]);

  // Registration handler
  const handleRegister = (form) => {
    try {
      const newCustomer = { ...form };
      setData(prev => {
        const booths = prev.booths.map(b =>
          b.name === form.booth ? { ...b, queue: [...b.queue, newCustomer] } : b
        );
        logEvent('action', 'Customer registered', { customer: newCustomer });
        return { ...prev, customers: [...prev.customers, newCustomer], booths };
      });
    } catch (e) {
      logEvent('error', 'Error during registration', { error: e.message, form });
      alert('An error occurred during registration. Please try again.');
    }
  };

  // Booth management handlers
  // Booth management handlers
  const handleCall = (boothId, token) => {
    try {
      // Move customer from queue to activeCalls
      setData(prev => {
        const booths = prev.booths.map(b => {
          if (b.id === boothId) {
            const idx = b.queue.findIndex(c => c.token === token);
            if (idx !== -1) {
              // Remove from queue
              const queue = b.queue.filter((_, i) => i !== idx);
              return { ...b, queue };
            }
          }
          return b;
        });
        return { ...prev, booths };
      });
      // Add to global activeCalls
      const booth = data.booths.find(b => b.id === boothId);
      const customer = booth?.queue.find(c => c.token === token);
      if (customer) {
        setActiveCalls(prev => [...prev, { boothId, customer }]);
        logEvent('action', 'Customer called to booth', { boothId, token });
      }
    } catch (e) {
      logEvent('error', 'Error during call action', { error: e.message, boothId, token });
      alert('An error occurred while calling the customer.');
    }
  };

  const handleComplete = (boothId, token) => {
    try {
      // Remove from activeCalls, add to completed
      setActiveCalls(prev => prev.filter(c => !(c.boothId === boothId && c.customer.token === token)));
      setData(prev => {
        const booths = prev.booths.map(b => {
          if (b.id === boothId) {
            // Find in completed
            const customer = activeCalls.find(c => c.boothId === boothId && c.customer.token === token)?.customer;
            if (customer) {
              const completed = [...b.completed, customer];
              logEvent('action', 'Customer completed at booth', { boothId, token });
              return { ...b, completed };
            }
          }
          return b;
        });
        return { ...prev, booths };
      });
    } catch (e) {
      logEvent('error', 'Error during complete action', { error: e.message, boothId, token });
      alert('An error occurred while completing the call.');
    }
  };

  const handleAssign = (fromBoothId, token, toBoothId) => {
    try {
      // Remove from activeCalls if present
      setActiveCalls(prev => prev.filter(c => !(c.boothId === fromBoothId && c.customer.token === token)));
      setData(prev => {
        const fromBooth = prev.booths.find(b => b.id === fromBoothId);
        const cust = fromBooth.queue.find(c => c.token === token) || activeCalls.find(c => c.boothId === fromBoothId && c.customer.token === token)?.customer;
        const booths = prev.booths.map(b => {
          if (b.id === fromBoothId) {
            return { ...b, queue: b.queue.filter(c => c.token !== token) };
          } else if (b.id === toBoothId && cust && b.queue.every(c => c.token !== token)) {
            return { ...b, queue: [...b.queue, cust] };
          }
          return b;
        });
        logEvent('action', 'Customer assigned to another booth', { fromBoothId, toBoothId, token });
        return { ...prev, booths };
      });
    } catch (e) {
      logEvent('error', 'Error during assign action', { error: e.message, fromBoothId, toBoothId, token });
      alert('An error occurred while assigning the customer.');
    }
  };

  // Report management handlers
  const handleEditCustomer = (idx, updated, boothIdx, completedIdx) => {
    if (!updated) return; // If just entering edit mode, do nothing
    try {
      setData(prev => {
        let customers = prev.customers;
        let booths = prev.booths;
        let updatedToken = null;
        let oldToken = null;
        let oldBooth = null;
        let newBooth = null;
        if (idx >= 0) {
          // Registered customers
          oldToken = prev.customers[idx].token;
          updatedToken = updated.token;
          oldBooth = prev.customers[idx].booth;
          newBooth = updated.booth;
          customers = prev.customers.map((c, i) => i === idx ? { ...c, ...updated } : c);
          booths = prev.booths.map(b => {
            // Remove from old booth queue/completed if booth or token changed
            let queue = b.queue;
            let completed = b.completed;
            if (b.name === oldBooth) {
              queue = queue.filter(c => c.token !== oldToken);
              completed = completed.map(c => c.token === oldToken ? { ...c, ...updated } : c);
            }
            // Add to new booth queue if booth changed and status is not completed
            if (b.name === newBooth) {
              // Only add if not already present
              if (!queue.some(c => c.token === updatedToken)) {
                queue = [...queue, { ...updated }];
              } else {
                queue = queue.map(c => c.token === updatedToken ? { ...c, ...updated } : c);
              }
              completed = completed.map(c => c.token === updatedToken ? { ...c, ...updated } : c);
            }
            return { ...b, queue, completed };
          });
        } else if (boothIdx !== undefined && completedIdx !== undefined) {
          // Completed customers
          const booth = prev.booths[boothIdx];
          const oldCompleted = booth.completed[completedIdx];
          oldToken = oldCompleted.token;
          updatedToken = updated.token;
          oldBooth = booth.name;
          newBooth = updated.booth;
          booths = prev.booths.map((b, bIdx) => {
            let completed = b.completed;
            let queue = b.queue;
            if (bIdx === boothIdx) {
              completed = completed.map((c, cIdx) => cIdx === completedIdx ? { ...c, ...updated } : c);
            }
            // If booth changed, move completed record
            if (b.name === newBooth && bIdx !== boothIdx) {
              completed = [...completed, { ...updated }];
              // Remove from old booth
              booths = booths.map((bb, bbIdx) => {
                if (bbIdx === boothIdx) {
                  return { ...bb, completed: bb.completed.filter((c, cIdx) => cIdx !== completedIdx) };
                }
                return bb;
              });
            }
            // Update queue if token/booth changed
            queue = queue.map(c => c.token === oldToken ? { ...c, ...updated } : c);
            return { ...b, completed, queue };
          });
        }
        // Also update activeCalls if customer is in-call
        setActiveCalls(prevActiveCalls => prevActiveCalls.map(call => {
          if (call.customer.token === oldToken) {
            return { ...call, customer: { ...call.customer, ...updated }, boothId: booths.find(b => b.name === newBooth)?.id || call.boothId };
          }
          return call;
        }));
        logEvent('action', 'Customer edited', { idx, updated, boothIdx, completedIdx });
        return { ...prev, customers, booths };
      });
    } catch (e) {
      logEvent('error', 'Error during customer edit', { error: e.message, idx, updated, boothIdx, completedIdx });
      alert('An error occurred while editing the customer.');
    }
  };
  const handleDeleteCustomer = (idx, boothIdx, completedIdx) => {
    try {
      setData(prev => {
        let customers = prev.customers;
        let booths = prev.booths;
        if (idx >= 0) {
          // Registered customers
          const customer = prev.customers[idx];
          booths = prev.booths.map(b => ({
            ...b,
            queue: b.queue.filter(c => c.token !== customer.token),
            completed: b.completed.filter(c => c.token !== customer.token)
          }));
          customers = prev.customers.filter((_, i) => i !== idx);
        } else if (boothIdx !== undefined && completedIdx !== undefined) {
          // Completed customers
          booths = prev.booths.map((b, bIdx) => {
            if (bIdx === boothIdx) {
              const completed = b.completed.filter((_, cIdx) => cIdx !== completedIdx);
              return { ...b, completed };
            }
            return b;
          });
        }
        logEvent('action', 'Customer deleted', { idx, boothIdx, completedIdx });
        return { ...prev, customers, booths };
      });
    } catch (e) {
      logEvent('error', 'Error during customer delete', { error: e.message, idx, boothIdx, completedIdx });
      alert('An error occurred while deleting the customer.');
    }
  };

  // Configuration handlers
  const handleAddBooth = (name) => {
    setData(prev => {
      const id = Math.max(...prev.booths.map(b => b.id)) + 1;
      return { ...prev, booths: [...prev.booths, { id, name, handlers: [], queue: [], completed: [] }] };
    });
  };
  const handleDeleteBooth = (id) => {
    setData(prev => {
      const booths = prev.booths.filter(b => b.id !== id);
      return { ...prev, booths };
    });
  };

  if (loading) return <div className="container mt-5">Loading...</div>;

  return (
    <Router>
      <NavbarWithHighlight />
      <Routes>
        <Route path="/register" element={<CustomerRegistration onRegister={handleRegister} boothOptions={data.booths.map(b => b.name)} />} />
        <Route path="/booth" element={<BoothManagement booths={data.booths} onCall={handleCall} onComplete={handleComplete} onAssign={handleAssign} activeCalls={activeCalls} />} />
        <Route path="/dashboard" element={<Dashboard booths={data.booths} activeCalls={activeCalls} />} />
        <Route path="/report" element={<ReportManagement customers={data.customers} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} boothOptions={data.booths.map(b => b.name)} booths={data.booths} activeCalls={activeCalls} />} />
        <Route path="/config" element={<Configuration booths={data.booths} onAddBooth={handleAddBooth} onDeleteBooth={handleDeleteBooth} />} />
        <Route path="/" element={<div className="container mt-5"><h1>Welcome to the AI Roadshow!</h1></div>} />
      </Routes>
    </Router>
  );
}

// Helper NavItem and NavbarWithHighlight for menu highlighting
function NavItem({ to, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <li className="nav-item">
      <Link className={`nav-link${isActive ? ' active fw-bold text-primary' : ''}`} to={to} style={isActive ? { background: '#e3e3ff', borderRadius: 4 } : {}}>{label}</Link>
    </li>
  );
}

function NavbarWithHighlight() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">AI Roadshow</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <NavItem to="/register" label="Register" />
            <NavItem to="/booth" label="Booth Management" />
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/report" label="Report" />
            <NavItem to="/config" label="Configuration" />
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default App;

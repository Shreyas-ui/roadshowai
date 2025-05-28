

import React, { useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';


function BoothManagement({ booths, onCall, onComplete, onAssign, activeCalls }) {
  // Defensive: handle missing or empty booths
  const hasBooths = Array.isArray(booths) && booths.length > 0;
  const [selectedBoothId, setSelectedBoothId] = useState(hasBooths ? booths[0].id : null);

  const selectedBooth = hasBooths ? booths.find(b => b.id === selectedBoothId) : null;
  const otherBooths = hasBooths ? booths.filter(b => b.id !== selectedBoothId) : [];

  // Move to active calls
  const handleCall = (boothId, token) => {
    onCall(boothId, token);
  };

  // Complete call
  const handleComplete = (boothId, token) => {
    onComplete(boothId, token);
  };

  // Assign to another booth
  const handleAssign = (fromBoothId, token, toBoothId) => {
    onAssign(fromBoothId, token, toBoothId);
  };

  return (
    <div className="container mt-4">
      <h2>AI Booth Management</h2>
      {!hasBooths && (
        <div className="alert alert-warning mt-3">No booths are currently available. Please check back later or contact support.</div>
      )}
      {hasBooths && (
        <>
          <Form.Group className="mb-3" style={{ maxWidth: 300 }}>
            <Form.Label>Select Booth</Form.Label>
            <Form.Select value={selectedBoothId} onChange={e => setSelectedBoothId(Number(e.target.value))}>
              {booths.map(booth => (
                <option key={booth.id} value={booth.id}>{booth.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Queue Table */}
          <h5>Queue</h5>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Token</th>
                <th>Assign</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedBooth && selectedBooth.queue.length > 0 ? (
                selectedBooth.queue.map((cust, idx) => (
                  <tr key={idx}>
                    <td>{cust.name}</td>
                    <td>{cust.email}</td>
                    <td>{cust.token}</td>
                    <td>
                      <Form.Select size="sm" style={{ width: 120, display: 'inline-block' }}
                        onChange={e => handleAssign(selectedBoothId, cust.token, Number(e.target.value))}
                        defaultValue="">
                        <option value="">Assign to...</option>
                        {otherBooths.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </Form.Select>
                    </td>
                    <td>
                      <Button variant="success" size="sm" onClick={() => handleCall(selectedBoothId, cust.token)}>Call</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}>No customers in queue</td></tr>
              )}
            </tbody>
          </Table>

          {/* Active Calls Table */}
          <h5>Active Calls</h5>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Token</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeCalls && activeCalls.filter(c => c.boothId === selectedBoothId).length > 0 ? (
                activeCalls.filter(c => c.boothId === selectedBoothId).map((call, idx) => (
                  <tr key={idx}>
                    <td>{call.customer.name}</td>
                    <td>{call.customer.email}</td>
                    <td>{call.customer.token}</td>
                    <td>
                      <Button variant="primary" size="sm" onClick={() => handleComplete(selectedBoothId, call.customer.token)}>Complete</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4}>No active calls</td></tr>
              )}
            </tbody>
          </Table>

          {/* Completed Table */}
          <h5>Completed</h5>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Token</th>
              </tr>
            </thead>
            <tbody>
              {selectedBooth && selectedBooth.completed.length > 0 ? (
                selectedBooth.completed.map((cust, idx) => (
                  <tr key={idx}>
                    <td>{cust.name}</td>
                    <td>{cust.email}</td>
                    <td>{cust.token}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3}>No completed customers</td></tr>
              )}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}

export default BoothManagement;

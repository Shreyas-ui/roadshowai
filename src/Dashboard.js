
import React from 'react';
import { Card, Row, Col, ListGroup, Table } from 'react-bootstrap';

function Dashboard({ booths, activeCalls }) {
  const hasBooths = Array.isArray(booths) && booths.length > 0;
  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>
      {!hasBooths ? (
        <div className="alert alert-warning mt-3">No booths are currently available. Please check back later or contact support.</div>
      ) : (
        <Row>
          {booths.map(booth => {
            // Next 3 upcoming tokens (from queue)
            const nextTokens = booth.queue.slice(0, 3);
            // Last 5 completed tokens
            const lastCompleted = booth.completed.slice(-5);
            // All currently in-call tokens for this booth
            const inCall = activeCalls.filter(c => c.boothId === booth.id);
            return (
              <Col md={4} key={booth.id} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title>{booth.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">Status: {booth.queue.length > 0 ? 'Active' : 'Idle'}</Card.Subtitle>
                    <ListGroup variant="flush" className="mb-3">
                      <ListGroup.Item><b>Next 3 Tokens:</b> {nextTokens.length > 0 ? nextTokens.map(c => c.token).join(', ') : 'None'}</ListGroup.Item>
                      <ListGroup.Item><b>Last 5 Completed:</b> {lastCompleted.length > 0 ? lastCompleted.map(c => c.token).join(', ') : 'None'}</ListGroup.Item>
                    </ListGroup>
                    <div>
                      <b>Upcoming:</b>
                      <Table size="sm" bordered>
                        <thead><tr><th>Token</th><th>Name</th></tr></thead>
                        <tbody>
                          {nextTokens.length > 0 ? (
                            nextTokens.map((c, i) => <tr key={i}><td>{c.token}</td><td>{c.name}</td></tr>)
                          ) : (
                            <tr><td colSpan={2}>None</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                    <div>
                      <b>Completed:</b>
                      <Table size="sm" bordered>
                        <thead><tr><th>Token</th><th>Name</th></tr></thead>
                        <tbody>
                          {lastCompleted.length > 0 ? (
                            lastCompleted.map((c, i) => <tr key={i}><td>{c.token}</td><td>{c.name}</td></tr>)
                          ) : (
                            <tr><td colSpan={2}>None</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                    <div>
                      <b>In-Call:</b>
                      <Table size="sm" bordered>
                        <thead><tr><th>Token</th><th>Name</th></tr></thead>
                        <tbody>
                          {inCall.length > 0 ? (
                            inCall.map((c, i) => <tr key={i}><td>{c.customer.token}</td><td>{c.customer.name}</td></tr>)
                          ) : (
                            <tr><td colSpan={2}>None</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

export default Dashboard;

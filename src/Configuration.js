import React, { useState } from 'react';
import { Form, Button, ListGroup } from 'react-bootstrap';

function Configuration({ booths, onAddBooth, onDeleteBooth }) {
  const [newBooth, setNewBooth] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newBooth.trim()) {
      onAddBooth(newBooth.trim());
      setNewBooth('');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Configuration</h2>
      <Form onSubmit={handleAdd} className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>New Booth Name</Form.Label>
          <Form.Control value={newBooth} onChange={e => setNewBooth(e.target.value)} />
        </Form.Group>
        <Button type="submit" variant="primary">Add Booth</Button>
      </Form>
      {(!booths || booths.length === 0) ? (
        <div className="alert alert-warning">No booths configured yet.</div>
      ) : (
        <ListGroup>
          {booths.map(booth => (
            <ListGroup.Item key={booth.id} className="d-flex justify-content-between align-items-center">
              {booth.name}
              <Button variant="danger" size="sm" onClick={() => onDeleteBooth(booth.id)}>Delete</Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}

export default Configuration;

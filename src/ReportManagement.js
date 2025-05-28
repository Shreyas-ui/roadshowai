
import React, { useState } from 'react';
import { Table, Button, Form, Modal } from 'react-bootstrap';

function ReportManagement({ customers, onEdit, onDelete, boothOptions, booths, activeCalls }) {
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);

  const handleEditClick = (idx) => {
    setEditIdx(idx);
    setEditForm({ ...customers[idx] });
    if (onEdit) onEdit(idx);
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSave = () => {
    // Save changes
    if (onEdit) onEdit(editIdx, editForm);
    setEditIdx(null);
  };
  const handleEditCancel = () => {
    setEditIdx(null);
  };
  const handleDeleteClick = (idx) => {
    setDeleteIdx(idx);
    setShowDelete(true);
  };
  const handleDeleteConfirm = () => {
    if (onDelete) onDelete(deleteIdx);
    setShowDelete(false);
    setDeleteIdx(null);
  };
  const handleDeleteCancel = () => {
    setShowDelete(false);
    setDeleteIdx(null);
  };

  // Gather all completed customers from all booths
  const completedCustomers = booths
    ? booths.flatMap(b => b.completed.map(c => ({ ...c, booth: b.name })))
    : [];

  // Track edit state for completed customers
  const [editCompletedIdx, setEditCompletedIdx] = useState(null);
  const [editCompletedForm, setEditCompletedForm] = useState({});
  const [showDeleteCompleted, setShowDeleteCompleted] = useState(false);
  const [deleteCompletedIdx, setDeleteCompletedIdx] = useState(null);

  // Helper to update completed customer in parent
  const handleEditCompletedClick = (idx) => {
    setEditCompletedIdx(idx);
    setEditCompletedForm({ ...completedCustomers[idx] });
  };
  const handleEditCompletedChange = (e) => {
    setEditCompletedForm({ ...editCompletedForm, [e.target.name]: e.target.value });
  };
  const handleEditCompletedSave = () => {
    // Find booth and token
    const boothName = editCompletedForm.booth;
    const token = editCompletedForm.token;
    const boothIdx = booths.findIndex(b => b.name === boothName);
    if (boothIdx !== -1 && onEdit) {
      // Find completed index in booth
      const completedIdx = booths[boothIdx].completed.findIndex(c => c.token === token);
      if (completedIdx !== -1) {
        onEdit(-1, editCompletedForm, boothIdx, completedIdx); // -1 signals completed
      }
    }
    setEditCompletedIdx(null);
  };
  const handleEditCompletedCancel = () => {
    setEditCompletedIdx(null);
  };
  const handleDeleteCompletedClick = (idx) => {
    setDeleteCompletedIdx(idx);
    setShowDeleteCompleted(true);
  };
  const handleDeleteCompletedConfirm = () => {
    // Find booth and token
    const boothName = completedCustomers[deleteCompletedIdx].booth;
    const token = completedCustomers[deleteCompletedIdx].token;
    const boothIdx = booths.findIndex(b => b.name === boothName);
    if (boothIdx !== -1 && onDelete) {
      // Find completed index in booth
      const completedIdx = booths[boothIdx].completed.findIndex(c => c.token === token);
      if (completedIdx !== -1) {
        onDelete(-1, boothIdx, completedIdx); // -1 signals completed
      }
    }
    setShowDeleteCompleted(false);
    setDeleteCompletedIdx(null);
  };
  const handleDeleteCompletedCancel = () => {
    setShowDeleteCompleted(false);
    setDeleteCompletedIdx(null);
  };

  return (
    <div className="container mt-4">
      <h2>Report & Management</h2>
      <h5>Registered Customers</h5>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Token</th>
            <th>Booth</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers
            .map((cust, idx) => {
              // Determine status: Active (in-call), Waiting (in queue), Completed
              let status = 'Waiting';
              const booth = booths.find(b => b.name === cust.booth);
              if (booth) {
                if (booth.queue.some(c => c.token === cust.token)) {
                  status = 'Waiting';
                } else if (booth.completed.some(c => c.token === cust.token)) {
                  status = 'Completed';
                } else if (
                  activeCalls &&
                  activeCalls.some(c => c.customer.token === cust.token && c.boothId === booth.id)
                ) {
                  status = 'Active';
                } else {
                  status = 'Active';
                }
              }
              return { cust, idx, status };
            })
            .filter(({ status }) => status === 'Active' || status === 'Waiting')
            .map(({ cust, idx, status }) => (
              <tr key={idx} style={editIdx === idx ? { background: '#e3e3ff' } : {}}>
                {editIdx === idx ? (
                  <>
                    <td><Form.Control name="name" value={editForm.name} onChange={handleEditChange} size="sm" /></td>
                    <td><Form.Control name="email" value={editForm.email} onChange={handleEditChange} size="sm" /></td>
                    <td><Form.Control name="mobile" value={editForm.mobile} onChange={handleEditChange} size="sm" /></td>
                    <td><Form.Control name="token" value={editForm.token} onChange={handleEditChange} size="sm" /></td>
                    <td>
                      <Form.Select name="booth" value={editForm.booth} onChange={handleEditChange} size="sm">
                        {boothOptions && boothOptions.length > 0 ? boothOptions.map(opt => <option key={opt}>{opt}</option>) : <option>No booths configured</option>}
                      </Form.Select>
                    </td>
                    <td><span className={`badge bg-${status === 'Active' ? 'info' : status === 'Completed' ? 'success' : 'secondary'}`}>{status}</span></td>
                    <td>
                      <Button variant="success" size="sm" onClick={handleEditSave}>Save</Button>{' '}
                      <Button variant="secondary" size="sm" onClick={handleEditCancel}>Cancel</Button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{cust.name}</td>
                    <td>{cust.email}</td>
                    <td>{cust.mobile}</td>
                    <td>{cust.token}</td>
                    <td>{cust.booth}</td>
                    <td><span className={`badge bg-${status === 'Active' ? 'info' : status === 'Completed' ? 'success' : 'secondary'}`}>{status}</span></td>
                    <td>
                      <Button variant="info" size="sm" onClick={() => handleEditClick(idx)}>Edit</Button>{' '}
                      <Button variant="danger" size="sm" onClick={() => handleDeleteClick(idx)}>Delete</Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
        </tbody>
      </Table>

      <h5>Completed Customers</h5>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Token</th>
            <th>Booth</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {completedCustomers.length === 0 && (
            <tr><td colSpan={7}>No completed customers</td></tr>
          )}
          {completedCustomers.map((cust, idx) => (
            <tr key={idx} style={editCompletedIdx === idx ? { background: '#e3e3ff' } : {}}>
              {editCompletedIdx === idx ? (
                <>
                  <td><Form.Control name="name" value={editCompletedForm.name} onChange={handleEditCompletedChange} size="sm" /></td>
                  <td><Form.Control name="email" value={editCompletedForm.email} onChange={handleEditCompletedChange} size="sm" /></td>
                  <td><Form.Control name="mobile" value={editCompletedForm.mobile} onChange={handleEditCompletedChange} size="sm" /></td>
                  <td><Form.Control name="token" value={editCompletedForm.token} onChange={handleEditCompletedChange} size="sm" /></td>
                  <td>
                    <Form.Select name="booth" value={editCompletedForm.booth} onChange={handleEditCompletedChange} size="sm">
                      {boothOptions && boothOptions.length > 0 ? boothOptions.map(opt => <option key={opt}>{opt}</option>) : <option>No booths configured</option>}
                    </Form.Select>
                  </td>
                  <td><span className="badge bg-success">Completed</span></td>
                  <td>
                    <Button variant="success" size="sm" onClick={handleEditCompletedSave}>Save</Button>{' '}
                    <Button variant="secondary" size="sm" onClick={handleEditCompletedCancel}>Cancel</Button>
                  </td>
                </>
              ) : (
                <>
                  <td>{cust.name}</td>
                  <td>{cust.email}</td>
                  <td>{cust.mobile}</td>
                  <td>{cust.token}</td>
                  <td>{cust.booth}</td>
                  <td><span className="badge bg-success">Completed</span></td>
                  <td>
                    <Button variant="info" size="sm" onClick={() => handleEditCompletedClick(idx)}>Edit</Button>{' '}
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCompletedClick(idx)}>Delete</Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showDelete} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this customer?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showDeleteCompleted} onHide={handleDeleteCompletedCancel} centered>
        <Modal.Header closeButton><Modal.Title>Confirm Delete</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete this completed customer?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCompletedCancel}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteCompletedConfirm}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ReportManagement;

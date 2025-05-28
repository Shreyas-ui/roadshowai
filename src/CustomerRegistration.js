import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
// import emailjs from 'emailjs-com'; // Uncomment and configure for real email sending

function CustomerRegistration({ onRegister, boothOptions }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    token: '',
    booth: boothOptions && boothOptions.length > 0 ? boothOptions[0] : '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Update booth selection if boothOptions change
  React.useEffect(() => {
    if (boothOptions && boothOptions.length > 0) {
      setForm(f => ({ ...f, booth: boothOptions.includes(f.booth) ? f.booth : boothOptions[0] }));
    }
  }, [boothOptions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onRegister) onRegister(form);
    setSubmitted(true);
    setForm({ name: '', email: '', mobile: '', token: '', booth: boothOptions && boothOptions.length > 0 ? boothOptions[0] : '' }); // Clear form after submit
    // EmailJS example (configure serviceId, templateId, userId):
    // emailjs.send(serviceId, templateId, form, userId)
    //   .then(() => setSubmitted(true));
  };

  return (
    <div className="container mt-4">
      <h2>Customer Registration</h2>
      {submitted && <Alert variant="success">Registration successful! Check your email for confirmation.</Alert>}
      {(!boothOptions || boothOptions.length === 0) ? (
        <Alert variant="warning">No booths are currently available for registration. Please check back later or contact support.</Alert>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control name="name" value={form.name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email ID</Form.Label>
            <Form.Control type="email" name="email" value={form.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mobile Number</Form.Label>
            <Form.Control name="mobile" value={form.mobile} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Token Number</Form.Label>
            <Form.Control name="token" value={form.token} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>AI Booth Options</Form.Label>
            <Form.Select name="booth" value={form.booth} onChange={handleChange} required>
              {boothOptions.map(opt => <option key={opt}>{opt}</option>)}
            </Form.Select>
          </Form.Group>
          <Button variant="primary" type="submit">Register</Button>
        </Form>
      )}
    </div>
  );
}

export default CustomerRegistration;

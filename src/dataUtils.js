// Utility functions for reading/writing data via backend API

const API_URL = '/api/data'; // Use relative path for Azure deployment

// Load all data from backend
export async function loadData() {
  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) throw new Error('Failed to fetch data');
    return await resp.json();
  } catch (e) {
    return null;
  }
}

// Save all data to backend
export async function saveData(data) {
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// For initial load from backend (same as loadData)
export async function fetchInitialData() {
  return await loadData();
}

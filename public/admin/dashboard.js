let sahabaData = [];

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Load Sahaba data
async function loadSahabaData() {
    try {
        const response = await fetch('/api/sahaba', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            sahabaData = await response.json();
            displaySahaba();
        } else {
            throw new Error('Failed to load data');
        }
    } catch (error) {
        alert('Error loading data. Please try again.');
    }
}

// Display Sahaba in the list
function displaySahaba() {
    const list = document.getElementById('sahabaList');
    list.innerHTML = sahabaData.map(sahabi => `
        <div class="sahaba-item">
            <div class="icon">${sahabi.icon || '#'}</div>
            <div>
                <h3>${sahabi.name} (${sahabi.nameArabic})</h3>
                <p>${sahabi.description.substring(0, 100)}...</p>
            </div>
            <div class="actions">
                <button onclick="editSahabi(${sahabi.id})" class="btn btn-secondary">Edit</button>
                <button onclick="deleteSahabi(${sahabi.id})" class="btn btn-secondary">Delete</button>
            </div>
        </div>
    `).join('');
}

// Show add modal
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Sahabi';
    document.getElementById('sahabiForm').reset();
    document.getElementById('addEditModal').style.display = 'block';
}

// Show edit modal
function editSahabi(id) {
    const sahabi = sahabaData.find(s => s.id === id);
    if (sahabi) {
        document.getElementById('modalTitle').textContent = 'Edit Sahabi';
        document.getElementById('name').value = sahabi.name;
        document.getElementById('nameArabic').value = sahabi.nameArabic;
        document.getElementById('description').value = sahabi.description;
        // Set other fields...
        document.getElementById('addEditModal').style.display = 'block';
    }
}

// Close modal
function closeModal() {
    document.getElementById('addEditModal').style.display = 'none';
}

// Save Sahabi
async function saveSahabi(formData) {
    try {
        const response = await fetch('/api/sahaba', {
            method: formData.id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            loadSahabaData();
            closeModal();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        alert('Error saving data. Please try again.');
    }
}

// Delete Sahabi
async function deleteSahabi(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        try {
            const response = await fetch(`/api/sahaba/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (response.ok) {
                loadSahabaData();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            alert('Error deleting entry. Please try again.');
        }
    }
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}

// Initialize
checkAuth();
loadSahabaData();

// Form submission handler
document.getElementById('sahabiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
        name: document.getElementById('name').value,
        nameArabic: document.getElementById('nameArabic').value,
        description: document.getElementById('description').value,
        categories: Array.from(document.getElementById('categories').selectedOptions).map(opt => opt.value),
        birthYear: document.getElementById('birthYear').value,
        deathYear: document.getElementById('deathYear').value
    };
    saveSahabi(formData);
});
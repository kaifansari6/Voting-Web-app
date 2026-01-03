// API endpoint - will be proxied through the Node.js backend
const API_BASE_URL = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadResults();
    
    // Form submission handler
    document.getElementById('votingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await submitVote();
    });
});

// Submit vote to the backend
async function submitVote() {
    const voterName = document.getElementById('voterName').value;
    const voterEmail = document.getElementById('voterEmail').value;
    const voteOption = document.querySelector('input[name="vote"]:checked').value;
    
    const voteData = {
        voterName: voterName,
        voterEmail: voterEmail,
        vote: voteOption,
        timestamp: new Date().toISOString()
    };
    
    try {
        showNotification('Submitting your vote...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(voteData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✓ Vote submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('votingForm').reset();
            
            // Reload results
            setTimeout(() => {
                loadResults();
            }, 1000);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit vote');
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showNotification('✗ Error: ' + error.message, 'error');
    }
}

// Load current voting results
async function loadResults() {
    try {
        const response = await fetch(`${API_BASE_URL}/results`);
        
        if (response.ok) {
            const results = await response.json();
            
            document.getElementById('castingCount').textContent = results.casting || 0;
            document.getElementById('notaCount').textContent = results.nota || 0;
            document.getElementById('totalCount').textContent = results.total || 0;
        } else {
            console.error('Failed to load results');
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Show notification message
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Auto-refresh results every 30 seconds
setInterval(loadResults, 30000);

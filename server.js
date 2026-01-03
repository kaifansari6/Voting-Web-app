const express = require('express');
const path = require('path');
const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Azure Table Storage Configuration
const accountName = process.env.AZURE_STORAGE_ACCOUNT || 'your-storage-account';
const accountKey = process.env.AZURE_STORAGE_KEY || 'your-storage-key';
const tableName = process.env.AZURE_TABLE_NAME || 'VotingData';

let tableClient;

// Initialize Azure Table Storage
function initializeTableClient() {
    try {
        const credential = new AzureNamedKeyCredential(accountName, accountKey);
        tableClient = new TableClient(
            `https://${accountName}.table.core.windows.net`,
            tableName,
            credential
        );
        console.log('Azure Table Storage client initialized');
    } catch (error) {
        console.error('Error initializing Table Storage:', error.message);
        console.log('Running in demo mode without Azure Storage');
    }
}

// Create table if it doesn't exist
async function ensureTableExists() {
    if (!tableClient) return;
    
    try {
        await tableClient.createTable();
        console.log(`Table '${tableName}' created or already exists`);
    } catch (error) {
        if (error.statusCode !== 409) { // 409 means table already exists
            console.error('Error creating table:', error.message);
        }
    }
}

// API endpoint to submit a vote
app.post('/api/vote', async (req, res) => {
    try {
        const { voterName, voterEmail, vote, timestamp } = req.body;
        
        if (!voterName || !voterEmail || !vote) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        // Create entity for Azure Table Storage
        const entity = {
            partitionKey: 'votes',
            rowKey: uuidv4(),
            voterName: voterName,
            voterEmail: voterEmail,
            vote: vote,
            timestamp: timestamp || new Date().toISOString()
        };
        
        if (tableClient) {
            // Store in Azure Table Storage
            await tableClient.createEntity(entity);
            console.log('Vote stored in Azure Table Storage:', entity);
        } else {
            // Demo mode - just log the vote
            console.log('Demo mode - Vote received:', entity);
        }
        
        res.json({ 
            success: true, 
            message: 'Vote recorded successfully',
            voteId: entity.rowKey
        });
        
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error recording vote: ' + error.message 
        });
    }
});

// API endpoint to get voting results
app.get('/api/results', async (req, res) => {
    try {
        let castingCount = 0;
        let notaCount = 0;
        let total = 0;
        
        if (tableClient) {
            // Query Azure Table Storage
            const entities = tableClient.listEntities({
                queryOptions: { filter: `PartitionKey eq 'votes'` }
            });
            
            for await (const entity of entities) {
                total++;
                if (entity.vote === 'casting') {
                    castingCount++;
                } else if (entity.vote === 'nota') {
                    notaCount++;
                }
            }
        }
        
        res.json({
            casting: castingCount,
            nota: notaCount,
            total: total
        });
        
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching results: ' + error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        azureConnected: !!tableClient
    });
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
async function startServer() {
    initializeTableClient();
    await ensureTableExists();
    
    app.listen(PORT, () => {
        console.log(`Voting application server running on port ${PORT}`);
        console.log(`Open http://localhost:${PORT} in your browser`);
    });
}

startServer();

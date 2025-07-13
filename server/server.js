require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const { initiateDeveloperControlledWalletsClient } = require('@circle-fin/developer-controlled-wallets');
const forge = require('node-forge');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // For Vite default port
    'https://your-frontend-domain.com',
    // Add your production frontend URL here when ready
    // 'https://your-production-frontend.com'
];

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@host:port/database?sslmode=require';

// Create table if it doesn't exist
async function createTable() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_data (
                mail_address VARCHAR(255) PRIMARY KEY,
                wallet_set_id VARCHAR(255),
                rdata TEXT,
                cdata TEXT,
                uchain VARCHAR(255),
                uaddress VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created or already exists');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await client.end();
    }
}

// Initialize table
createTable();

// Create quick_request table if it doesn't exist
async function createQuickRequestTable() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS quick_request (
                request_id VARCHAR(10) PRIMARY KEY,
                mail_address VARCHAR(255) NOT NULL,
                amount NUMERIC(20,6) NOT NULL,
                chain VARCHAR(50) NOT NULL,
                wallet_address VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                wallet_id VARCHAR(255)
            );
        `);
        console.log('Quick request table created or already exists');

        // Add status column if it doesn't exist
        try {
            await client.query(`
                ALTER TABLE quick_request 
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
            `);
            console.log('Status column added if not exists');
        } catch (err) {
            console.log('Status column already exists or error:', err);
        }

        // Add wallet_id column if it doesn't exist
        try {
            await client.query(`
                ALTER TABLE quick_request 
                ADD COLUMN IF NOT EXISTS wallet_id VARCHAR(255);
            `);
            console.log('Wallet_id column added if not exists');
        } catch (err) {
            console.log('Wallet_id column already exists or error:', err);
        }

        // Alter amount column type
        await client.query(`
            ALTER TABLE quick_request 
            ALTER COLUMN amount TYPE NUMERIC(20,6);
        `);
        console.log('Table altered successfully');
    } catch (err) {
        console.error('Error creating/altering table:', err);
    } finally {
        await client.end();
    }
}

// Initialize quick_request table
createQuickRequestTable();

// Create used_hash table if it doesn't exist
async function createUsedHashTable() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS used_hash (
                hash VARCHAR(255) PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Used hash table created or already exists');
    } catch (err) {
        console.error('Error creating used hash table:', err);
    } finally {
        await client.end();
    }
}

// Initialize used_hash table
createUsedHashTable();

// Create transfer table if it doesn't exist
async function createTransferTable() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS transfer (
                request_id VARCHAR(10) PRIMARY KEY,
                user_chain_id VARCHAR(50) NOT NULL,
                user_wallet VARCHAR(255) NOT NULL,
                amount NUMERIC(20,6) NOT NULL,
                wallet_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Transfer table created or already exists');
    } catch (err) {
        console.error('Error creating transfer table:', err);
    } finally {
        await client.end();
    }
}

// Initialize transfer table
createTransferTable();

// GET all records
app.get('/api/records', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM user_data ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching records:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET single record by email
app.get('/api/records/:mail_address', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM user_data WHERE mail_address = $1', [req.params.mail_address]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching record:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET records by email address
app.get('/api/records/email/:email', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query(
            'SELECT * FROM user_data WHERE mail_address = $1 ORDER BY created_at DESC',
            [req.params.email]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No records found for this email address' });
        }
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching records by email:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// POST new record
app.post('/api/records', async (req, res) => {
    const client = new Client({ connectionString });
    const { mail_address, wallet_set_id, rdata, cdata, uchain, uaddress } = req.body;
    
    if (!mail_address) {
        return res.status(400).json({ error: 'mail_address is required' });
    }

    try {
        await client.connect();
        const result = await client.query(
            `INSERT INTO user_data 
            (mail_address, wallet_set_id, rdata, cdata, uchain, uaddress)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [mail_address, wallet_set_id, rdata, cdata, uchain, uaddress]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'A record with this email already exists' });
        }
        console.error('Error creating record:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// PATCH update specific fields
app.patch('/api/records/:mail_address', async (req, res) => {
    const client = new Client({ connectionString });
    const { wallet_set_id, rdata, cdata, uchain, uaddress } = req.body;
    
    try {
        await client.connect();
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (wallet_set_id !== undefined) {
            updates.push(`wallet_set_id = $${paramCount}`);
            values.push(wallet_set_id);
            paramCount++;
        }
        if (rdata !== undefined) {
            updates.push(`rdata = $${paramCount}`);
            values.push(rdata);
            paramCount++;
        }
        if (cdata !== undefined) {
            updates.push(`cdata = $${paramCount}`);
            values.push(cdata);
            paramCount++;
        }
        if (uchain !== undefined) {
            updates.push(`uchain = $${paramCount}`);
            values.push(uchain);
            paramCount++;
        }
        if (uaddress !== undefined) {
            updates.push(`uaddress = $${paramCount}`);
            values.push(uaddress);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.mail_address);
        const result = await client.query(
            `UPDATE user_data 
            SET ${updates.join(', ')}
            WHERE mail_address = $${paramCount}
            RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating record:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Wallet Configuration
const walletConfig = {
    apiKey: process.env.CIRCLE_API_KEY,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET,
    publicKey: `-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----`
};

const evmChains = [
    'ETH-SEPOLIA',
    'ARB-SEPOLIA',
    'BASE-SEPOLIA'
];

// Helper functions for wallet creation
function encryptEntitySecret(entitySecret, publicKeyPem) {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const entitySecretBytes = forge.util.hexToBytes(entitySecret);
    
    const encryptedData = publicKey.encrypt(entitySecretBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
            md: forge.md.sha256.create(),
        },
    });
    
    return forge.util.encode64(encryptedData);
}

function generateIdempotencyKey() {
    return crypto.randomUUID();
}

// Wallet creation endpoint with mail_address, DB insert, and custom rdata/cdata
app.post('/api/create-wallet', async (req, res) => {
    try {
        const { mail_address } = req.body;
        if (!mail_address) {
            return res.status(400).send('mail_address is required');
        }

        // Create wallet
        const entitySecret = walletConfig.entitySecret;
        const entitySecretCiphertext = encryptEntitySecret(entitySecret, walletConfig.publicKey);
        
        const client = initiateDeveloperControlledWalletsClient({
            apiKey: walletConfig.apiKey,
            entitySecret: entitySecret
        });

        // Create wallet set
        const walletSetResponse = await client.createWalletSet({
            name: 'Multi-Chain Wallet Set',
            entitySecretCiphertext: entitySecretCiphertext,
            idempotencyKey: generateIdempotencyKey()
        });

        const walletSet = walletSetResponse.data.walletSet;
        const walletSetId = walletSet.id;

        // Create wallets for all chains
        const walletResponse = await client.createWallets({
            blockchains: evmChains,
            count: 1,
            accountType: 'SCA',
            walletSetId: walletSetId,
            entitySecretCiphertext: entitySecretCiphertext,
            idempotencyKey: generateIdempotencyKey()
        });

        const wallets = walletResponse.data.wallets;

        // Build the plain text response
        let output = '';
        output += 'Wallet Set Created: ' + JSON.stringify(walletSet, null, 2) + '\n';
        output += 'Wallets Created: ' + JSON.stringify(wallets, null, 2) + '\n\n';
        output += 'Wallet Set ID: ' + walletSetId + '\n';
        output += 'Wallet Addresses:\n';
        wallets.forEach(wallet => {
            output += `- ${wallet.address} (${wallet.blockchain})\n`;
        });

        // Prepare cdata: just the addresses and blockchains, one per line, no dash
        let cdata = wallets.map(wallet => `${wallet.address} (${wallet.blockchain})`).join('\n');

        // Insert into DB
        const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
        await dbClient.connect();
        await dbClient.query(
            `INSERT INTO user_data (mail_address, wallet_set_id, rdata, cdata, uchain, uaddress)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [mail_address, walletSetId, output, cdata, '', '']
        );
        await dbClient.end();

        res.set('Content-Type', 'text/plain');
        res.status(201).send(output);
    } catch (error) {
        console.error('Error creating wallet:', error);
        res.status(500).json({ error: 'Failed to create wallet' });
    }
});

// Quick Request API Endpoints

// Create a new quick request
app.post('/api/quick-request', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id, mail_address, amount, chain, wallet_address, name } = req.body;

        // Validate request_id is provided and is 10 digits
        if (!request_id || !/^\d{10}$/.test(request_id)) {
            return res.status(400).json({ error: 'request_id must be a 10-digit number' });
        }

        // Validate amount is a valid number
        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: 'amount must be a valid number' });
        }

        await client.connect();
        const query = `
            INSERT INTO quick_request (request_id, mail_address, amount, chain, wallet_address, name)
            VALUES ($1, $2, $3::numeric, $4, $5, $6)
            RETURNING *;
        `;

        const values = [request_id, mail_address, amount, chain, wallet_address, name];
        const result = await client.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'A request with this ID already exists' });
        }
        console.error('Error creating quick request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Get all quick requests
app.get('/api/quick-request', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM quick_request');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching quick requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Get a specific quick request by ID
app.get('/api/quick-request/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        await client.connect();
        const result = await client.query('SELECT * FROM quick_request WHERE request_id = $1', [request_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quick request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching quick request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Update a quick request
app.put('/api/quick-request/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        const { mail_address, amount, chain, wallet_address, name } = req.body;

        await client.connect();
        const query = `
            UPDATE quick_request
            SET mail_address = $1, amount = $2::numeric, chain = $3, wallet_address = $4, name = $5
            WHERE request_id = $6
            RETURNING *;
        `;

        const values = [mail_address, amount, chain, wallet_address, name, request_id];
        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quick request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating quick request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Delete a quick request
app.delete('/api/quick-request/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        await client.connect();
        const result = await client.query('DELETE FROM quick_request WHERE request_id = $1 RETURNING *', [request_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quick request not found' });
        }

        res.json({ message: 'Quick request deleted successfully' });
    } catch (error) {
        console.error('Error deleting quick request:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Get all request IDs by email from quick-request table
app.get('/api/quick-request/email/:email', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { email } = req.params;
        await client.connect();
        const result = await client.query(
            'SELECT request_id FROM quick_request WHERE mail_address = $1 ORDER BY created_at DESC',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No requests found for this email address' });
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching request IDs by email:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Update status of a quick request
app.patch('/api/quick-request/:request_id/status', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        await client.connect();
        const result = await client.query(
            'UPDATE quick_request SET status = $1 WHERE request_id = $2 RETURNING *',
            [status, request_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quick request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Update wallet_id of a quick request
app.patch('/api/quick-request/:request_id/wallet', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        const { wallet_id } = req.body;

        if (!wallet_id) {
            return res.status(400).json({ error: 'Wallet ID is required' });
        }

        await client.connect();
        const result = await client.query(
            'UPDATE quick_request SET wallet_id = $1 WHERE request_id = $2 RETURNING *',
            [wallet_id, request_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quick request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating wallet_id:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// API endpoints for used_hash table

// POST - Add a new hash
app.post('/api/used-hash', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { hash } = req.body;
        
        if (!hash) {
            return res.status(400).json({ error: 'Hash is required' });
        }

        await client.connect();
        const result = await client.query(
            'INSERT INTO used_hash (hash) VALUES ($1) RETURNING *',
            [hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'This hash already exists' });
        }
        console.error('Error adding hash:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET - Check if a hash exists
app.get('/api/used-hash/:hash', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { hash } = req.params;
        await client.connect();
        const result = await client.query(
            'SELECT * FROM used_hash WHERE hash = $1',
            [hash]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ exists: false });
        }
        
        res.json({ exists: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error checking hash:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET - Get all hashes
app.get('/api/used-hash', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM used_hash ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching hashes:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// DELETE - Remove a hash
app.delete('/api/used-hash/:hash', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { hash } = req.params;
        await client.connect();
        const result = await client.query(
            'DELETE FROM used_hash WHERE hash = $1 RETURNING *',
            [hash]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hash not found' });
        }
        
        res.json({ message: 'Hash deleted successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error deleting hash:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// API endpoints for transfer table

// POST - Create a new transfer
app.post('/api/transfer', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id, user_chain_id, user_wallet, amount, wallet_id } = req.body;

        // Validate request_id is provided and is 10 digits
        if (!request_id || !/^\d{10}$/.test(request_id)) {
            return res.status(400).json({ error: 'request_id must be a 10-digit number' });
        }

        // Validate amount is a valid number
        if (!amount || isNaN(parseFloat(amount))) {
            return res.status(400).json({ error: 'amount must be a valid number' });
        }

        // Validate other required fields
        if (!user_chain_id || !user_wallet || !wallet_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        await client.connect();
        const query = `
            INSERT INTO transfer (request_id, user_chain_id, user_wallet, amount, wallet_id)
            VALUES ($1, $2, $3, $4::numeric, $5)
            RETURNING *;
        `;

        const values = [request_id, user_chain_id, user_wallet, amount, wallet_id];
        const result = await client.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'A transfer with this request_id already exists' });
        }
        console.error('Error creating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET - Get all transfers
app.get('/api/transfer', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM transfer ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// GET - Get a specific transfer by request_id
app.get('/api/transfer/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        await client.connect();
        const result = await client.query('SELECT * FROM transfer WHERE request_id = $1', [request_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// PATCH - Update a transfer
app.patch('/api/transfer/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        const { user_chain_id, user_wallet, amount, wallet_id } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (user_chain_id !== undefined) {
            updates.push(`user_chain_id = $${paramCount}`);
            values.push(user_chain_id);
            paramCount++;
        }
        if (user_wallet !== undefined) {
            updates.push(`user_wallet = $${paramCount}`);
            values.push(user_wallet);
            paramCount++;
        }
        if (amount !== undefined) {
            if (isNaN(parseFloat(amount))) {
                return res.status(400).json({ error: 'amount must be a valid number' });
            }
            updates.push(`amount = $${paramCount}::numeric`);
            values.push(amount);
            paramCount++;
        }
        if (wallet_id !== undefined) {
            updates.push(`wallet_id = $${paramCount}`);
            values.push(wallet_id);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(request_id);
        const query = `
            UPDATE transfer 
            SET ${updates.join(', ')}
            WHERE request_id = $${paramCount}
            RETURNING *;
        `;

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// DELETE - Remove a transfer
app.delete('/api/transfer/:request_id', async (req, res) => {
    const client = new Client({ connectionString });
    try {
        const { request_id } = req.params;
        await client.connect();
        const result = await client.query('DELETE FROM transfer WHERE request_id = $1 RETURNING *', [request_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }
        
        res.json({ message: 'Transfer deleted successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error deleting transfer:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        await client.end();
    }
});

// Add a root route for health check
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Bull = require('bull');
const Redis = require('redis');
const Web3 = require('web3');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Redis client for distributed state
const redisClient = Redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');

// Task queues
const trainingQueue = new Bull('training-tasks', process.env.REDIS_URL);
const validationQueue = new Bull('validation-tasks', process.env.REDIS_URL);

// Web3 setup
const web3 = new Web3(process.env.ETH_NODE_URL || 'http://localhost:8545');
const ethMLContract = new web3.eth.Contract(
    require('../build/contracts/EthML.json').abi,
    process.env.CONTRACT_ADDRESS
);

// Connected workers for task distribution
const connectedWorkers = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New worker connected:', socket.id);
    connectedWorkers.add(socket.id);

    socket.on('disconnect', () => {
        console.log('Worker disconnected:', socket.id);
        connectedWorkers.delete(socket.id);
    });

    // Handle worker availability updates
    socket.on('worker_status', (status) => {
        redisClient.hset(`worker:${socket.id}`, 'status', JSON.stringify(status));
    });
});

// Training task processor
trainingQueue.process(async (job) => {
    const { modelId, dataPoint, taskId } = job.data;
    
    // Distribute task to available worker
    const availableWorkers = Array.from(connectedWorkers);
    if (availableWorkers.length === 0) {
        throw new Error('No workers available');
    }
    
    // Simple round-robin distribution
    const workerIndex = taskId % availableWorkers.length;
    const workerId = availableWorkers[workerIndex];
    
    return new Promise((resolve, reject) => {
        io.to(workerId).emit('training_task', job.data, async (result) => {
            try {
                // Submit result to blockchain
                const accounts = await web3.eth.getAccounts();
                await ethMLContract.methods
                    .submitValidation(taskId, result.prediction)
                    .send({ from: accounts[0] });
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    });
});

// API Routes
app.post('/api/tasks', async (req, res) => {
    try {
        const { modelId, dataPoint, tip } = req.body;
        const accounts = await web3.eth.getAccounts();
        
        // Create task on blockchain
        const result = await ethMLContract.methods
            .requestPrediction(modelId, dataPoint, tip)
            .send({ 
                from: accounts[0],
                value: web3.utils.toWei(tip.toString(), 'ether')
            });
            
        const taskId = result.events.TaskCreated.returnValues.taskId;
        
        // Add to training queue
        await trainingQueue.add({
            taskId,
            modelId,
            dataPoint
        });
        
        res.json({ taskId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tasks/:taskId', async (req, res) => {
    try {
        const task = await ethMLContract.methods
            .getTask(req.params.taskId)
            .call();
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

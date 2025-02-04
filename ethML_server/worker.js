const io = require('socket.io-client');
const { PythonShell } = require('python-shell');
const os = require('os');
require('dotenv').config();

class Worker {
    constructor() {
        this.socket = io(process.env.SERVER_URL || 'http://localhost:3000');
        this.status = {
            cpuUsage: 0,
            memoryUsage: 0,
            activeJobs: 0
        };
        this.setupSocketHandlers();
        this.startStatusUpdates();
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server with ID:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on('training_task', async (task, callback) => {
            try {
                const result = await this.processTask(task);
                callback(result);
            } catch (error) {
                console.error('Error processing task:', error);
                callback({ error: error.message });
            }
        });
    }

    startStatusUpdates() {
        setInterval(() => {
            this.updateStatus();
            this.socket.emit('worker_status', this.status);
        }, 5000);
    }

    updateStatus() {
        const cpus = os.cpus();
        const totalCPU = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total);
        }, 0) / cpus.length;

        this.status = {
            cpuUsage: totalCPU * 100,
            memoryUsage: (os.totalmem() - os.freemem()) / os.totalmem() * 100,
            activeJobs: this.activeJobs
        };
    }

    async processTask(task) {
        this.activeJobs++;
        
        try {
            const { modelId, dataPoint } = task;
            const modelPath = `./models/model_${modelId}.py`;
            
            return new Promise((resolve, reject) => {
                const pyshell = new PythonShell(modelPath, {
                    mode: 'json',
                    args: [dataPoint]
                });

                pyshell.on('message', (message) => {
                    resolve({
                        prediction: message.prediction,
                        confidence: message.confidence
                    });
                });

                pyshell.on('error', (error) => {
                    reject(error);
                });

                pyshell.end((err) => {
                    if (err) reject(err);
                });
            });
        } finally {
            this.activeJobs--;
        }
    }
}

// Start worker
new Worker();

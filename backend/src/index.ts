import express from 'express';
import cors from 'cors';
import dgram from 'dgram';
import dotenv from 'dotenv';
import path from 'path';

// Import .env file environment variables into process.env
dotenv.config({path: path.resolve(__dirname, '../.env')});

// Port and address agent_comm is running/listening on
const AGENT_COMM_PORT = 10091;
const AGENT_COMM_ADDR = '192.168.150.66';
// Where this is running
const WEB_API_PORT = 10090;

// Express modules
const simRoute = require('./routes/sim');

const app = express();
app.use(cors({origin: true}), express.json());

// Express module/middleware for routes
app.use('/sim', simRoute);

// Setting up a very minimal backend for cosmos web's grafana front end
app.get('/', (req, res) => {
    console.log('req received')
    res.send('Hello World!\n')
});

// For packet protocol packets to send to agent_comm
app.post('/comm', (req, res) => {
    if ('cmdID' in req.body)
    {
        // Send to agent_comm
        const socket = dgram.createSocket({ type: 'udp4' });
        socket.send(JSON.stringify(req.body), AGENT_COMM_PORT, AGENT_COMM_ADDR, (err) => {
            if (err) throw err;
            console.log('Sent', JSON.stringify(req.body), 'to', AGENT_COMM_PORT, AGENT_COMM_ADDR);
            socket.close();
        });
    }
    res.send({resp: 'received'});
});

// When requesting orbit propagator
app.post('/orbit', (req, res) => {
    console.log('received in /orbit', req.body);
    res.send({hee: 'postpostpost'});
});

app.listen(WEB_API_PORT, () => {
    console.log(`server running on port ${WEB_API_PORT}`);
});
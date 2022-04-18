import express from 'express';
import cors from 'cors';
import dgram from 'dgram';

const AGENT_COMM_PORT = 10091;

const app = express();
app.use(cors(), express.json());

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
        socket.send(JSON.stringify(req.body), AGENT_COMM_PORT, '192.168.150.66', (err) => {
            if (err) throw err;
            console.log('Sent', JSON.stringify(req.body), 'to', AGENT_COMM_PORT, 'localhost');
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

app.listen(10093, () => {
    console.log(`server running on port 10093`);
});
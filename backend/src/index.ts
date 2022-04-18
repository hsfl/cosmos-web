import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors(), express.json());

// Setting up a very minimal backend for cosmos web's grafana front end

app.get('/', (req, res) => {
    console.log('req received')
    res.send('Hello World!\n')
});

// For packet protocol packets to send to agent_comm
app.post('/comm', (req, res) => {
    console.log('received in /comm', req.body);
    res.send({hee: 'postpostpost'});
});

// When requesting orbit propagator
app.post('/orbit', (req, res) => {
    console.log('received in /orbit', req.body);
    res.send({hee: 'postpostpost'});
});

app.listen(10093, () => {
    console.log(`server running on port 10093`);
});
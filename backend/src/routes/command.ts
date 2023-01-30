import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { AgentRequest, NodeAgent } from '../types/request_types';
const router = express.Router();

/** route POST /command/:node/:agent
    Calls propagator with parameters in body
    test with:
    curl --data '{"request":"...args"}' \
      --request POST \
      --header "Content-Type: application/json" \
      http://localhost:10090/command/:node/:agent
*/
router.post('/:node/:agent', (req: Request<NodeAgent,{},AgentRequest>, res: Response) => {
    const node:string = req.params.node;
    const agent:string = req.params.agent;
    const agent_request = req.body.request;
    const args = [node, agent, ...agent_request.split(' ')];
    console.log('Got agent request for: ', args);
    if (!node.length || !agent.length)
    {
        res.json('Agent request error.');
        return;
    }
    let subprocess = spawn('/root/cosmos/bin/agent', args);
    let stderr = '';
    let stdout = '';
    subprocess.stdout.on('data', (data: string) => {
        stdout += data;
    });
    subprocess.stderr.on('data', (data: string) => {
        stderr += data;
    });
    subprocess.on('error', (err : Error) => {
        console.log('subprocess error: ' + err);
        res.json('Error in running subprocess, see logs.');
    });
    subprocess.on('close', (exitCode: number) => {
        // Error
        if (!!stderr) {
            console.log('exited with error:', exitCode);
            console.log(stderr);
            res.json(stderr);
        }
        // Success
        else if (!!stdout && exitCode === 0) {
            console.log('exited with:', exitCode);
            res.json(stdout);
        }
        // Runs if 'error' event was triggered. res.json was already called, so don't call it again.
        else {
            return;
        }
    });
});

module.exports = router;

// TODOs:
// return proper error struct in res.json (try using the cosmossimpanel with name as node_name instead, for example, you'll
// get Success! Error must have a name, or something like that. Which makes no sense. Follow the line of error from front
// to end and back)

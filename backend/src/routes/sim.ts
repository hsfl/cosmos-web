import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
const router = express.Router();

/** route POST /sim/propagator
    Calls propagator with parameters in body
    test with:
    curl --data '{"start":59270,"runcount":5,"simdt":60,"telem":"ecipos","nodes":[{"name":"node0","frame":"phys", "lat":0.371876,"lon":-2.755147,"alt":400000,"angle":0.942478}]}' \
      --request POST \
      --header "Content-Type: application/json" \
      http://localhost:10090/sim/propagator
*/
router.post('/propagator', (req: Request, res: Response) => {
    let args = [];
    try {
        args.push(JSON.stringify(req.body));
    }
    catch (e: any) {
        throw e;
    }
    let subprocess = spawn('/root/cosmos/bin/propagator_web_json', args);
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
        // Error in propagator
        if (!!stderr) {
            console.log('exited with:', exitCode);
            console.log(stderr);
            res.json(stderr);
        }
        // Propagator call successful
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

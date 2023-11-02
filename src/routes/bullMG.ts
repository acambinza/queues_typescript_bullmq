import { Router } from 'express';

import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api'
import {BullAdapter} from '@bull-board/api/bullAdapter'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

// para eventos globais 
// import { Queue, Worker, Job, QueueEvents } from 'bullmq';

  const connection = new IORedis({
    port: 6379, // Redis port
    host: "172.24.0.2", // Redis host
    //username: "default", // needs Redis >= 6
    // password: "my-top-secret",
    //db: 0, // Defaults to 0
  });  

// console.log(connection)

async function bullMGMonitor() {

  // new IORedis("redis://username:authpassword@127.0.0.1:6380/4");
  const myQueue = new Queue('email', { connection });

  await myQueue.add('client', { name: 'Jorge', email: 'jc@gmail.com' }, { delay: 5000 });
  await myQueue.add('manegers', { name: 'gnn', email: 'gnn@gmail.com' });
  await myQueue.add('manegers', { name: 'gnn', email: 'gnn@gmail.com' });

  const worker = new Worker(
    'email',
    async (job: Job) => {
      console.log('O Job-Data', job.data)
      // Optionally report some progress
      // await job.updateProgress(42);

      // Optionally sending an object as progress
      //await job.updateProgress({ foo: 'bar' });

      // Do something with job
      return 'finished worker...';
    },
    { autorun: false },
  );

  worker.on('progress', (job: Job, progress: number | object) => {
    console.log('progress >>>>>> ')
  });

  worker.on('completed', (job: Job, returnvalue: any) => {
    console.log('completed >>>>> ')
  });

  worker.on('failed', (error: any) => {
    // Do something with the return value.
    console.log('erro: ', error)
  });
  

  await worker.run();   

  const serverAdapter = new ExpressAdapter();
  
  //const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    const bullBoard = createBullBoard({
      queues: [new BullAdapter(myQueue,{ allowRetries: true, readOnlyMode: true })],
      serverAdapter,
      options: {
        uiConfig: {
          boardTitle: 'My BOARD',
          boardLogo: {
            path: 'https://cdn.my-domain.com/logo.png',
            width: '100px',
            height: 200,
          },
          miscLinks: [{text: 'Logout', url: '/logout'}],
          favIcon: {
            default: 'static/images/logo.svg',
            alternative: 'static/favicon-32x32.png',
          },
        },
      },
    });
    
  serverAdapter.setBasePath('/admin/queues');
  return serverAdapter.getRouter();

}


export default bullMGMonitor;
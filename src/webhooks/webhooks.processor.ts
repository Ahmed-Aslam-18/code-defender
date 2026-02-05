import { Job } from 'bullmq';
import { Processor } from '@nestjs/bullmq';
import { WorkerHost } from '@nestjs/bullmq';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
    async process(job: Job<any>): Promise<any> {
        console.log(job.data);
        console.log('Ahmed');
        return job.data;
    }
}

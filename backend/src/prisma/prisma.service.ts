import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { withOptimize } from "@prisma/extension-optimize";
import 'dotenv/config';
import { setTimeout } from "timers/promises";
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        super()
    }
    async onModuleInit() {
        console.log('On Module Init')
        if (!process.env.PRISMA_OPTIMIZE_API_KEY) {
            throw new Error('PRISMA_OPTIMIZE_API_KEY is not set');
        }
        try {


            console.log('Creating Prisma client');
            const prisma = new PrismaClient().$extends(
                withOptimize({ apiKey: process.env.PRISMA_OPTIMIZE_API_KEY })
            )

            console.log('Created Prisma client');

            Object.assign(this, prisma);

            console.log('Connecting to database');
            await this.$connect();

            console.log('Waiting 2 seconds');
            setTimeout(2000);

            console.log('Fetching data from database');
            await this.user.findMany();

            console.log('Fetching offers from database');
            await this.offer.findMany();

            console.log('Fetching messages from database');
            await this.message.findMany();

            console.log('Database initialized!');
        } catch (error) {
            console.error('Error initializing database', error);
        }
    }
}
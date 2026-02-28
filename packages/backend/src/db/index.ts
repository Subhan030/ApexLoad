import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import { LoadTestConfig, AggregatedStats } from '../types';

const connectionString = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/apexload';

// Create Prisma adapter for MySQL using connection string
const adapter = new PrismaMariaDb(connectionString);

// Initialize Prisma Client with the MySQL adapter
const prisma = new PrismaClient({ adapter });

export { prisma };

export async function saveConfig(id: string, name: string, config: LoadTestConfig): Promise<void> {
    await prisma.testConfig.upsert({
        where: { id },
        update: { name, configJson: config as any },
        create: { id, name, configJson: config as any },
    });
}

export async function getConfigs(): Promise<Array<{ id: string; name: string; config: LoadTestConfig; createdAt: Date }>> {
    const rows = await prisma.testConfig.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        config: r.configJson as unknown as LoadTestConfig,
        createdAt: r.createdAt,
    }));
}

export async function saveResult(
    id: string, configId: string, startedAt: Date, status: string,
    stats?: AggregatedStats, endedAt?: Date
): Promise<void> {
    await prisma.testResult.upsert({
        where: { id },
        update: { endedAt: endedAt ?? null, status, statsJson: stats ? (stats as any) : undefined },
        create: { id, configId, startedAt, endedAt: endedAt ?? null, status, statsJson: stats ? (stats as any) : undefined },
    });
}

export async function getResults(limit = 50): Promise<any[]> {
    return prisma.testResult.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: { config: { select: { name: true, configJson: true } } },
    });
}

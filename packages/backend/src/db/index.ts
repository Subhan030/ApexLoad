import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { LoadTestConfig, AggregatedStats } from '../types';

// SQLite database file path from environment
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';

// Create Prisma adapter for SQLite
const adapter = new PrismaBetterSqlite3({ url: dbPath });

// Initialize Prisma Client with the SQLite adapter
const prisma = new PrismaClient({ adapter });

export { prisma };

export async function saveConfig(id: string, name: string, config: LoadTestConfig): Promise<void> {
    await prisma.testConfig.upsert({
        where: { id },
        update: { name, configJson: JSON.stringify(config) },
        create: { id, name, configJson: JSON.stringify(config) },
    });
}

export async function getConfigs(): Promise<Array<{ id: string; name: string; config: LoadTestConfig; createdAt: Date }>> {
    const rows = await prisma.testConfig.findMany({
        orderBy: { createdAt: 'desc' },
    });
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        config: JSON.parse(r.configJson) as LoadTestConfig,
        createdAt: r.createdAt,
    }));
}

export async function saveResult(
    id: string, configId: string, startedAt: Date, status: string,
    stats?: AggregatedStats, endedAt?: Date
): Promise<void> {
    await prisma.testResult.upsert({
        where: { id },
        update: { endedAt: endedAt ?? null, status, statsJson: stats ? JSON.stringify(stats) : undefined },
        create: { id, configId, startedAt, endedAt: endedAt ?? null, status, statsJson: stats ? JSON.stringify(stats) : undefined },
    });
}

export async function getResults(limit = 50): Promise<any[]> {
    return prisma.testResult.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: { config: { select: { name: true, configJson: true } } },
    });
}

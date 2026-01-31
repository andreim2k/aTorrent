import { FastifyInstance } from 'fastify';
import si from 'systeminformation';

export function systemRoutes(app: FastifyInstance) {
  app.get('/api/system', async () => {
    const [fsData, cpuInfo, load, mem, temp] = await Promise.all([
      si.fsSize(),
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature(),
    ]);

    const rootFs = fsData.find(fs => fs.mount === '/');

    return {
      disk: rootFs ? [{
        mount: rootFs.mount,
        type: rootFs.type,
        size: rootFs.size,
        used: rootFs.used,
        available: rootFs.available,
        usePercent: rootFs.use,
      }] : [],
      cpu: {
        model: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
        cores: cpuInfo.cores,
        loadPercent: Math.round(load.currentLoad * 10) / 10,
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usePercent: Math.round((mem.used / mem.total) * 1000) / 10,
      },
      temperature: {
        main: temp.main,
        max: temp.max,
      },
    };
  });
}

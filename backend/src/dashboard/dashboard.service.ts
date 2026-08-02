import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalAlerts,
      openAlerts,
      totalIocs,
      totalCves,
      severityCounts,
      alertsForTrend,
      iocCountries,
      iocSources,
      rulesWithAlerts,
    ] = await Promise.all([
      this.prisma.alert.count(),
      this.prisma.alert.count({
        where: { status: { in: ['NEW', 'TRIAGED'] } },
      }),
      this.prisma.ioc.count(),
      this.prisma.cve.count(),

      // Severity Distribution
      this.prisma.alert.groupBy({
        by: ['severity'],
        _count: { id: true },
      }),

      // Trend data (last 7 days or recent alerts)
      this.prisma.alert.findMany({
        select: { createdAt: true, severity: true },
        orderBy: { createdAt: 'asc' },
        take: 500,
      }),

      // Top Targeted Countries
      this.prisma.ioc.groupBy({
        by: ['country'],
        where: { country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Top IOC Sources
      this.prisma.ioc.groupBy({
        by: ['source'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Rule Performance (rules with alert counts)
      this.prisma.detectionRule.findMany({
        select: {
          id: true,
          name: true,
          severity: true,
          _count: { select: { alerts: true } },
        },
        orderBy: { alerts: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    // Format Severity Breakdown
    const severityDistribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    severityCounts.forEach((sc) => {
      if (sc.severity in severityDistribution) {
        severityDistribution[sc.severity as keyof typeof severityDistribution] = sc._count.id;
      }
    });

    // Format Trend Data (group by date)
    const trendMap = new Map<string, number>();
    // Default to last 7 days
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, 0);
    }
    alertsForTrend.forEach((a) => {
      const dateStr = a.createdAt.toISOString().split('T')[0];
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });

    const alertVolumeTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Format Top Countries
    const topTargetedCountries = iocCountries.map((c) => ({
      country: c.country || 'Unknown',
      count: c._count.id,
    }));

    // Format Top Sources
    const topIocSources = iocSources.map((s) => ({
      source: s.source,
      count: s._count.id,
    }));

    // Format Rule Performance
    const rulePerformance = rulesWithAlerts.map((r) => ({
      id: r.id,
      name: r.name,
      severity: r.severity,
      alertCount: r._count.alerts,
    }));

    return {
      totalAlerts,
      openAlerts,
      totalIocs,
      totalCves,
      severityDistribution,
      alertVolumeTrend,
      topTargetedCountries,
      topIocSources,
      rulePerformance,
    };
  }
}

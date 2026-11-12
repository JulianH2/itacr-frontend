import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type Observable, delay, of, throwError } from 'rxjs';

import { EmployeeRole } from '@shared/auth/auth.models';

import type {
  AccessRequests,
  ChannelMetrics,
  ManagerChannel,
  ManagerDashboard,
  ManagerOrderRow,
  ManagerOrdersPage,
  ManagerOrdersQuery,
  PendingAccount,
  PendingPinReset,
  TrendPoint,
} from '../models/manager.models';
import type { ManagerApi } from './manager-api';

const MOCK_LATENCY_MS = 300;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HTTP_NOT_FOUND = 404;

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * MINUTE_MS).toISOString();
}

/** A few orders for each hour of the day, with the preparation times of a restaurant where pickup is slower. */
function sampleOrders(from: Date, to: Date): ManagerOrderRow[] {
  const orders: ManagerOrderRow[] = [];
  let number = 100;
  for (let hour = from.getTime(); hour < to.getTime(); hour += HOUR_MS) {
    const localHour = new Date(hour).getHours();
    // Lunch and dinner are the busy hours; the restaurant is closed at night.
    const busy = [13, 14, 20, 21].includes(localHour)
      ? 5
      : localHour >= 9 && localHour <= 22
        ? 3
        : 0;
    for (let index = 0; index < busy; index++) {
      const pickup = index % 3 === 2;
      const createdAt = hour + index * 11 * MINUTE_MS;
      if (createdAt > Date.now()) {
        continue;
      }
      const prepMinutes = pickup ? 18 + (index % 4) * 3 : 9 + (index % 3) * 2;
      const delivered = createdAt + (prepMinutes + 6) * MINUTE_MS < Date.now() - 20 * MINUTE_MS;
      number += 1;
      orders.push({
        id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
        orderNumber: number,
        channel: pickup ? 'MobileApp' : index % 2 === 0 ? 'DineIn' : 'TakeAway',
        status: delivered ? 'Delivered' : 'New',
        tableNumber: !pickup && index % 2 === 0 ? 1 + (number % 10) : null,
        total: 79 + (number % 7) * 22,
        createdAt: new Date(createdAt).toISOString(),
        readyAt: delivered ? new Date(createdAt + prepMinutes * MINUTE_MS).toISOString() : null,
        deliveredAt: delivered
          ? new Date(createdAt + (prepMinutes + 6) * MINUTE_MS).toISOString()
          : null,
        preparationSeconds: delivered ? prepMinutes * 60 : null,
      });
    }
  }
  return orders;
}

function groupOf(order: ManagerOrderRow): ManagerChannel {
  return order.channel === 'MobileApp' ? 'Pickup' : 'Waiter';
}

function channelMetrics(
  channel: ManagerChannel,
  orders: readonly ManagerOrderRow[],
): ChannelMetrics {
  const own = orders.filter((order) => groupOf(order) === channel);
  const prepared = own.filter((order) => order.preparationSeconds !== null);
  const delivered = own.filter((order) => order.status === 'Delivered');
  return {
    channel,
    orders: own.length,
    deliveredOrders: delivered.length,
    sales: delivered.reduce((sum, order) => sum + order.total, 0),
    preparedOrders: prepared.length,
    averagePreparationSeconds:
      prepared.length === 0
        ? null
        : Math.round(
            prepared.reduce((sum, order) => sum + (order.preparationSeconds ?? 0), 0) /
              prepared.length,
          ),
  };
}

function trendOf(orders: readonly ManagerOrderRow[]): TrendPoint[] {
  const hours = new Map<number, { orders: number; sales: number }>();
  const bucket = (instant: string): number =>
    Math.floor(new Date(instant).getTime() / HOUR_MS) * HOUR_MS;
  for (const order of orders) {
    const created = hours.get(bucket(order.createdAt)) ?? { orders: 0, sales: 0 };
    hours.set(bucket(order.createdAt), { ...created, orders: created.orders + 1 });
    if (order.deliveredAt !== null) {
      const delivered = hours.get(bucket(order.deliveredAt)) ?? { orders: 0, sales: 0 };
      hours.set(bucket(order.deliveredAt), { ...delivered, sales: delivered.sales + order.total });
    }
  }
  return [...hours.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, value]) => ({ hourStart: new Date(hour).toISOString(), ...value }));
}

/**
 * In-memory dashboard for `useMockApi: true`: it adds up some sample orders with the same rules as the API, and keeps a few access
 * requests that disappear as the manager answers them.
 */
@Injectable()
export class MockManagerApiService implements ManagerApi {
  private accounts: readonly PendingAccount[] = [
    {
      id: 'mock-account-1',
      fullName: 'Ana López',
      role: EmployeeRole.Waiter,
      requestedAt: minutesAgo(35),
    },
    {
      id: 'mock-account-2',
      fullName: 'Luis Pérez',
      role: EmployeeRole.Kitchen,
      requestedAt: minutesAgo(12),
    },
  ];

  private pinResets: readonly PendingPinReset[] = [
    {
      employeeId: 'mock-reset-1',
      fullName: 'Marta Ruiz',
      role: EmployeeRole.Waiter,
      requestedAt: minutesAgo(5),
    },
  ];

  getDashboard(from: string, to: string): Observable<ManagerDashboard> {
    const orders = sampleOrders(new Date(from), new Date(to));
    const channels = [channelMetrics('Waiter', orders), channelMetrics('Pickup', orders)];
    const timed = channels.filter((channel) => channel.averagePreparationSeconds !== null);
    const slowest =
      timed.length === 2 &&
      timed[0].averagePreparationSeconds !== timed[1].averagePreparationSeconds
        ? timed.reduce((a, b) =>
            (a.averagePreparationSeconds ?? 0) >= (b.averagePreparationSeconds ?? 0) ? a : b,
          ).channel
        : null;
    return of({
      from,
      to,
      totalOrders: orders.length,
      deliveredOrders: channels.reduce((sum, channel) => sum + channel.deliveredOrders, 0),
      sales: channels.reduce((sum, channel) => sum + channel.sales, 0),
      channels,
      slowestChannel: slowest,
      trend: trendOf(orders),
    }).pipe(delay(MOCK_LATENCY_MS));
  }

  getOrders(query: ManagerOrdersQuery): Observable<ManagerOrdersPage> {
    const matching = sampleOrders(new Date(query.from), new Date(query.to))
      .filter((order) => query.channel === null || groupOf(order) === query.channel)
      .filter((order) => query.status === null || order.status === query.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const skip = (query.page - 1) * query.pageSize;
    return of({
      page: query.page,
      pageSize: query.pageSize,
      totalCount: matching.length,
      items: matching.slice(skip, skip + query.pageSize),
    }).pipe(delay(MOCK_LATENCY_MS));
  }

  getAccessRequests(): Observable<AccessRequests> {
    return of({ accounts: this.accounts, pinResets: this.pinResets }).pipe(delay(MOCK_LATENCY_MS));
  }

  approveAccount(employeeId: string): Observable<void> {
    return this.removeAccount(employeeId);
  }

  rejectAccount(employeeId: string): Observable<void> {
    return this.removeAccount(employeeId);
  }

  assignTemporaryPin(employeeId: string): Observable<void> {
    if (!this.pinResets.some((reset) => reset.employeeId === employeeId)) {
      return notFound();
    }
    this.pinResets = this.pinResets.filter((reset) => reset.employeeId !== employeeId);
    return of(undefined).pipe(delay(MOCK_LATENCY_MS));
  }

  private removeAccount(employeeId: string): Observable<void> {
    if (!this.accounts.some((account) => account.id === employeeId)) {
      return notFound();
    }
    this.accounts = this.accounts.filter((account) => account.id !== employeeId);
    return of(undefined).pipe(delay(MOCK_LATENCY_MS));
  }
}

function notFound(): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status: HTTP_NOT_FOUND }));
}

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const queryToken = client.handshake.query?.token as string;
      let token = queryToken;

      if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      if (!token) {
        this.logger.warn(`Client connection rejected: Missing token (Socket ID: ${client.id})`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-prod',
      });

      client.data.user = payload;
      this.logger.log(`Client connected: ${payload.email} [Role: ${payload.role}] (Socket ID: ${client.id})`);
      
      client.emit('connected', {
        message: 'Successfully connected to NCTIP Live Threat Intelligence Socket',
        user: { id: payload.sub, email: payload.email, role: payload.role },
      });
    } catch (err: any) {
      this.logger.warn(`Client connection rejected: Invalid JWT token - ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: Socket ID ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  @SubscribeMessage('alert:write_action')
  handleWriteAction(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const user = client.data?.user;
    if (!user || user.role === 'READ_ONLY') {
      const response = {
        event: 'alert:write_action:response',
        status: 'FORBIDDEN',
        code: 403,
        error: 'AccessDenied: READ_ONLY socket session cannot execute write actions over WebSockets',
        timestamp: new Date().toISOString(),
      };
      client.emit('alert:write_action:response', response);
      return response;
    }
    const response = {
      event: 'alert:write_action:response',
      status: 'SUCCESS',
      code: 200,
      message: `Write action '${data?.action || 'STATUS_UPDATE'}' executed by ${user.email} (${user.role})`,
      timestamp: new Date().toISOString(),
    };
    client.emit('alert:write_action:response', response);
    return response;
  }

  /**
   * Broadcast newly created alert to all connected sockets respecting RBAC.
   */
  broadcastAlertCreated(alert: any) {
    if (!this.server) return;
    this.logger.log(`Broadcasting alert:created event for Alert #${alert.id} (${alert.severity})`);

    const sockets = Array.from(this.server.sockets.sockets.values());
    for (const socket of sockets) {
      const user = socket.data?.user;
      if (!user) continue;

      const isWritePermitted = user.role === 'ADMIN' || user.role === 'SOC_ANALYST' || user.role === 'INVESTIGATOR';

      const baseAlert = {
        id: alert.id,
        source: alert.source,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        score: alert.score,
        occurrenceCount: alert.occurrenceCount,
        lastSeen: alert.lastSeen,
        attackTechniqueIds: alert.attackTechniqueIds || [],
        sourceIoc: alert.sourceIoc,
        sourceCve: alert.sourceCve,
        sourceMalware: alert.sourceMalware,
        createdAt: alert.createdAt,
      };

      const payload = {
        alert: {
          ...baseAlert,
          rbacContext: {
            roleAssigned: user.role,
            writeAccessPermitted: isWritePermitted,
            // Sensitive internal write parameters restricted to ADMIN/ANALYST only:
            ...(isWritePermitted
              ? {
                  systemAuditDetails: {
                    internalNodeIp: '10.0.4.12',
                    writeToken: `session-token-${user.id.slice(0, 8)}`,
                    soarActionEndpoint: `/api/playbooks/execute/${alert.id}`,
                  },
                }
              : {
                  systemAuditDetails: null,
                }),
          },
        },
        timestamp: new Date().toISOString(),
      };

      socket.emit('alert:created', payload);
    }
  }

  /**
   * Broadcast alert severity or status change in real time.
   */
  broadcastAlertUpdated(alert: any) {
    if (!this.server) return;
    this.logger.log(`Broadcasting alert:updated event for Alert #${alert.id}`);
    
    this.server.emit('alert:updated', {
      alert,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast new or updated Threat Campaign.
   */
  broadcastCampaignUpdated(campaign: any) {
    if (!this.server) return;
    this.logger.log(`Broadcasting campaign:updated event for Campaign #${campaign.id} (${campaign.name})`);

    this.server.emit('campaign:updated', {
      campaign,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast completed live feed sync event.
   */
  broadcastFeedSyncCompleted(log: any) {
    if (!this.server) return;
    this.logger.log(`Broadcasting feed_sync:completed for feed #${log.feedId}`);

    this.server.emit('feed_sync:completed', {
      log,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast completed SOAR playbook execution event.
   */
  broadcastPlaybookCompleted(execution: any) {
    if (!this.server) return;
    this.logger.log(`Broadcasting playbook:completed for PlaybookExecution #${execution.id}`);

    this.server.emit('playbook:completed', {
      execution,
      timestamp: new Date().toISOString(),
    });
  }
}

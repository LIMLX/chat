import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import * as amqp from 'amqplib';

// 党史模块socket
@WebSocketGateway(13008)
export class HistorySocket implements OnGatewayInit {
    socketName = "党史-13008---";
    @WebSocketServer() server: Server;
    connection: amqp.Connection;
    channels: amqp.Channel;
    connectSum = 0;
    user: string[] = [];
    team: string[][] = []

    // 初始连接
    async handleConnection(client: Socket) {
        const token = client.handshake.headers.authorization;
        // 客户端连接事件
        console.log('客户端连接id ： ' + client.id);
        this.userLink(token, client.id);
    }

    // 断开连接
    handleDisconnect(client: Socket) {
        // 客户端断开连接事件
        console.log('断开id: ' + client.id);
        this.userDisconnect(client.id);
        // 记录是否还有消费者在内
        if (this.connectSum <= 0) {
            console.log('无人访问关闭');
            this.connectSum = 0;
        }
    }

    // 初始化
    async afterInit(server: Server) {
        // WebSocket服务器初始化事件
        console.log('socket用户初始化');
        this.team["1000"] = ["user1", "user2", "user3"]
        // MQ消费者监听
        try {
            // 给指定用户发送消息
        } catch (error) {
            console.log("RabbitMQ消费者接收错误");
            console.error(error);
        }
    }

    // // 接收消息
    @SubscribeMessage('send')
    handleMessage(client: Socket, payload: string): void {
        const token = client.handshake.headers.authorization;
        let message = { "user": token, "team": undefined, "sender": undefined, "message": undefined };
        try {
            message = JSON.parse(payload);
        } catch (error) {
            console.error(error);
        }
        // 一对一聊天的情况
        if (message.user) {
            this.server.to(this.user[message.user]).emit('receive', { sender: message.sender, message: message.message });
        }
        // 群聊天的情况
        if (message.team) {
            if (this.team[message.team]) {
                this.team[message.team].forEach(data => {
                    this.server.to(this.user[data]).emit('receive', { sender: message.sender, message: message.message });
                })
            }
        }
    }

    // 用户连接
    async userLink(userId: string, socketId: string) {
        // 成功连接后，将其数据存入user中
        this.user[userId] = socketId;
        this.connectSum++;
    }

    // 用户断开连接
    async userDisconnect(socketId: string) {
        for (const [key, value] of Object.entries(this.user)) {
            if (value === socketId) {
                delete this.user[key]; // 移除断开连接的用户
                this.connectSum--;
                break;
            }
        }
    }
}
import { Module } from '@nestjs/common';
import { HistorySocket } from './socket/chat.socket';

@Module({
  imports: [],
  controllers: [],
  providers: [HistorySocket],
})
export class AppModule { }

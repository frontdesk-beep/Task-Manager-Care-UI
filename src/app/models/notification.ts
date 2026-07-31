export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  taskId?: number;
  isRead: boolean;
  createdOn: Date;
}
import { Notification } from '../../types/client';
import { createGenericSlice } from './main/genericSlice';

const notificationsSlice = createGenericSlice<Notification>('notifications', []);

export const {
  addItem: addNotification,
  updateItem: updateNotification,
  removeItem: removeNotification,
  setList: setNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;

import Task from '../models/Task.js';
import FocusSettings from '../models/FocusSettings.js';
import { defaultTasks } from './defaultData.js';

export async function seedDatabase() {
  const [taskCount, settingsCount] = await Promise.all([
    Task.countDocuments(),
    FocusSettings.countDocuments(),
  ]);

  if (taskCount === 0) {
    await Task.insertMany(defaultTasks);
  }

  if (settingsCount === 0) {
    await FocusSettings.create({
      key: 'default',
      focusDuration: 25,
      breakDuration: 5,
    });
  }
}

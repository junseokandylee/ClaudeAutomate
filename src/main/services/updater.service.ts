/**
 * UpdaterService - Auto-Update Service
 *
 * Manages automatic application updates using electron-updater.
 * Handles update checking, downloading, and installation with user notifications.
 *
 * BUILD-TASK-002: Auto-Update Service
 */

import { autoUpdater } from 'electron-updater';
import { dialog } from 'electron';
import { LoggerService } from '../logging';

export class UpdaterService {
  private logger: LoggerService;

  constructor() {
    this.logger = new LoggerService('UpdaterService');

    // Configure autoUpdater
    autoUpdater.logger = this.logger;
    autoUpdater.autoDownload = false; // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true; // Install on quit

    this.registerEventListeners();
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    this.logger.info('Checking for updates...');
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.logger.error('Failed to check for updates:', error);
      throw error;
    }
  }

  /**
   * Register event listeners for update events
   */
  private registerEventListeners(): void {
    // Update available
    autoUpdater.on('update-available', (info) => {
      this.logger.info('Update available:', info.version);
      this.notifyUpdateAvailable(info);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      this.logger.info('Update downloaded:', info.version);
      this.notifyUpdateDownloaded(info);
    });

    // Update error
    autoUpdater.on('error', (error) => {
      this.logger.error('Update error:', error);
      this.notifyUpdateError(error);
    });

    // Update not available
    autoUpdater.on('update-not-available', (info) => {
      this.logger.info('Update not available, current version:', info.version);
    });
  }

  /**
   * Notify user that an update is available
   */
  private async notifyUpdateAvailable(info: any): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Current version: ${info.currentVersion}.`,
      buttons: ['Download', 'Later'],
      defaultId: 0,
    });

    if (result.response === 0) {
      this.logger.info('User chose to download update');
      autoUpdater.downloadUpdate();
    } else {
      this.logger.info('User chose to download update later');
    }
  }

  /**
   * Notify user that update is downloaded and ready to install
   */
  private async notifyUpdateDownloaded(info: any): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded. Restart to apply updates.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    });

    if (result.response === 0) {
      this.logger.info('User chose to restart and install update');
      autoUpdater.quitAndInstall();
    } else {
      this.logger.info('User chose to install update later');
    }
  }

  /**
   * Notify user of update error
   */
  private async notifyUpdateError(error: Error): Promise<void> {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Update Error',
      message: `Failed to check for updates: ${error.message}`,
      buttons: ['OK'],
    });
  }

  /**
   * Dispose of resources and remove event listeners
   */
  dispose(): void {
    this.logger.info('Disposing UpdaterService');
    // Remove all event listeners
    try {
      // @ts-ignore - removeAllListeners may not be in types but exists at runtime
      if (typeof autoUpdater.removeAllListeners === 'function') {
        autoUpdater.removeAllListeners();
      }
    } catch (error) {
      this.logger.error('Error removing listeners:', error);
    }
  }
}

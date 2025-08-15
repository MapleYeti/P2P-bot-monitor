
import chokidar from 'chokidar';
import fs from 'fs';

import config from './config.js';
import { processLogFile } from './app/processLogFile.js';
import { validateConfig, getConfigSummary } from './utils/configValidator.js';
import { info, error, success } from './app/utils/logger.js';
import { FILE_WATCH_CONFIG, FILE_OPERATIONS } from './app/constants.js';

// Validate configuration before starting
if (!validateConfig(config)) {
    error('Configuration validation failed. Please check your config.js file.');
    process.exit(1);
}

const BASE_LOG_DIR = config.BASE_LOG_DIR;
const configSummary = getConfigSummary(config);

info(`Starting bot monitor...`, 'Server');
info(`Watching directory: ${configSummary.baseLogDir}`, 'Server');
info(`Bot chat webhook: ${configSummary.botChatWebhookConfigured ? 'Configured' : 'Not configured'}`, 'Server');
info(`Monitoring ${configSummary.botCount} bots: ${configSummary.botNames.join(', ') || 'None'}`, 'Server');

const fileOffsets = new Map();

const watcher = chokidar.watch(BASE_LOG_DIR, {
    persistent: true,
    usePolling: true,
    interval: FILE_WATCH_CONFIG.POLLING_INTERVAL,
    ignoreInitial: false,
    ignored: (filePath) => {
        // Ignore everything except .log files and directories
        try {
            return !filePath.endsWith('.log') && !fs.statSync(filePath).isDirectory();
        } catch {
            return false; // In case file is deleted during check
        }
    },
});

watcher
    .on(FILE_OPERATIONS.ADD, (filePath) => {
        try {
            info(`New log file detected: ${filePath}`, 'FileWatcher');
            const fileSize = fs.statSync(filePath).size;
            fileOffsets.set(filePath, fileSize);
        } catch (err) {
            error(`Error processing new file ${filePath}: ${err.message}`, 'FileWatcher');
        }
    })
    .on(FILE_OPERATIONS.CHANGE, async (filePath) => {
        try {
            info(`File changed: ${filePath}`, 'FileWatcher');
            await processLogFile(filePath, fileOffsets);
        } catch (err) {
            error(`Error processing file change ${filePath}: ${err.message}`, 'FileWatcher');
        }
    })
    .on(FILE_OPERATIONS.ERROR, (err) => {
        error(`Watcher error: ${err.message}`, 'FileWatcher');
    })
    .on(FILE_OPERATIONS.READY, () => {
        success('Initial scan complete. Watching for changes...', 'FileWatcher');
    });

// Graceful shutdown handling
process.on('SIGINT', () => {
    info('Shutting down gracefully...', 'Server');
    watcher.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    info('Shutting down gracefully...', 'Server');
    watcher.close();
    process.exit(0);
});

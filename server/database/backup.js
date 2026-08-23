const fs = require('fs');
const path = require('path');

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const MAX_BACKUPS = 10;
let backupTimer = null;
let backupInProgress = false;

function getBackupDir(dbPath) {
  return process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');
}

function getBackupFiles(backupDir) {
  return fs.readdirSync(backupDir)
    .filter((file) => /^gacha-game-\d+\.db$/.test(file))
    .map((file) => path.join(backupDir, file))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
}

function restoreLatestBackup(dbPath) {
  if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) return false;

  const backupDir = getBackupDir(dbPath);
  if (!fs.existsSync(backupDir)) return false;
  const [latestBackup] = getBackupFiles(backupDir);
  if (!latestBackup) return false;

  fs.copyFileSync(latestBackup, dbPath);
  console.log(`♻️ Banco restaurado do backup ${path.basename(latestBackup)}`);
  return true;
}

async function backupDatabase(db, dbPath) {
  if (backupInProgress) return false;
  backupInProgress = true;
  const backupDir = getBackupDir(dbPath);
  const timestamp = Date.now();
  const temporaryPath = path.join(backupDir, `gacha-game-${timestamp}.tmp`);
  const backupPath = path.join(backupDir, `gacha-game-${timestamp}.db`);

  try {
    fs.mkdirSync(backupDir, { recursive: true });
    await db.backup(temporaryPath);
    fs.renameSync(temporaryPath, backupPath);

    const backups = getBackupFiles(backupDir);
    backups.slice(MAX_BACKUPS).forEach((file) => fs.rmSync(file, { force: true }));
    console.log(`💾 Backup salvo: ${path.basename(backupPath)}`);
    return true;
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    console.error(`⚠️ Falha ao salvar backup: ${error.message}`);
    return false;
  } finally {
    backupInProgress = false;
  }
}

function startBackupScheduler(db, dbPath) {
  const interval = Number(process.env.BACKUP_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
  backupDatabase(db, dbPath);
  backupTimer = setInterval(() => backupDatabase(db, dbPath), interval);
  backupTimer.unref();
}

async function stopBackupScheduler(db, dbPath) {
  if (backupTimer) clearInterval(backupTimer);
  backupTimer = null;
  await backupDatabase(db, dbPath);
}

module.exports = {
  backupDatabase,
  getBackupDir,
  restoreLatestBackup,
  startBackupScheduler,
  stopBackupScheduler,
};
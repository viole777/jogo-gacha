const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const MAX_BACKUPS = 10;
let backupTimer = null;
let backupPromise = null;
let lastBackupAt = null;
let lastBackupError = null;

function getBackupDir(dbPath) {
  return process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');
}

function getBackupFiles(backupDir) {
  return fs.readdirSync(backupDir)
    .filter((file) => /^gacha-game-\d+\.db$/.test(file))
    .map((file) => path.join(backupDir, file))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
}

function isDatabaseUsable(databasePath) {
  if (!fs.existsSync(databasePath) || fs.statSync(databasePath).size === 0) return false;
  let database;
  try {
    database = new Database(databasePath, { readonly: true });
    return database.pragma('integrity_check', { simple: true }) === 'ok';
  } catch (error) {
    return false;
  } finally {
    if (database) database.close();
  }
}

function restoreLatestBackup(dbPath) {
  if (isDatabaseUsable(dbPath)) return false;

  const backupDir = getBackupDir(dbPath);
  if (!fs.existsSync(backupDir)) return false;
  const [latestBackup] = getBackupFiles(backupDir);
  if (!latestBackup) return false;

  if (!isDatabaseUsable(latestBackup)) {
    console.error(`⚠️ Backup inválido ignorado: ${path.basename(latestBackup)}`);
    return false;
  }

  fs.rmSync(dbPath, { force: true });
  fs.rmSync(`${dbPath}-wal`, { force: true });
  fs.rmSync(`${dbPath}-shm`, { force: true });
  fs.copyFileSync(latestBackup, dbPath);
  console.log(`♻️ Banco restaurado do backup ${path.basename(latestBackup)}`);
  return true;
}

async function backupDatabase(db, dbPath) {
  if (backupPromise) return backupPromise;
  const backupDir = getBackupDir(dbPath);
  const timestamp = Date.now();
  const temporaryPath = path.join(backupDir, `gacha-game-${timestamp}.tmp`);
  const backupPath = path.join(backupDir, `gacha-game-${timestamp}.db`);

  backupPromise = (async () => {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      await db.backup(temporaryPath);
      if (!isDatabaseUsable(temporaryPath)) throw new Error('a cópia criada falhou na verificação de integridade');
      fs.renameSync(temporaryPath, backupPath);

      const backups = getBackupFiles(backupDir);
      backups.slice(MAX_BACKUPS).forEach((file) => fs.rmSync(file, { force: true }));
      lastBackupAt = new Date().toISOString();
      lastBackupError = null;
      console.log(`💾 Backup salvo: ${path.basename(backupPath)}`);
      return true;
    } catch (error) {
      fs.rmSync(temporaryPath, { force: true });
      lastBackupError = error.message;
      console.error(`⚠️ Falha ao salvar backup: ${error.message}`);
      return false;
    } finally {
      backupPromise = null;
    }
  })();
  return backupPromise;
}

function startBackupScheduler(db, dbPath) {
  const interval = Number(process.env.BACKUP_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
  backupDatabase(db, dbPath);
  backupTimer = setInterval(() => backupDatabase(db, dbPath), interval);
  backupTimer.unref();
}

function getBackupStatus() {
  return { lastBackupAt, lastBackupError };
}

async function stopBackupScheduler(db, dbPath) {
  if (backupTimer) clearInterval(backupTimer);
  backupTimer = null;
  await backupDatabase(db, dbPath);
}

module.exports = {
  backupDatabase,
  getBackupDir,
  getBackupStatus,
  restoreLatestBackup,
  startBackupScheduler,
  stopBackupScheduler,
};
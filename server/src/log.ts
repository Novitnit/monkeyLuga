import fs from 'fs';
import path from 'path';

const logFilePath = path.join(__dirname, '../../logs/server.log');

const thaiTime = new Date().toLocaleString('th-TH', { 
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

function write(message?: any, ...optionalParams: any[]) {
  
  // รวม message และ optionalParams เข้าด้วยกัน
  const allMessages = [message, ...optionalParams];
  const formattedMessage = allMessages
    .map(msg => typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg)
    .join(' ');
  
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(logFilePath, `${thaiTime} - ${formattedMessage}\n`);
}

function info(message?: any, ...optionalParams: any[]) {
  const allMessages = [message, ...optionalParams];
  const formattedMessage = allMessages
    .map(msg => typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg)
    .join(' ');
  write(`[INFO] ${formattedMessage}`);
}

function error(message?: any, ...optionalParams: any[]) {
  const allMessages = [message, ...optionalParams];
  const formattedMessage = allMessages
    .map(msg => typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg)
    .join(' ');
  write(`[ERROR] ${formattedMessage}`);
}

function warn(message?: any, ...optionalParams: any[]) {
  const allMessages = [message, ...optionalParams];
  const formattedMessage = allMessages
    .map(msg => typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg)
    .join(' ');
  write(`[WARN] ${formattedMessage}`);
}

export default {
  write,
  info,
  error,
  warn
};

import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();

app.get('/', (_, res) => {
  // 读取html文件
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf-8');
  res.set({
    'Content-Type': 'text/html',
  });
  res.send(html);
});

app.get('/api/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });

  // 设置状态码
  res.status(200);
  // 重要：立刻刷新头信息，否则客户端无法收到数据
  res.flushHeaders();

  // 发送事件
  res.write('event: connected\ndata: connect success\n\n');

  // 发送数据
  res.write(`data: Hello, data ${Date.now()}\n\n`);

  // 定时发送数据
  let timer: NodeJS.Timeout | null = setInterval(() => {
    res.write(`data: Hello, data ${Date.now()}\n\n`);
  }, 1000);

  // 自定义事件，5秒后清除数据，客户端监听 clearEvent 事件
  setTimeout(() => {
    res.write('event: clearEvent\ndata: clear data\n\n');
  }, 5000);

  // 自定义事件，10秒后关闭 socket，客户端监听 closeEvent 事件
  setTimeout(() => {
    res.write('event: closeEvent\ndata: close socket\n\n');
  }, 10000);

  // 清除定时器
  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // 监听 socket 关闭
  res.on('close', clearTimer);
  
  // 监听错误
  res.on('error', clearTimer);

  // 监听请求关闭
  req.on('close', clearTimer);
  
  // 监听错误
  req.on('error', clearTimer);
});

app.listen(3000, () => {
  console.log('Server is running on  http://localhost:3000');
});
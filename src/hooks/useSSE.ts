export interface IOptions {
  url: string;
  watchTabActive: boolean
}

let eventSource: EventSource;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let successFn: (data: any) => void = () => { };
let errorFn: (error: Error) => void = () => { };
let retryCount = 0;
let options: IOptions = {
  url: '/api/sse',
  watchTabActive: true,
};

/**
 * 连接 SSE
 * @returns 
 */
function connectSSE() {
  if (eventSource) {
    return
  }
  retryCount++;
  eventSource = new EventSource(options.url);
  eventSource.onopen = () => {
    retryCount = 0;
  }
  eventSource.onmessage = (event) => {
    try {
      successFn(JSON.parse(event.data));
    } catch {
      errorFn(new Error('parse json data error'));
    }
  };
  eventSource.onerror = () => {
    errorFn(new Error('SSE connection error'));
    // 最多重试 10 次，超过 10 次后，不再重试
    if (retryCount >= 10) {
      return;
    }
    retryCount++;
    setTimeout(() => {
      connectSSE();
      // 采取指数级避让
    }, 1000 * Math.pow(2, retryCount));
  };
}

/**
 * 断开 SSE
 */
function disconnectSSE() {
  if (eventSource) {
    eventSource.close();
  }
}

/**
 * 监听 tab 是否激活
 */
function watchTabActive() {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      connectSSE();
    } else {
      disconnectSSE();
    }
  });
}

/**
 * 更新选项
 * @param key 选项的键
 * @param value 选项的值
 */
function updateOptions<K extends keyof IOptions>(key: K, value: IOptions[K]) {
  options[key] = value;
}

/**
 * 使用 SSE
 * @param successCallback 成功回调
 * @param errorCallback 错误回调
 * @param option 选项
 * @param option.url 请求地址
 * @param option.watchTabActive 是否监听 tab 是否激活
 * @returns 
 */
const useSSE = <T>(successCallback: (data: T) => void, errorCallback: (error: Error) => void, option: IOptions) => {
  successFn = successCallback;
  errorFn = errorCallback;
  options = option;
  if (options.watchTabActive) {
    watchTabActive();
  }

  return {
    connectSSE,
    disconnectSSE,
    updateOptions,
  };
};

export default useSSE;
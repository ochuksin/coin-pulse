interface StreamPoint {
  timestamp: number;
  price: number;
}

let tradeData: StreamPoint[] = [];
let socket: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null; // Таймер реконнекта
const MAX_POINTS = 150;

let currentPrice = 0;
let activeCoin = "btcusdt";

const connectWebSocket = () => {
  if (socket) {
    try {
      socket.close();
    } catch {}
  }
  if (pingInterval) clearInterval(pingInterval);
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  const finalUrl = "wss://echo.websocket.org";

  try {
    socket = new WebSocket(finalUrl);
    console.log("[Worker] Создано сокет-соединение:", finalUrl);
  } catch (urlErr) {
    console.error("[Worker] Ошибка создания сокета:", urlErr);
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    console.log("[Worker] Соединение успешно открыто для:", activeCoin);

    // Снижаем частоту до 500мс, чтобы сервер не банил за спам, но график плыл динамично
    pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 500);
  };

  socket.onmessage = () => {
    const volatility = (Math.random() - 0.5) * 2; // [-1, 1]
    let multiplier = 0.0005; // BTC

    if (activeCoin === "ethusdt") multiplier = 0.0008;
    else if (activeCoin === "solusdt") multiplier = 0.0018;

    const priceChange = currentPrice * volatility * multiplier;
    currentPrice = currentPrice + priceChange;
    currentPrice = Math.round(currentPrice * 100) / 100;

    const timestamp = Date.now();
    tradeData.push({ timestamp, price: currentPrice });

    if (tradeData.length > MAX_POINTS) {
      tradeData.shift();
    }

    self.postMessage({ type: "DATA_UPDATE", payload: tradeData });
  };

  //  ЕСЛИ СЕРВЕР ЗАКРЫЛ СОЕДИНЕНИЕ — АВТОМАТИЧЕСКИ ПЕРЕПОДКЛЮЧАЕМСЯ
  socket.onclose = (e) => {
    console.warn(
      "[Worker] WebSocket закрыт сервером. Код:",
      e.code,
      "Запускаем авто-реконнект...",
    );
    scheduleReconnect();
  };

  socket.onerror = (err) => {
    console.error("[Worker] Ошибка сокета:", err);
    scheduleReconnect();
  };
};

const scheduleReconnect = () => {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  // Через 2 секунды пробуем подключиться заново
  reconnectTimeout = setTimeout(() => {
    connectWebSocket();
  }, 2000);
};

self.onmessage = (
  event: MessageEvent<{
    command: string;
    payload?: { coinSymbol: string; basePrice: number };
  }>,
) => {
  const { command, payload } = event.data;

  if (command === "START_STREAM" && payload) {
    activeCoin = payload.coinSymbol.toLowerCase();

    // Если цена еще не задана или мы переключили монету, берем свежую базовую цену
    if (currentPrice === 0 || tradeData.length === 0) {
      currentPrice = payload.basePrice;
    }

    tradeData = [];
    connectWebSocket(); // Запуск
  }

  if (command === "STOP_STREAM") {
    if (socket) {
      try {
        socket.close();
      } catch {}
      socket = null;
    }
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    tradeData = [];
    currentPrice = 0;
  }
};

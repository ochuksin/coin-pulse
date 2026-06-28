interface StreamPoint {
  timestamp: number;
  price: number;
}

const BASE_PRICES: Record<string, number> = {
  btcusdt: 64500,
  ethusdt: 3480,
  solusdt: 145,
};
// Хранилище точек внутри воркера
let tradeData: StreamPoint[] = [];
let socket: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

const MAX_POINTS = 150;
let currentPrice = BASE_PRICES.btcusdt;

// Слушаем команды из главного потока React
self.onmessage = (
  event: MessageEvent<{ command: string; payload?: string }>,
) => {
  const { command, payload } = event.data;
  if (command === "START_STREAM") {
    const coinSymbol = (payload || "btcusdt").toLowerCase();
    // Очищаем старые потоки и таймеры при переключении монеты
    if (socket) socket.close();
    if (pingInterval) clearInterval(pingInterval);
    tradeData = [];

    currentPrice = BASE_PRICES[coinSymbol] || 100;

    const url = `wss://echo.websocket.org`;
    // const url = `wss://://piesocket.com`;
    // const url = `wss://ws.postman-echo.com/raw`;

    try {
      socket = new WebSocket(url);
      console.log("[Worker] WebSocket успешно создан по адресу:", url);
    } catch (error) {
      console.error("[Worker] Ошибка создания сокета:", error);
      return;
    }
    socket.onopen = () => {
      console.log(
        "[Worker] WebSocket-соединение с тестовым сервером успешно открыто!",
      );

      // ПИНГ-ПОНГ: Раз в 200 мс шлем импульс на сервер, сервер возвращает эхо-ответы и создавает непрерывный поток пакетов
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send("ping");
        }
      }, 200);
    };

    socket.onmessage = () => {
      // Имитируем поведение реальной биржи: при каждом входящем WebSocket-пакете генерируем случайное изменение цены Биткоина в реальном времени
      const volatility = (Math.random() - 0.5) * 2; // [-1, 1]
      const priceChange = currentPrice * volatility * 0.0008;
      currentPrice = currentPrice + priceChange;
      // центы
      currentPrice = Math.round(currentPrice * 100) / 100;
      // Когда массив переполняется, сдвигаем график влево
      const timestamp = Date.now();
      tradeData.push({ timestamp, price: currentPrice });

      if (tradeData.length > MAX_POINTS) {
        tradeData.shift();
      }

      // Отправляем массив в главный UI-поток React
      self.postMessage({ type: "DATA_UPDATE", payload: tradeData });
    };
    socket.onerror = (error: Event) => {
      console.error("[Worker] Ошибка внутри WebSocket:", error);
      self.postMessage({ type: "STREAM_ERROR", payload: "WebSocket Error" });
    };
  }
  if (command === "STOP_STREAM") {
    if (socket) {
      socket.close();
      socket = null;
    }
    tradeData = [];
  }
};

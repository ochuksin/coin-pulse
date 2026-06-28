interface StreamPoint {
  timestamp: number;
  price: number;
}
// Хранилище точек внутри воркера
let tradeData: StreamPoint[] = [];
let socket: WebSocket | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;

const MAX_POINTS = 150; // Держим в памяти только последние 300 тиков, чтобы не перегружать RAM
let currentPrice = 64000;

// Слушаем команды из главного потока React
self.onmessage = (
  event: MessageEvent<{ command: string; payload?: string }>,
) => {
  const { command } = event.data;
  if (command === "START_STREAM") {
    if (socket) socket.close();
    if (pingInterval) clearInterval(pingInterval);
    tradeData = [];
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
      const priceChange = Math.round(currentPrice * volatility * 0.0005);
      currentPrice = currentPrice + priceChange;

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

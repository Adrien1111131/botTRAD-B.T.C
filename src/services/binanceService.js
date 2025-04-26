/**
 * Service pour l'API Binance
 * Fournit des données alternatives à CoinGecko
 */

class BinanceService {
  constructor() {
    this.baseUrl = 'https://api.binance.com/api/v3';
  }

  /**
   * Récupère le prix actuel du Bitcoin
   * @returns {Promise<{price: number, change24h: number}>}
   */
  async getBitcoinPrice() {
    try {
      // Récupération du prix actuel
      const priceResponse = await fetch(`${this.baseUrl}/ticker/price?symbol=BTCUSDT`);
      const priceData = await priceResponse.json();
      
      // Récupération des statistiques sur 24h
      const statsResponse = await fetch(`${this.baseUrl}/ticker/24hr?symbol=BTCUSDT`);
      const statsData = await statsResponse.json();
      
      // Calcul du changement en pourcentage sur 24h
      const openPrice = parseFloat(statsData.openPrice);
      const lastPrice = parseFloat(statsData.lastPrice);
      const change24h = ((lastPrice - openPrice) / openPrice) * 100;
      
      return {
        price: parseFloat(priceData.price),
        change24h: change24h
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du prix via Binance:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des prix du Bitcoin
   * @returns {Promise<Array<{time: string, price: number, timestamp: number, volume: number}>>}
   */
  async getBitcoinHistory() {
    try {
      // Récupération des données historiques (intervalles de 1 minute sur les dernières 24h = 1440 minutes)
      const response = await fetch(`${this.baseUrl}/klines?symbol=BTCUSDT&interval=1m&limit=1440`);
      const data = await response.json();
      
      // Transformation des données
      return data.map(candle => {
        const timestamp = candle[0]; // Timestamp d'ouverture
        const open = parseFloat(candle[1]);
        const high = parseFloat(candle[2]);
        const low = parseFloat(candle[3]);
        const close = parseFloat(candle[4]);
        const volume = parseFloat(candle[5]);
        
        return {
          time: new Date(timestamp).toLocaleTimeString(),
          price: close,
          timestamp,
          volume,
          open,
          high,
          low
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique via Binance:', error);
      throw error;
    }
  }

  /**
   * Récupère les données de profondeur du marché (orderbook)
   * @returns {Promise<{bids: Array, asks: Array}>}
   */
  async getOrderBook() {
    try {
      const response = await fetch(`${this.baseUrl}/depth?symbol=BTCUSDT&limit=10`);
      const data = await response.json();
      
      return {
        bids: data.bids.map(bid => ({
          price: parseFloat(bid[0]),
          quantity: parseFloat(bid[1])
        })),
        asks: data.asks.map(ask => ({
          price: parseFloat(ask[0]),
          quantity: parseFloat(ask[1])
        }))
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du carnet d\'ordres:', error);
      throw error;
    }
  }

  /**
   * Récupère les dernières transactions
   * @returns {Promise<Array>}
   */
  async getRecentTrades() {
    try {
      const response = await fetch(`${this.baseUrl}/trades?symbol=BTCUSDT&limit=50`);
      const data = await response.json();
      
      return data.map(trade => ({
        id: trade.id,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        time: new Date(trade.time).toLocaleTimeString(),
        isBuyerMaker: trade.isBuyerMaker
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions récentes:', error);
      throw error;
    }
  }
}

export default new BinanceService();
